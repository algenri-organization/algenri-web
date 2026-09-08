import { getAdminDb } from "@/lib/firebase/admin";
import { listCharges, type ChargeRecord } from "@/lib/finance/store";

const CHARGES = "finance_charges";
const SERIES_EVENTS = "finance_series_events";
const DEFAULT_TENANT_ID = process.env.ALGENRI_TENANT_ID ?? "algenri";

type RecurringCharge = ChargeRecord & { seriesPaused?: boolean };

export type RecurringSeriesSummary = {
  seriesId: string;
  clientName: string;
  description: string;
  recurrenceFrequency: string;
  totalOccurrences: number;
  paidOccurrences: number;
  pendingOccurrences: number;
  pausedOccurrences: number;
  cancelledOccurrences: number;
  nextDueDate: string | null;
  paused: boolean;
  ended: boolean;
};

function receivedFor(charge: RecurringCharge) {
  if (typeof charge.receivedAmountCents === "number") return Math.max(0, charge.receivedAmountCents);
  return charge.status === "paid" ? charge.amountCents : 0;
}

export async function listOperationalCharges() {
  const charges = await listCharges();
  return charges.filter((charge) => !((charge as RecurringCharge).seriesPaused && charge.status === "pending"));
}

export async function listRecurringSeries(): Promise<RecurringSeriesSummary[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection(CHARGES).where("tenantId", "==", DEFAULT_TENANT_ID).get();
  const recurring = snapshot.docs
    .map((doc) => doc.data() as RecurringCharge)
    .filter((charge) => charge.scheduleType === "recurring" && charge.seriesId);

  const grouped = new Map<string, RecurringCharge[]>();
  for (const charge of recurring) {
    const items = grouped.get(charge.seriesId) ?? [];
    items.push(charge);
    grouped.set(charge.seriesId, items);
  }

  const today = new Date().toISOString().slice(0, 10);
  return [...grouped.entries()].map(([seriesId, items]) => {
    const sorted = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const futurePending = sorted.filter((item) => item.status === "pending" && receivedFor(item) === 0 && item.dueDate >= today);
    const activeFuture = futurePending.filter((item) => !item.seriesPaused);
    const pausedFuture = futurePending.filter((item) => item.seriesPaused);
    const cancelledOccurrences = sorted.filter((item) => item.status === "cancelled").length;
    return {
      seriesId,
      clientName: sorted[0]?.clientName ?? "",
      description: sorted[0]?.description ?? "",
      recurrenceFrequency: sorted[0]?.recurrenceFrequency ?? "",
      totalOccurrences: sorted.length,
      paidOccurrences: sorted.filter((item) => item.status === "paid").length,
      pendingOccurrences: activeFuture.length,
      pausedOccurrences: pausedFuture.length,
      cancelledOccurrences,
      nextDueDate: activeFuture[0]?.dueDate ?? null,
      paused: futurePending.length > 0 && pausedFuture.length === futurePending.length,
      ended: futurePending.length === 0 && cancelledOccurrences > 0,
    };
  }).sort((a, b) => (a.nextDueDate ?? "9999").localeCompare(b.nextDueDate ?? "9999"));
}

async function recurringDocs(seriesId: string) {
  const db = await getAdminDb();
  const snapshot = await db.collection(CHARGES).where("tenantId", "==", DEFAULT_TENANT_ID).get();
  const matching = snapshot.docs.filter((doc) => {
    const charge = doc.data() as RecurringCharge;
    return charge.seriesId === seriesId && charge.scheduleType === "recurring";
  });
  if (!matching.length) throw new Error("series_not_found");
  return { db, matching };
}

export async function setRecurringSeriesPaused(seriesId: string, paused: boolean, actor: string) {
  const { db, matching } = await recurringDocs(seriesId);
  const today = new Date().toISOString().slice(0, 10);
  const eligible = matching.filter((doc) => {
    const charge = doc.data() as RecurringCharge;
    return charge.status === "pending" && receivedFor(charge) === 0 && charge.dueDate >= today;
  });
  if (!eligible.length) throw new Error("no_future_occurrences");

  const batch = db.batch();
  const now = new Date().toISOString();
  for (const doc of eligible) batch.set(doc.ref, { seriesPaused: paused, updatedAt: now }, { merge: true });
  const eventRef = db.collection(SERIES_EVENTS).doc();
  batch.set(eventRef, {
    id: eventRef.id,
    tenantId: DEFAULT_TENANT_ID,
    seriesId,
    action: paused ? "paused" : "resumed",
    affectedOccurrences: eligible.length,
    createdBy: actor,
    createdAt: now,
  });
  await batch.commit();

  const series = await listRecurringSeries();
  return series.find((item) => item.seriesId === seriesId) ?? null;
}

export async function endRecurringSeries(seriesId: string, actor: string, reason: string) {
  const normalizedReason = reason.trim();
  if (!normalizedReason) throw new Error("end_reason_required");
  const { db, matching } = await recurringDocs(seriesId);
  const today = new Date().toISOString().slice(0, 10);
  const eligible = matching.filter((doc) => {
    const charge = doc.data() as RecurringCharge;
    return charge.status === "pending" && receivedFor(charge) === 0 && charge.dueDate >= today;
  });
  if (!eligible.length) throw new Error("no_future_occurrences");

  const batch = db.batch();
  const now = new Date().toISOString();
  for (const doc of eligible) {
    batch.set(doc.ref, {
      status: "cancelled",
      seriesPaused: false,
      notes: `${(doc.data() as RecurringCharge).notes || ""}${(doc.data() as RecurringCharge).notes ? "\n" : ""}Recorrência encerrada: ${normalizedReason}`,
      updatedAt: now,
    }, { merge: true });
  }
  const eventRef = db.collection(SERIES_EVENTS).doc();
  batch.set(eventRef, {
    id: eventRef.id,
    tenantId: DEFAULT_TENANT_ID,
    seriesId,
    action: "ended",
    reason: normalizedReason,
    affectedOccurrences: eligible.length,
    createdBy: actor,
    createdAt: now,
  });
  await batch.commit();

  const series = await listRecurringSeries();
  return series.find((item) => item.seriesId === seriesId) ?? null;
}

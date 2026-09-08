import { getAdminDb } from "@/lib/firebase/admin";
import { getClient, getProject } from "@/lib/client-flow/store";

const CHARGES = "finance_charges";
const PAYMENT_EVENTS = "finance_payment_events";
const DEFAULT_TENANT_ID = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type ChargeStatus = "pending" | "paid" | "cancelled";
export type ScheduleType = "single" | "installments" | "recurring";
export type RecurrenceFrequency = "monthly" | "quarterly" | "semiannual" | "annual";
export type BankProvider = "manual" | "c6" | "cora";

export type ChargeRecord = {
  id: string; clientId: string; clientName: string; projectId: string; projectName: string;
  description: string; amountCents: number; dueDate: string; status: ChargeStatus; paidAt: string | null;
  paymentMethod: string; notes: string; tenantId: string; createdBy: string; createdAt: string; updatedAt: string;
  seriesId: string; scheduleType: ScheduleType; installmentIndex: number; installmentCount: number;
  recurrenceFrequency: RecurrenceFrequency | ""; bankProvider: BankProvider; bankChargeId: string;
  providerFeeCents?: number; netAmountCents?: number; settledAt?: string | null; settlementNotes?: string;
  receivedAmountCents?: number; balanceCents?: number; lastPaymentAt?: string | null;
};

export type PaymentEventRecord = {
  id: string; tenantId: string; chargeId: string; clientId: string; type?: "payment" | "reversal";
  amountCents: number; paymentMethod?: string; notes: string; createdBy: string; createdAt: string;
};

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function integer(value: unknown, fallback = 1) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; }
function amountToCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  const normalized = text(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized); return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}
function addMonths(dateString: string, months: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay)));
  return date.toISOString().slice(0, 10);
}
function recurrenceMonths(frequency: RecurrenceFrequency) { return frequency === "quarterly" ? 3 : frequency === "semiannual" ? 6 : frequency === "annual" ? 12 : 1; }
function receivedFor(charge: ChargeRecord) {
  if (typeof charge.receivedAmountCents === "number") return Math.max(0, charge.receivedAmountCents);
  return charge.status === "paid" ? charge.amountCents : 0;
}

export async function listCharges() {
  const db = await getAdminDb();
  const snapshot = await db.collection(CHARGES).where("tenantId", "==", DEFAULT_TENANT_ID).get();
  return snapshot.docs.map((doc) => {
    const charge = doc.data() as ChargeRecord;
    const receivedAmountCents = receivedFor(charge);
    return { ...charge, receivedAmountCents, balanceCents: Math.max(0, charge.amountCents - receivedAmountCents) };
  }).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
}

export async function getCharge(id: string) {
  const db = await getAdminDb(); const doc = await db.collection(CHARGES).doc(id).get();
  if (!doc.exists) return null; const charge = doc.data() as ChargeRecord;
  if (charge.tenantId !== DEFAULT_TENANT_ID) return null;
  const receivedAmountCents = receivedFor(charge);
  return { ...charge, receivedAmountCents, balanceCents: Math.max(0, charge.amountCents - receivedAmountCents) };
}

export async function createChargePlan(input: Record<string, unknown>, createdBy: string) {
  const clientId = text(input.clientId); const client = await getClient(clientId); if (!client) throw new Error("client_not_found");
  const projectId = text(input.projectId); const project = projectId ? await getProject(projectId) : null;
  if (projectId && (!project || project.clientId !== clientId)) throw new Error("project_not_found");
  const description = text(input.description); if (!description) throw new Error("description_required");
  const amountCents = amountToCents(input.amount); if (amountCents <= 0) throw new Error("amount_required");
  const dueDate = text(input.dueDate); if (!dueDate) throw new Error("due_date_required");
  const rawType = text(input.scheduleType) as ScheduleType; const scheduleType: ScheduleType = ["installments","recurring"].includes(rawType) ? rawType : "single";
  const installmentCount = scheduleType === "installments" ? Math.min(integer(input.installmentCount), 60) : 1;
  const rawFrequency = text(input.recurrenceFrequency) as RecurrenceFrequency; const recurrenceFrequency: RecurrenceFrequency = ["quarterly","semiannual","annual"].includes(rawFrequency) ? rawFrequency : "monthly";
  const recurrenceCount = scheduleType === "recurring" ? Math.min(integer(input.recurrenceCount, 12), 60) : 1;
  const bankProviderRaw = text(input.bankProvider) as BankProvider; const bankProvider: BankProvider = ["c6","cora"].includes(bankProviderRaw) ? bankProviderRaw : "manual";
  const count = scheduleType === "installments" ? installmentCount : scheduleType === "recurring" ? recurrenceCount : 1;
  const db = await getAdminDb(); const seriesId = db.collection(CHARGES).doc().id; const now = new Date().toISOString();
  const batch = db.batch(); const records: ChargeRecord[] = [];
  let remainder = amountCents;
  for (let index = 0; index < count; index += 1) {
    const ref = db.collection(CHARGES).doc();
    const partAmount = scheduleType === "installments" ? (index === count - 1 ? remainder : Math.floor(amountCents / count)) : amountCents;
    if (scheduleType === "installments") remainder -= partAmount;
    const monthStep = scheduleType === "recurring" ? recurrenceMonths(recurrenceFrequency) * index : index;
    const itemDueDate = addMonths(dueDate, monthStep);
    const label = scheduleType === "installments" ? `${description} (${index + 1}/${count})` : description;
    const record: ChargeRecord = {
      id: ref.id, clientId, clientName: client.tradeName || client.legalName, projectId, projectName: project?.name || "", description: label,
      amountCents: partAmount, dueDate: itemDueDate, status: "pending", paidAt: null, paymentMethod: text(input.paymentMethod), notes: text(input.notes),
      tenantId: DEFAULT_TENANT_ID, createdBy, createdAt: now, updatedAt: now, seriesId, scheduleType,
      installmentIndex: index + 1, installmentCount: count, recurrenceFrequency: scheduleType === "recurring" ? recurrenceFrequency : "",
      bankProvider, bankChargeId: "", providerFeeCents: 0, netAmountCents: partAmount, settledAt: null, settlementNotes: "",
      receivedAmountCents: 0, balanceCents: partAmount, lastPaymentAt: null,
    };
    batch.set(ref, record); records.push(record);
  }
  await batch.commit(); return records;
}

export async function createCharge(input: Record<string, unknown>, createdBy: string) {
  const records = await createChargePlan({ ...input, scheduleType: "single" }, createdBy); return records[0];
}

export async function updateCharge(id: string, input: Record<string, unknown>) {
  const current = await getCharge(id); if (!current) return null;
  const status = text(input.status) as ChargeStatus;
  const nextStatus: ChargeStatus = ["pending", "paid", "cancelled"].includes(status) ? status : current.status;
  const description = input.description === undefined ? current.description : text(input.description); if (!description) throw new Error("description_required");
  const amountCents = input.amount === undefined ? current.amountCents : amountToCents(input.amount); if (amountCents <= 0) throw new Error("amount_required");
  let receivedAmountCents = current.receivedAmountCents ?? receivedFor(current);
  if (nextStatus === "paid") receivedAmountCents = amountCents;
  if (nextStatus === "pending" && current.status === "paid" && input.status !== undefined) receivedAmountCents = 0;
  if (receivedAmountCents > amountCents) throw new Error("amount_below_received");
  const dueDate = input.dueDate === undefined ? current.dueDate : text(input.dueDate); if (!dueDate) throw new Error("due_date_required");
  const updated: ChargeRecord = {
    ...current, description, amountCents, dueDate, status: nextStatus,
    paymentMethod: input.paymentMethod === undefined ? current.paymentMethod : text(input.paymentMethod), notes: input.notes === undefined ? current.notes : text(input.notes),
    paidAt: nextStatus === "paid" ? (current.paidAt || new Date().toISOString()) : nextStatus === "pending" ? null : current.paidAt,
    receivedAmountCents, balanceCents: Math.max(0, amountCents - receivedAmountCents),
    netAmountCents: current.settledAt ? Math.max(0, amountCents - (current.providerFeeCents ?? 0)) : current.netAmountCents,
    updatedAt: new Date().toISOString(),
  };
  const db = await getAdminDb(); await db.collection(CHARGES).doc(id).set(updated); return updated;
}

export async function listPaymentEvents(chargeId: string) {
  const db = await getAdminDb();
  const snapshot = await db.collection(PAYMENT_EVENTS).where("tenantId", "==", DEFAULT_TENANT_ID).where("chargeId", "==", chargeId).get();
  return snapshot.docs.map((doc) => doc.data() as PaymentEventRecord).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function recordChargePayment(id: string, input: Record<string, unknown>, createdBy: string) {
  const paymentCents = amountToCents(input.amount); if (paymentCents <= 0) throw new Error("payment_amount_required");
  const method = text(input.paymentMethod) || "Pix";
  const notes = text(input.notes);
  const db = await getAdminDb(); const chargeRef = db.collection(CHARGES).doc(id); const eventRef = db.collection(PAYMENT_EVENTS).doc();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(chargeRef); if (!snap.exists) return null;
    const current = snap.data() as ChargeRecord; if (current.tenantId !== DEFAULT_TENANT_ID) return null;
    if (current.status === "cancelled") throw new Error("charge_cancelled");
    const alreadyReceived = receivedFor(current); const balance = Math.max(0, current.amountCents - alreadyReceived);
    if (balance <= 0 || current.status === "paid") throw new Error("charge_already_paid");
    if (paymentCents > balance) throw new Error("payment_exceeds_balance");
    const now = new Date().toISOString(); const receivedAmountCents = alreadyReceived + paymentCents; const paid = receivedAmountCents >= current.amountCents;
    const updated: ChargeRecord = {
      ...current,
      status: paid ? "paid" : "pending",
      paidAt: paid ? now : null,
      paymentMethod: method,
      receivedAmountCents,
      balanceCents: Math.max(0, current.amountCents - receivedAmountCents),
      lastPaymentAt: now,
      updatedAt: now,
    };
    tx.set(chargeRef, updated);
    tx.set(eventRef, { id: eventRef.id, tenantId: DEFAULT_TENANT_ID, chargeId: id, clientId: current.clientId, type: "payment", amountCents: paymentCents, paymentMethod: method, notes, createdBy, createdAt: now });
    return updated;
  });
}

export async function reverseChargePayment(id: string, input: Record<string, unknown>, createdBy: string) {
  const reversalCents = amountToCents(input.amount); if (reversalCents <= 0) throw new Error("reversal_amount_required");
  const notes = text(input.notes); if (!notes) throw new Error("reversal_reason_required");
  const db = await getAdminDb(); const chargeRef = db.collection(CHARGES).doc(id); const eventRef = db.collection(PAYMENT_EVENTS).doc();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(chargeRef); if (!snap.exists) return null;
    const current = snap.data() as ChargeRecord; if (current.tenantId !== DEFAULT_TENANT_ID) return null;
    if (current.status === "cancelled") throw new Error("charge_cancelled");
    const alreadyReceived = receivedFor(current); if (alreadyReceived <= 0) throw new Error("nothing_to_reverse");
    if (reversalCents > alreadyReceived) throw new Error("reversal_exceeds_received");
    const now = new Date().toISOString(); const receivedAmountCents = alreadyReceived - reversalCents;
    const updated: ChargeRecord = {
      ...current,
      status: "pending",
      paidAt: null,
      receivedAmountCents,
      balanceCents: Math.max(0, current.amountCents - receivedAmountCents),
      settledAt: null,
      settlementNotes: current.settledAt ? "Conciliação reaberta após estorno/ajuste de recebimento." : (current.settlementNotes ?? ""),
      providerFeeCents: current.settledAt ? 0 : current.providerFeeCents,
      lastPaymentAt: now,
      updatedAt: now,
    };
    tx.set(chargeRef, updated);
    tx.set(eventRef, { id: eventRef.id, tenantId: DEFAULT_TENANT_ID, chargeId: id, clientId: current.clientId, type: "reversal", amountCents: reversalCents, paymentMethod: current.paymentMethod, notes, createdBy, createdAt: now });
    return updated;
  });
}

export async function reconcileCharge(id: string, input: Record<string, unknown>) {
  const current = await getCharge(id); if (!current) return null;
  if (current.status !== "paid") throw new Error("charge_not_paid");
  const providerFeeCents = input.providerFee === undefined ? (current.providerFeeCents ?? 0) : amountToCents(input.providerFee);
  if (providerFeeCents < 0 || providerFeeCents > current.amountCents) throw new Error("provider_fee_invalid");
  const now = new Date().toISOString();
  const updated: ChargeRecord = {
    ...current,
    providerFeeCents,
    netAmountCents: current.amountCents - providerFeeCents,
    settledAt: now,
    settlementNotes: input.notes === undefined ? (current.settlementNotes ?? "") : text(input.notes),
    receivedAmountCents: current.amountCents,
    balanceCents: 0,
    updatedAt: now,
  };
  const db = await getAdminDb();
  await db.collection(CHARGES).doc(id).set(updated);
  return updated;
}

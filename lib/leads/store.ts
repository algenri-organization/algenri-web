import { getAdminDb } from "@/lib/firebase/admin";

const LEADS_COLLECTION = "commercial_leads";

export type WhatsAppDeliveryStatus = "accepted" | "sent" | "delivered" | "read" | "failed";

export type CommercialLead = {
  id: string;
  name: string;
  company: string;
  whatsapp: string;
  email: string | null;
  interest: string;
  message: string | null;
  source: string;
  status: "new" | "contacted" | "qualified" | "archived";
  consent: true;
  createdAt: string;
  notificationStatus: "pending" | "sent" | "skipped" | "failed";
  notificationError: string | null;
  notificationMessageId?: string | null;
  notificationDeliveryStatus?: WhatsAppDeliveryStatus | null;
  notificationDeliveryAt?: string | null;
  notificationDeliveryError?: string | null;
  notificationRetryCount?: number;
  notificationLastRetryAt?: string | null;
};

export async function createCommercialLead(input: {
  name: string;
  company: string;
  whatsapp: string;
  email?: string;
  interest: string;
  message?: string;
  source?: string;
}) {
  const db = await getAdminDb();
  const ref = db.collection(LEADS_COLLECTION).doc();
  const now = new Date().toISOString();
  const record: CommercialLead = {
    id: ref.id,
    name: input.name.trim(),
    company: input.company.trim(),
    whatsapp: input.whatsapp.trim(),
    email: input.email?.trim() || null,
    interest: input.interest.trim(),
    message: input.message?.trim() || null,
    source: input.source?.trim() || "site-contato",
    status: "new",
    consent: true,
    createdAt: now,
    notificationStatus: "pending",
    notificationError: null,
    notificationMessageId: null,
    notificationDeliveryStatus: null,
    notificationDeliveryAt: null,
    notificationDeliveryError: null,
    notificationRetryCount: 0,
    notificationLastRetryAt: null,
  };

  await ref.set(record);
  return record;
}

export async function getCommercialLead(id: string) {
  const db = await getAdminDb();
  const snap = await db.collection(LEADS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as CommercialLead;
}

export async function updateLeadNotification(
  id: string,
  notificationStatus: CommercialLead["notificationStatus"],
  notificationError: string | null = null,
  notificationMessageId: string | null = null,
) {
  const db = await getAdminDb();
  const patch: Record<string, unknown> = { notificationStatus, notificationError };
  if (notificationMessageId) {
    patch.notificationMessageId = notificationMessageId;
    patch.notificationDeliveryStatus = "accepted";
    patch.notificationDeliveryAt = new Date().toISOString();
    patch.notificationDeliveryError = null;
  }
  await db.collection(LEADS_COLLECTION).doc(id).set(patch, { merge: true });
}

export async function markLeadNotificationRetry(id: string) {
  const db = await getAdminDb();
  const ref = db.collection(LEADS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const current = snap.data() as CommercialLead;
  const patch = {
    notificationRetryCount: Number(current.notificationRetryCount ?? 0) + 1,
    notificationLastRetryAt: new Date().toISOString(),
  };
  await ref.set(patch, { merge: true });
  return { ...current, ...patch } as CommercialLead;
}

export async function updateLeadDeliveryByMessageId(input: {
  messageId: string;
  status: WhatsAppDeliveryStatus;
  timestamp?: string | null;
  error?: string | null;
}) {
  const db = await getAdminDb();
  const snapshot = await db.collection(LEADS_COLLECTION)
    .where("notificationMessageId", "==", input.messageId)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  const ref = snapshot.docs[0].ref;
  await ref.set({
    notificationDeliveryStatus: input.status,
    notificationDeliveryAt: input.timestamp || new Date().toISOString(),
    notificationDeliveryError: input.error || null,
  }, { merge: true });
  return true;
}

export async function listCommercialLeads(limit = 100) {
  const db = await getAdminDb();
  const snapshot = await db.collection(LEADS_COLLECTION).orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => doc.data() as CommercialLead);
}

export async function deleteAllCommercialLeads() {
  const db = await getAdminDb();
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection(LEADS_COLLECTION).limit(400).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    deleted += snapshot.size;

    if (snapshot.size < 400) break;
  }

  return deleted;
}

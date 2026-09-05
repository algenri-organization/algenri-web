import { getAdminDb } from "@/lib/firebase/admin";

const LEADS_COLLECTION = "commercial_leads";

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
  };

  await ref.set(record);
  return record;
}

export async function updateLeadNotification(
  id: string,
  notificationStatus: CommercialLead["notificationStatus"],
  notificationError: string | null = null,
) {
  const db = await getAdminDb();
  await db.collection(LEADS_COLLECTION).doc(id).set({ notificationStatus, notificationError }, { merge: true });
}

export async function listCommercialLeads(limit = 100) {
  const db = await getAdminDb();
  const snapshot = await db.collection(LEADS_COLLECTION).orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => doc.data() as CommercialLead);
}

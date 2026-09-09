import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const COLLECTION = "external_automation_events";

export type ExternalAutomationChannel = "whatsapp" | "email" | "webhook" | "banking";
export type ExternalAutomationStatus = "sent" | "delivered" | "failed" | "skipped" | "queued";

export type ExternalAutomationEvent = {
  id: string;
  kind: string;
  channel: ExternalAutomationChannel;
  status: ExternalAutomationStatus;
  provider: string;
  entityType: string;
  entityId: string;
  providerMessageId: string | null;
  error: string | null;
  occurredAt: string;
};

export async function recordExternalAutomationEvent(input: Omit<ExternalAutomationEvent, "id" | "occurredAt">) {
  const db = await getAdminDb();
  const ref = db.collection(COLLECTION).doc();
  const occurredAt = new Date().toISOString();
  const record: ExternalAutomationEvent = { id: ref.id, ...input, occurredAt };
  await ref.set({ ...record, createdAt: FieldValue.serverTimestamp() });
  return record;
}

export async function listExternalAutomationEvents(limit = 30) {
  const db = await getAdminDb();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const snapshot = await db.collection(COLLECTION).orderBy("occurredAt", "desc").limit(safeLimit).get();
  return snapshot.docs.map((doc) => doc.data() as ExternalAutomationEvent);
}

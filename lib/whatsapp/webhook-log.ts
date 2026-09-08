import { getAdminDb } from "@/lib/firebase/admin";

const COLLECTION = "whatsapp_webhook_events";

export type WhatsAppWebhookEventLog = {
  id: string;
  receivedAt: string;
  field: string;
  eventKind: "status" | "message" | "other";
  messageId: string | null;
  status: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  matchedLead: boolean;
  error: string | null;
  source: "meta";
};

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function recordWhatsAppWebhookEvent(input: Omit<WhatsAppWebhookEventLog, "id" | "receivedAt" | "source"> & { receivedAt?: string }) {
  const db = await getAdminDb();
  const ref = db.collection(COLLECTION).doc();
  const record: WhatsAppWebhookEventLog = {
    id: ref.id,
    receivedAt: input.receivedAt || new Date().toISOString(),
    field: input.field || "unknown",
    eventKind: input.eventKind,
    messageId: cleanString(input.messageId),
    status: cleanString(input.status),
    phoneNumberId: cleanString(input.phoneNumberId),
    displayPhoneNumber: cleanString(input.displayPhoneNumber),
    matchedLead: Boolean(input.matchedLead),
    error: cleanString(input.error),
    source: "meta",
  };
  await ref.set(record);
  return record;
}

export async function listWhatsAppWebhookEvents(limit = 25) {
  const db = await getAdminDb();
  const snapshot = await db.collection(COLLECTION).orderBy("receivedAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => doc.data() as WhatsAppWebhookEventLog);
}

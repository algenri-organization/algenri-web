import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const COLLECTION = "internal_notification_preferences";

export type NotificationPreferences = {
  financeOverdueInApp: boolean;
  commercialUpdatesInApp: boolean;
  operationUpdatesInApp: boolean;
  emailDigest: boolean;
  emailFinanceOverdue: boolean;
  whatsappCriticalAlerts: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  financeOverdueInApp: true,
  commercialUpdatesInApp: true,
  operationUpdatesInApp: true,
  emailDigest: false,
  emailFinanceOverdue: false,
  whatsappCriticalAlerts: false,
};

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export async function getNotificationPreferences(uid: string): Promise<NotificationPreferences> {
  const db = await getAdminDb();
  const snap = await db.collection(COLLECTION).doc(uid).get();
  if (!snap.exists) return { ...defaultNotificationPreferences };
  return { ...defaultNotificationPreferences, ...(snap.data() as Partial<NotificationPreferences>) };
}

export async function saveNotificationPreferences(uid: string, input: Record<string, unknown>, updatedBy: string) {
  const current = await getNotificationPreferences(uid);
  const next: NotificationPreferences = {
    financeOverdueInApp: bool(input.financeOverdueInApp, current.financeOverdueInApp),
    commercialUpdatesInApp: bool(input.commercialUpdatesInApp, current.commercialUpdatesInApp),
    operationUpdatesInApp: bool(input.operationUpdatesInApp, current.operationUpdatesInApp),
    emailDigest: bool(input.emailDigest, current.emailDigest),
    emailFinanceOverdue: bool(input.emailFinanceOverdue, current.emailFinanceOverdue),
    whatsappCriticalAlerts: bool(input.whatsappCriticalAlerts, current.whatsappCriticalAlerts),
    updatedBy,
  };

  const db = await getAdminDb();
  await db.collection(COLLECTION).doc(uid).set({ ...next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return next;
}

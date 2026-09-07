import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export type InternalRole = "admin" | "member";
export type InternalModule = "commercial" | "operation" | "finance" | "settings";
export const INTERNAL_MODULES: InternalModule[] = ["commercial", "operation", "finance", "settings"];

export type InternalUserRecord = {
  uid: string;
  email: string;
  displayName: string;
  role: InternalRole;
  active: boolean;
  permissions?: InternalModule[];
  createdAt?: string;
  updatedAt?: string;
};

const COLLECTION = "internal_users";

function adminEmails() {
  const configured = process.env.ALGENRI_INTERNAL_ADMIN_EMAILS || process.env.ALGENRI_INTERNAL_ALLOWED_EMAILS || "michel@algenri.com.br";
  return new Set(configured.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
}

export function isBootstrapAdmin(email: string) {
  return adminEmails().has(email.toLowerCase());
}

export function normalizePermissions(value: unknown): InternalModule[] {
  if (!Array.isArray(value)) return [...INTERNAL_MODULES];
  return INTERNAL_MODULES.filter((module) => value.includes(module));
}

export async function getInternalUserRecord(uid: string) {
  const db = await getAdminDb();
  const snap = await db.collection(COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as InternalUserRecord;
}

export async function getInternalAccess(uid: string, email: string) {
  if (isBootstrapAdmin(email)) return { role: "admin" as const, permissions: [...INTERNAL_MODULES], active: true };
  const record = await getInternalUserRecord(uid);
  if (!record) return { role: "member" as const, permissions: [...INTERNAL_MODULES], active: true };
  if (!record.active) return { role: record.role, permissions: [] as InternalModule[], active: false };
  return {
    role: record.role,
    permissions: record.role === "admin" ? [...INTERNAL_MODULES] : normalizePermissions(record.permissions),
    active: true,
  };
}

export async function isInternalAdmin(uid: string, email: string) {
  const access = await getInternalAccess(uid, email);
  return Boolean(access.active && access.role === "admin");
}

export async function listInternalUsers(current: { uid: string; email: string }) {
  const db = await getAdminDb();
  const auth = await getAdminAuth();
  const snap = await db.collection(COLLECTION).orderBy("email").get();
  const users = snap.docs.map((doc) => {
    const data = doc.data() as InternalUserRecord;
    return { ...data, permissions: data.role === "admin" ? [...INTERNAL_MODULES] : normalizePermissions(data.permissions) };
  });
  if (!users.some((u) => u.uid === current.uid)) {
    const authUser = await auth.getUser(current.uid);
    users.unshift({ uid: current.uid, email: current.email, displayName: authUser.displayName || "", role: isBootstrapAdmin(current.email) ? "admin" : "member", active: true, permissions: [...INTERNAL_MODULES] });
  }
  return users;
}

export async function provisionInternalUser(input: { email: string; displayName?: string; role?: InternalRole; permissions?: InternalModule[] }) {
  const email = input.email.trim().toLowerCase();
  if (!email.endsWith("@algenri.com.br")) throw new Error("domain_not_allowed");
  const role: InternalRole = input.role === "admin" ? "admin" : "member";
  const permissions = role === "admin" ? [...INTERNAL_MODULES] : normalizePermissions(input.permissions);
  const auth = await getAdminAuth();
  const db = await getAdminDb();
  let authUser;
  try {
    authUser = await auth.getUserByEmail(email);
  } catch {
    authUser = await auth.createUser({ email, displayName: input.displayName?.trim() || undefined, password: randomBytes(24).toString("base64url") });
  }
  const record: InternalUserRecord = { uid: authUser.uid, email, displayName: input.displayName?.trim() || authUser.displayName || "", role, active: true, permissions };
  await db.collection(COLLECTION).doc(authUser.uid).set({ ...record, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return record;
}

export async function updateInternalUser(actorUid: string, input: { uid: string; role?: InternalRole; active?: boolean; permissions?: InternalModule[] }) {
  if (!input.uid) throw new Error("uid_required");
  if (input.uid === actorUid && input.active === false) throw new Error("cannot_disable_self");
  if (input.uid === actorUid && input.role && input.role !== "admin") throw new Error("cannot_demote_self");
  const db = await getAdminDb();
  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (input.role) patch.role = input.role === "admin" ? "admin" : "member";
  if (typeof input.active === "boolean") patch.active = input.active;
  if (input.permissions) patch.permissions = normalizePermissions(input.permissions);
  if (input.role === "admin") patch.permissions = [...INTERNAL_MODULES];
  await db.collection(COLLECTION).doc(input.uid).set(patch, { merge: true });
}

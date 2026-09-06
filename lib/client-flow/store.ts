import type { Query } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const CLIENTS = "clients";
const PROJECTS = "projects";
const DEFAULT_TENANT_ID = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type ClientStatus = "lead" | "negotiation" | "active" | "paused" | "inactive" | "archived";
export type ProjectStatus = "diagnosis" | "briefing" | "proposal" | "contract" | "onboarding" | "development" | "validation" | "publication" | "delivery" | "support" | "completed" | "paused" | "cancelled";

export type ClientRecord = {
  id: string; legalName: string; tradeName: string; taxId: string; segment: string; city: string; state: string; country: string;
  website: string; instagram: string; email: string; phone: string; whatsapp: string;
  primaryContact: { name: string; role: string; email: string; phone: string };
  relationshipStatus: ClientStatus; notes: string; tenantId: string; createdBy: string; createdAt: string; updatedAt: string; archivedAt: string | null;
};

export type ProjectRecord = {
  id: string; clientId: string; clientName: string; name: string; projectType: string; status: ProjectStatus;
  responsibleUserId: string; responsibleName: string; startDate: string; expectedDeliveryDate: string; completedAt: string | null;
  description: string; notes: string; tenantId: string; createdBy: string; createdAt: string; updatedAt: string; archivedAt: string | null;
};

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export async function listClients() {
  const db = await getAdminDb();
  const snapshot = await db.collection(CLIENTS).where("tenantId", "==", DEFAULT_TENANT_ID).get();
  return snapshot.docs.map((doc) => doc.data() as ClientRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClient(id: string) {
  const db = await getAdminDb(); const doc = await db.collection(CLIENTS).doc(id).get();
  if (!doc.exists) return null; const client = doc.data() as ClientRecord;
  return client.tenantId === DEFAULT_TENANT_ID ? client : null;
}

export async function createClient(input: Record<string, unknown>, createdBy: string) {
  const db = await getAdminDb(); const ref = db.collection(CLIENTS).doc(); const now = new Date().toISOString();
  const tradeName = text(input.tradeName); const legalName = text(input.legalName); if (!tradeName && !legalName) throw new Error("client_name_required");
  const contact = input.primaryContact as Record<string, unknown> | undefined;
  const record: ClientRecord = {
    id: ref.id, legalName, tradeName, taxId: text(input.taxId), segment: text(input.segment), city: text(input.city), state: text(input.state), country: text(input.country) || "Brasil",
    website: text(input.website), instagram: text(input.instagram), email: text(input.email), phone: text(input.phone), whatsapp: text(input.whatsapp),
    primaryContact: { name: text(contact?.name), role: text(contact?.role), email: text(contact?.email), phone: text(contact?.phone) },
    relationshipStatus: (text(input.relationshipStatus) || "lead") as ClientStatus, notes: text(input.notes), tenantId: DEFAULT_TENANT_ID,
    createdBy, createdAt: now, updatedAt: now, archivedAt: null,
  };
  await ref.set(record); return record;
}

export async function updateClient(id: string, input: Record<string, unknown>) {
  const current = await getClient(id); if (!current) return null;
  const updated: ClientRecord = { ...current, ...input, id: current.id, tenantId: current.tenantId, createdAt: current.createdAt, createdBy: current.createdBy, updatedAt: new Date().toISOString() } as ClientRecord;
  const db = await getAdminDb(); await db.collection(CLIENTS).doc(id).set(updated); return updated;
}

export async function listProjects(clientId?: string) {
  const db = await getAdminDb();
  let query: Query = db.collection(PROJECTS).where("tenantId", "==", DEFAULT_TENANT_ID);
  if (clientId) query = query.where("clientId", "==", clientId);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as ProjectRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string) {
  const db = await getAdminDb(); const doc = await db.collection(PROJECTS).doc(id).get();
  if (!doc.exists) return null; const project = doc.data() as ProjectRecord;
  return project.tenantId === DEFAULT_TENANT_ID ? project : null;
}

export async function createProject(input: Record<string, unknown>, createdBy: string) {
  const clientId = text(input.clientId); const client = await getClient(clientId); if (!client) throw new Error("client_not_found");
  const name = text(input.name); if (!name) throw new Error("project_name_required");
  const db = await getAdminDb(); const ref = db.collection(PROJECTS).doc(); const now = new Date().toISOString();
  const record: ProjectRecord = {
    id: ref.id, clientId, clientName: client.tradeName || client.legalName, name, projectType: text(input.projectType), status: (text(input.status) || "diagnosis") as ProjectStatus,
    responsibleUserId: text(input.responsibleUserId), responsibleName: text(input.responsibleName), startDate: text(input.startDate), expectedDeliveryDate: text(input.expectedDeliveryDate), completedAt: null,
    description: text(input.description), notes: text(input.notes), tenantId: DEFAULT_TENANT_ID, createdBy, createdAt: now, updatedAt: now, archivedAt: null,
  };
  await ref.set(record); return record;
}

export async function updateProject(id: string, input: Record<string, unknown>) {
  const current = await getProject(id); if (!current) return null;
  const updated: ProjectRecord = { ...current, ...input, id: current.id, clientId: current.clientId, tenantId: current.tenantId, createdAt: current.createdAt, createdBy: current.createdBy, updatedAt: new Date().toISOString() } as ProjectRecord;
  if (updated.status === "completed" && !updated.completedAt) updated.completedAt = updated.updatedAt;
  const db = await getAdminDb(); await db.collection(PROJECTS).doc(id).set(updated); return updated;
}

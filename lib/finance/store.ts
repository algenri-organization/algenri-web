import { getAdminDb } from "@/lib/firebase/admin";
import { getClient, getProject } from "@/lib/client-flow/store";

const CHARGES = "finance_charges";
const DEFAULT_TENANT_ID = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type ChargeStatus = "pending" | "paid" | "cancelled";
export type ChargeRecord = {
  id: string; clientId: string; clientName: string; projectId: string; projectName: string;
  description: string; amountCents: number; dueDate: string; status: ChargeStatus; paidAt: string | null;
  paymentMethod: string; notes: string; tenantId: string; createdBy: string; createdAt: string; updatedAt: string;
};

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function amountToCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  const normalized = text(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized); return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export async function listCharges() {
  const db = await getAdminDb();
  const snapshot = await db.collection(CHARGES).where("tenantId", "==", DEFAULT_TENANT_ID).get();
  return snapshot.docs.map((doc) => doc.data() as ChargeRecord).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
}

export async function getCharge(id: string) {
  const db = await getAdminDb(); const doc = await db.collection(CHARGES).doc(id).get();
  if (!doc.exists) return null; const charge = doc.data() as ChargeRecord;
  return charge.tenantId === DEFAULT_TENANT_ID ? charge : null;
}

export async function createCharge(input: Record<string, unknown>, createdBy: string) {
  const clientId = text(input.clientId); const client = await getClient(clientId); if (!client) throw new Error("client_not_found");
  const projectId = text(input.projectId); const project = projectId ? await getProject(projectId) : null;
  if (projectId && (!project || project.clientId !== clientId)) throw new Error("project_not_found");
  const description = text(input.description); if (!description) throw new Error("description_required");
  const amountCents = amountToCents(input.amount); if (amountCents <= 0) throw new Error("amount_required");
  const dueDate = text(input.dueDate); if (!dueDate) throw new Error("due_date_required");
  const db = await getAdminDb(); const ref = db.collection(CHARGES).doc(); const now = new Date().toISOString();
  const record: ChargeRecord = {
    id: ref.id, clientId, clientName: client.tradeName || client.legalName, projectId, projectName: project?.name || "", description,
    amountCents, dueDate, status: "pending", paidAt: null, paymentMethod: text(input.paymentMethod), notes: text(input.notes),
    tenantId: DEFAULT_TENANT_ID, createdBy, createdAt: now, updatedAt: now,
  };
  await ref.set(record); return record;
}

export async function updateCharge(id: string, input: Record<string, unknown>) {
  const current = await getCharge(id); if (!current) return null;
  const status = text(input.status) as ChargeStatus;
  const nextStatus: ChargeStatus = ["pending", "paid", "cancelled"].includes(status) ? status : current.status;
  const updated: ChargeRecord = {
    ...current,
    status: nextStatus,
    paymentMethod: input.paymentMethod === undefined ? current.paymentMethod : text(input.paymentMethod),
    notes: input.notes === undefined ? current.notes : text(input.notes),
    paidAt: nextStatus === "paid" ? (current.paidAt || new Date().toISOString()) : nextStatus === "pending" ? null : current.paidAt,
    updatedAt: new Date().toISOString(),
  };
  const db = await getAdminDb(); await db.collection(CHARGES).doc(id).set(updated); return updated;
}

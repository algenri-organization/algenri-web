import { getAdminDb } from "@/lib/firebase/admin";

const COLLECTION = "internal_document_models";
const DEFAULT_TENANT_ID = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type DocumentModelType = "proposal" | "contract" | "general";
export type DocumentModelStatus = "draft" | "published" | "archived";

export type DocumentModelRecord = {
  id: string;
  tenantId: string;
  name: string;
  type: DocumentModelType;
  status: DocumentModelStatus;
  content: string;
  notes: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  publishedAt: string | null;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function modelType(value: unknown): DocumentModelType {
  const normalized = text(value);
  return normalized === "proposal" || normalized === "contract" ? normalized : "general";
}

function modelStatus(value: unknown, fallback: DocumentModelStatus = "draft"): DocumentModelStatus {
  const normalized = text(value);
  return normalized === "published" || normalized === "archived" || normalized === "draft" ? normalized : fallback;
}

export async function listDocumentModels() {
  const db = await getAdminDb();
  const snapshot = await db.collection(COLLECTION).where("tenantId", "==", DEFAULT_TENANT_ID).get();
  return snapshot.docs
    .map((doc) => doc.data() as DocumentModelRecord)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export async function createDocumentModel(input: Record<string, unknown>, actor: string) {
  const name = text(input.name);
  if (!name) throw new Error("model_name_required");
  const content = text(input.content);
  if (!content) throw new Error("model_content_required");

  const db = await getAdminDb();
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const status = modelStatus(input.status);
  const record: DocumentModelRecord = {
    id: ref.id,
    tenantId: DEFAULT_TENANT_ID,
    name,
    type: modelType(input.type),
    status,
    content,
    notes: text(input.notes),
    version: 1,
    createdBy: actor,
    createdAt: now,
    updatedBy: actor,
    updatedAt: now,
    publishedAt: status === "published" ? now : null,
  };
  await ref.set(record);
  return record;
}

export async function updateDocumentModel(id: string, input: Record<string, unknown>, actor: string) {
  const db = await getAdminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const current = snapshot.data() as DocumentModelRecord;
  if (current.tenantId !== DEFAULT_TENANT_ID) return null;

  const name = input.name === undefined ? current.name : text(input.name);
  if (!name) throw new Error("model_name_required");
  const content = input.content === undefined ? current.content : text(input.content);
  if (!content) throw new Error("model_content_required");
  const status = input.status === undefined ? current.status : modelStatus(input.status, current.status);
  const now = new Date().toISOString();
  const contentChanged = content !== current.content || name !== current.name || modelType(input.type ?? current.type) !== current.type;
  const updated: DocumentModelRecord = {
    ...current,
    name,
    type: input.type === undefined ? current.type : modelType(input.type),
    status,
    content,
    notes: input.notes === undefined ? current.notes : text(input.notes),
    version: contentChanged ? current.version + 1 : current.version,
    updatedBy: actor,
    updatedAt: now,
    publishedAt: status === "published" ? (current.publishedAt ?? now) : current.publishedAt,
  };
  await ref.set(updated);
  return updated;
}

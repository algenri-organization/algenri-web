import { getAdminDb } from "@/lib/firebase/admin";

const MODELS = "internal_document_models";
const TENANT = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type PublishedContractModel = {
  id: string;
  name: string;
  version: number;
  content: string;
};

export async function listPublishedContractModels(): Promise<PublishedContractModel[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection(MODELS).where("tenantId", "==", TENANT).get();
  return snapshot.docs
    .map((doc) => doc.data() as any)
    .filter((model) => model.type === "contract" && model.status === "published")
    .map((model) => ({ id: model.id, name: model.name, version: model.version, content: String(model.content ?? "").trim() }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getPublishedContractModel(id: string): Promise<PublishedContractModel> {
  const db = await getAdminDb();
  const snapshot = await db.collection(MODELS).doc(id).get();
  if (!snapshot.exists) throw new Error("document_model_not_found");
  const model = snapshot.data() as any;
  if (model.tenantId !== TENANT || model.type !== "contract" || model.status !== "published") throw new Error("document_model_unavailable");
  return { id: model.id, name: model.name, version: model.version, content: String(model.content ?? "").trim() };
}

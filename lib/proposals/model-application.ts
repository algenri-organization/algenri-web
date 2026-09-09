import { getAdminDb } from "@/lib/firebase/admin";
import { getCommercialProposal, type ProposalSection } from "@/lib/proposals/store";

const MODELS = "internal_document_models";
const PROPOSALS = "commercial_proposals";
const TENANT = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type PublishedProposalModel = {
  id: string;
  name: string;
  version: number;
  content: string;
};

export async function listPublishedProposalModels(): Promise<PublishedProposalModel[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection(MODELS).where("tenantId", "==", TENANT).get();
  return snapshot.docs
    .map((doc) => doc.data() as any)
    .filter((model) => model.type === "proposal" && model.status === "published")
    .map((model) => ({ id: model.id, name: model.name, version: model.version, content: model.content }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function applyProposalDocumentModel(proposalId: string, modelId: string, actor: string) {
  const db = await getAdminDb();
  const [proposal, modelSnap] = await Promise.all([
    getCommercialProposal(proposalId),
    db.collection(MODELS).doc(modelId).get(),
  ]);
  if (!proposal) throw new Error("proposal_not_found");
  if (!modelSnap.exists) throw new Error("document_model_not_found");
  const model = modelSnap.data() as any;
  if (model.tenantId !== TENANT || model.type !== "proposal" || model.status !== "published") throw new Error("document_model_unavailable");

  const templateSection: ProposalSection = {
    id: "document_model_base",
    key: "document_model_base",
    title: model.name,
    content: String(model.content ?? "").trim(),
    order: 0,
    source: "system",
    editable: true,
  };
  const existing = proposal.sections.filter((section) => section.key !== "document_model_base");
  const sections = [templateSection, ...existing].map((section, index) => ({ ...section, order: index }));
  const now = new Date().toISOString();
  await db.collection(PROPOSALS).doc(proposalId).set({
    sections,
    sourceDocumentModelId: model.id,
    sourceDocumentModelName: model.name,
    sourceDocumentModelVersion: model.version,
    updatedBy: actor,
    updatedAt: now,
  }, { merge: true });
  return getCommercialProposal(proposalId);
}

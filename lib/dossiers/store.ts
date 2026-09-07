import { getAdminDb } from "@/lib/firebase/admin";
import { getInternalBriefingInstance } from "@/lib/briefing/instance-store";

const DOSSIER_COLLECTION = "project_dossiers";

export type DossierStatus = "draft" | "in_analysis" | "review_ready" | "finalized" | "archived";
export type DossierSectionSource = "briefing" | "manual" | "ai" | "system";

export type DossierSection = {
  id: string;
  key: string;
  title: string;
  content: string;
  order: number;
  source: DossierSectionSource;
  editable: boolean;
};

export type ProjectDossierRecord = {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  projectType: string;
  sourceBriefingInstanceId: string;
  sourceBriefingTemplateId: string;
  sourceBriefingVersion: string;
  sourceSnapshot: {
    templateName: string;
    templateVersion: string;
    sections: unknown[];
    answers: Record<string, unknown>;
  };
  status: DossierStatus;
  version: string;
  title: string;
  sections: DossierSection[];
  aiMetadata?: { generatedAt: string; generatedBy: string; model: string; source: "briefing" } | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
};

const DEFAULT_SECTIONS = [
  ["executive_summary", "Resumo Executivo"],
  ["client_context", "Contexto do Cliente"],
  ["project_objectives", "Objetivos do Projeto"],
  ["identified_needs", "Necessidades Identificadas"],
  ["recommended_scope", "Escopo Recomendado"],
  ["features", "Funcionalidades"],
  ["integrations", "Integrações e Dependências"],
  ["required_materials", "Conteúdos e Materiais Necessários"],
  ["pending_decisions", "Decisões Pendentes"],
  ["risks", "Riscos e Pontos de Atenção"],
  ["algenri_recommendations", "Recomendações ALGENRI"],
  ["preliminary_schedule", "Cronograma Preliminar"],
  ["next_steps", "Próximos Passos"],
] as const;

function makeSections(): DossierSection[] {
  return DEFAULT_SECTIONS.map(([key, title], index) => ({ id: key, key, title, content: "", order: index, source: "system", editable: true }));
}

export async function listProjectDossiers(projectId?: string) {
  const db = await getAdminDb();
  const snap = await db.collection(DOSSIER_COLLECTION).orderBy("updatedAt", "desc").limit(100).get();
  let dossiers = snap.docs.map((doc) => doc.data() as ProjectDossierRecord);
  if (projectId) dossiers = dossiers.filter((dossier) => dossier.projectId === projectId);
  return dossiers;
}

export async function getProjectDossier(id: string) {
  const db = await getAdminDb();
  const doc = await db.collection(DOSSIER_COLLECTION).doc(id).get();
  return doc.exists ? (doc.data() as ProjectDossierRecord) : null;
}

export async function createProjectDossierFromBriefing(briefingInstanceId: string, createdBy: string) {
  const db = await getAdminDb();
  const existing = await db.collection(DOSSIER_COLLECTION).where("sourceBriefingInstanceId", "==", briefingInstanceId).limit(1).get();
  if (!existing.empty) return { record: existing.docs[0].data() as ProjectDossierRecord, created: false };

  const source = await getInternalBriefingInstance(briefingInstanceId);
  if (!source) throw new Error("briefing_not_found");
  if (source.instance.status !== "completed") throw new Error("briefing_not_completed");
  if (!source.instance.linkedAt) throw new Error("briefing_not_linked");

  const ref = db.collection(DOSSIER_COLLECTION).doc();
  const now = new Date().toISOString();
  const record: ProjectDossierRecord = {
    id: ref.id,
    clientId: source.instance.clientId,
    clientName: source.instance.clientName,
    projectId: source.instance.projectId,
    projectName: source.instance.projectName,
    projectType: source.instance.templateSnapshot.projectType,
    sourceBriefingInstanceId: source.instance.id,
    sourceBriefingTemplateId: source.instance.templateId,
    sourceBriefingVersion: source.instance.templateVersion,
    sourceSnapshot: {
      templateName: source.instance.templateSnapshot.name,
      templateVersion: source.instance.templateSnapshot.version,
      sections: source.instance.templateSnapshot.sections,
      answers: source.answers,
    },
    status: "draft",
    version: "1.0",
    title: `Dossiê do Projeto — ${source.instance.clientName}`,
    sections: makeSections(),
    aiMetadata: null,
    createdBy,
    createdAt: now,
    updatedAt: now,
    finalizedAt: null,
  };
  await ref.set(record);
  return { record, created: true };
}

export async function updateProjectDossier(id: string, input: { title?: string; status?: DossierStatus; sections?: DossierSection[] }) {
  const db = await getAdminDb();
  const ref = db.collection(DOSSIER_COLLECTION).doc(id);
  const current = await ref.get();
  if (!current.exists) return null;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updatedAt: now };
  if (typeof input.title === "string" && input.title.trim()) patch.title = input.title.trim();
  if (input.status) {
    patch.status = input.status;
    patch.finalizedAt = input.status === "finalized" ? now : (current.data()?.finalizedAt ?? null);
  }
  if (Array.isArray(input.sections)) patch.sections = input.sections.map((section, index) => ({ ...section, order: index }));
  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return updated.data() as ProjectDossierRecord;
}

export async function applyAiDossierDraft(id: string, input: { sections: DossierSection[]; model: string }, updatedBy: string) {
  const current = await getProjectDossier(id);
  if (!current) return null;
  if (["finalized", "archived"].includes(current.status)) throw new Error("dossier_locked");
  const now = new Date().toISOString();
  const db = await getAdminDb();
  await db.collection(DOSSIER_COLLECTION).doc(id).set({
    sections: input.sections.map((section, index) => ({ ...section, order: index })),
    status: "review_ready",
    aiMetadata: { generatedAt: now, generatedBy: updatedBy, model: input.model, source: "briefing" },
    updatedAt: now,
  }, { merge: true });
  return getProjectDossier(id);
}

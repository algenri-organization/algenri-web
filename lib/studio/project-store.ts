import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getClient, getProject } from "@/lib/client-flow/store";
import { getCommercialProposal } from "@/lib/proposals/store";
import { getContract } from "@/lib/contracts/store";
import type { StudioCommercialLink, StudioVideoBriefing } from "@/lib/studio/projects";

export type StudioStoryboardScene = {
  index: number;
  title: string;
  durationSeconds: number;
  objective: string;
  narration: string;
  visualDirection: string;
  technicalPrompt: string;
  status: "draft" | "approved";
};

export type StudioSceneGenerationJob = {
  sceneIndex: number;
  provider: string;
  model: string | null;
  taskId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  estimatedCredits: number | null;
  actualCredits: number | null;
  outputUrl: string | null;
  storagePath?: string | null;
  storageStatus?: "pending" | "archived" | "failed" | null;
  storageError?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  archivedAt?: string | null;
  failure: unknown | null;
  startedAt: string;
  completedAt: string | null;
};

function splitDuration(total: number, parts: number) {
  const safeTotal = Math.max(parts, Math.round(total));
  const base = Math.floor(safeTotal / parts);
  const rest = safeTotal % parts;
  return Array.from({ length: parts }, (_, index) => base + (index < rest ? 1 : 0));
}

export function buildStoryboardScaffold(briefing: StudioVideoBriefing): StudioStoryboardScene[] {
  const sceneCount = briefing.durationSeconds <= 12 ? 3 : briefing.durationSeconds <= 35 ? 5 : briefing.durationSeconds <= 70 ? 7 : 9;
  const durations = splitDuration(briefing.durationSeconds, sceneCount);
  return durations.map((durationSeconds, index) => {
    const first = index === 0;
    const last = index === sceneCount - 1;
    const objective = first ? `Capturar atenção e apresentar: ${briefing.centralIdea || briefing.objective}.` : last ? `Concluir a mensagem para ${briefing.destination}.` : `Desenvolver a mensagem para ${briefing.audience}.`;
    const visualDirection = `${briefing.visualStyle}; ${briefing.aspectRatio}; ${briefing.useBrandIdentity ? "usar identidade visual aprovada" : "sem dependência de marca"}; ${briefing.useAvatar ? "avatar autorizado quando necessário" : "sem avatar obrigatório"}.`;
    const narration = briefing.scriptMode === "manual" && briefing.script ? briefing.script : first ? briefing.centralIdea || briefing.objective : last ? `Fechamento alinhado a ${briefing.objective}` : `Locução coerente com ${briefing.objective}.`;
    return { index: index + 1, title: `${first ? "Abertura" : last ? "Encerramento" : "Desenvolvimento"} · Cena ${index + 1}`, durationSeconds, objective, narration, visualDirection, technicalPrompt: `${visualDirection} ${objective} Evitar: ${briefing.prohibitedElements || "artefatos, texto incorreto e elementos aleatórios"}.`, status: "draft" };
  });
}

async function resolveCommercialLink(link?: StudioCommercialLink): Promise<StudioCommercialLink> {
  if (!link || link.origin === "internal") return { origin: "internal" };
  if (!link.clientId) throw new Error("studio_client_required");
  const client = await getClient(link.clientId);
  if (!client) throw new Error("studio_client_not_found");

  let commercialProjectName: string | undefined;
  if (link.commercialProjectId) {
    const project = await getProject(link.commercialProjectId);
    if (!project || project.clientId !== client.id) throw new Error("studio_commercial_project_mismatch");
    commercialProjectName = project.name;
  }

  let proposalNumber: string | undefined;
  if (link.proposalId) {
    const proposal = await getCommercialProposal(link.proposalId);
    if (!proposal || proposal.clientId !== client.id || (link.commercialProjectId && proposal.projectId !== link.commercialProjectId)) throw new Error("studio_proposal_mismatch");
    proposalNumber = proposal.proposalNumber;
  }

  let contractNumber: string | undefined;
  if (link.contractId) {
    const contract = await getContract(link.contractId);
    if (!contract || contract.clientId !== client.id || (link.commercialProjectId && contract.projectId !== link.commercialProjectId) || (link.proposalId && contract.proposalId !== link.proposalId)) throw new Error("studio_contract_mismatch");
    contractNumber = contract.contractNumber;
  }

  return {
    origin: "client",
    clientId: client.id,
    clientName: client.tradeName || client.legalName,
    commercialProjectId: link.commercialProjectId,
    commercialProjectName,
    proposalId: link.proposalId,
    proposalNumber,
    contractId: link.contractId,
    contractNumber,
  };
}

export async function createStudioVideoProject(input: { ownerUid: string; ownerEmail?: string | null; name: string; briefing: StudioVideoBriefing; commercialLink?: StudioCommercialLink }) {
  const db = await getAdminDb();
  const ref = db.collection("studioProjects").doc();
  const storyboard = buildStoryboardScaffold(input.briefing);
  const commercialLink = await resolveCommercialLink(input.commercialLink);
  await ref.set({
    name: input.name, format: "video", status: "planning", ownerUid: input.ownerUid, ownerEmail: input.ownerEmail ?? null,
    commercialLink, briefing: input.briefing, storyboard,
    ai: { storyboardState: input.briefing.scriptMode === "ai" ? "pending" : "manual", model: null, generatedAt: null, error: null },
    review: { approvedScenes: 0, totalScenes: storyboard.length, allApproved: false, approvedAt: null },
    routing: { state: "not_started", generatedAt: null, routes: [], totalEstimatedCredits: null, fullyExecutable: false, providerCoverage: null },
    generation: { state: "not_started", estimatedCredits: null, actualCredits: null, provider: null, jobId: null, outputUrl: null, sceneJobs: [] },
    assets: [],
    benchmark: { enabled: true, qualityScore: null, promptAdherenceScore: null, notes: null },
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id, storyboard, commercialLink };
}

export async function getStudioProject(projectId: string) {
  const db = await getAdminDb();
  const snapshot = await db.collection("studioProjects").doc(projectId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Record<string, any> & { id: string };
}

export async function applyStudioAiStoryboard(projectId: string, storyboard: StudioStoryboardScene[], model: string) {
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    storyboard,
    ai: { storyboardState: "generated", model, generatedAt: new Date().toISOString(), error: null },
    review: { approvedScenes: 0, totalScenes: storyboard.length, allApproved: false, approvedAt: null },
    routing: { state: "not_started", generatedAt: null, routes: [], totalEstimatedCredits: null, fullyExecutable: false, providerCoverage: null },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function markStudioAiStoryboardFailure(projectId: string, error: string) {
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({ ai: { storyboardState: "fallback", model: null, generatedAt: null, error }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function updateStudioStoryboardScene(projectId: string, sceneIndex: number, patch: Partial<StudioStoryboardScene>) {
  const project = await getStudioProject(projectId);
  if (!project) return null;
  const storyboard = Array.isArray(project.storyboard) ? project.storyboard as StudioStoryboardScene[] : [];
  const position = storyboard.findIndex((scene) => scene.index === sceneIndex);
  if (position < 0) return null;
  const current = storyboard[position];
  storyboard[position] = {
    ...current,
    ...patch,
    index: current.index,
    durationSeconds: Math.max(1, Math.round(Number(patch.durationSeconds ?? current.durationSeconds))),
    status: patch.status === "approved" ? "approved" : patch.status === "draft" ? "draft" : current.status,
  };
  const approvedScenes = storyboard.filter((scene) => scene.status === "approved").length;
  const allApproved = storyboard.length > 0 && approvedScenes === storyboard.length;
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    storyboard,
    status: allApproved ? "review" : "planning",
    review: { approvedScenes, totalScenes: storyboard.length, allApproved, approvedAt: allApproved ? new Date().toISOString() : null },
    routing: { state: "not_started", generatedAt: null, routes: [], totalEstimatedCredits: null, fullyExecutable: false, providerCoverage: null },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return storyboard[position];
}

export async function approveAllStudioStoryboardScenes(projectId: string) {
  const project = await getStudioProject(projectId);
  if (!project) return null;
  const storyboard = (Array.isArray(project.storyboard) ? project.storyboard : []).map((scene: StudioStoryboardScene) => ({ ...scene, status: "approved" as const }));
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    storyboard,
    status: storyboard.length ? "review" : "planning",
    review: { approvedScenes: storyboard.length, totalScenes: storyboard.length, allApproved: storyboard.length > 0, approvedAt: storyboard.length ? new Date().toISOString() : null },
    routing: { state: "not_started", generatedAt: null, routes: [], totalEstimatedCredits: null, fullyExecutable: false, providerCoverage: null },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return storyboard;
}

export async function saveStudioRoutingPlan(projectId: string, routing: Record<string, unknown>) {
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({ routing, generation: { estimatedCredits: (routing as any).totalEstimatedCredits ?? null }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function upsertStudioSceneGenerationJob(projectId: string, job: StudioSceneGenerationJob) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const jobs = Array.isArray(project.generation?.sceneJobs) ? project.generation.sceneJobs as StudioSceneGenerationJob[] : [];
  const next = [...jobs.filter((item) => item.sceneIndex !== job.sceneIndex), job].sort((a, b) => a.sceneIndex - b.sceneIndex);
  const actualKnown = next.map((item) => item.actualCredits).filter((value): value is number => typeof value === "number");
  const allSucceeded = next.length > 0 && next.every((item) => item.status === "succeeded");
  const anyActive = next.some((item) => item.status === "queued" || item.status === "running");
  const state = allSucceeded ? "completed" : anyActive ? "generating" : next.some((item) => item.status === "failed") ? "attention" : "not_started";
  const assets = next.filter((item) => item.status === "succeeded" && item.storagePath).map((item) => ({
    id: `scene-${item.sceneIndex}-${item.taskId}`,
    kind: "video-scene",
    sceneIndex: item.sceneIndex,
    provider: item.provider,
    model: item.model,
    taskId: item.taskId,
    storagePath: item.storagePath,
    contentType: item.contentType ?? "video/mp4",
    sizeBytes: item.sizeBytes ?? null,
    archivedAt: item.archivedAt ?? item.completedAt,
    filename: `ALGENRI-Studio-Cena-${String(item.sceneIndex).padStart(2, "0")}.mp4`,
  }));
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    status: allSucceeded ? "review" : anyActive ? "generating" : project.status,
    generation: {
      ...(project.generation ?? {}),
      state,
      sceneJobs: next,
      actualCredits: actualKnown.length ? actualKnown.reduce((sum, value) => sum + value, 0) : null,
      outputUrl: allSucceeded && next.length === 1 ? next[0].outputUrl : null,
    },
    assets,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return next;
}

import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { StudioVideoBriefing } from "@/lib/studio/projects";

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

export type StudioProjectRecord = {
  id: string;
  name: string;
  format: "video";
  status: "planning";
  ownerUid: string;
  briefing: StudioVideoBriefing;
  storyboard: StudioStoryboardScene[];
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
  const required = briefing.requiredScenes?.trim();
  const endingText = briefing.requiredOnScreenText?.trim();

  return durations.map((durationSeconds, index) => {
    const first = index === 0;
    const last = index === sceneCount - 1;
    const phase = first ? "Abertura" : last ? "Encerramento" : `Desenvolvimento ${index}`;
    const objective = first
      ? `Capturar atenção e apresentar a ideia central: ${briefing.centralIdea || briefing.objective}.`
      : last
        ? `Concluir a mensagem e reforçar a ação ou lembrança desejada para ${briefing.destination}.`
        : `Desenvolver a mensagem principal para ${briefing.audience}, mantendo ritmo e clareza.`;

    const visualDirection = [
      `${briefing.visualStyle}; composição ${briefing.aspectRatio}; ritmo compatível com ${briefing.destination}.`,
      briefing.useBrandIdentity ? "Aplicar identidade visual aprovada da marca." : "Não depender de identidade visual de marca.",
      briefing.useAvatar ? "Prever apresentador/avatar autorizado quando fizer sentido." : "Cena sem dependência de avatar.",
      required && !first && !last ? `Considerar requisito de cena: ${required}.` : "",
      last && endingText ? `Reservar composição para texto obrigatório: ${endingText}.` : "",
    ].filter(Boolean).join(" ");

    const narration = briefing.scriptMode === "manual" && briefing.script
      ? briefing.script
      : first
        ? briefing.centralIdea || briefing.objective
        : last
          ? `Fechamento alinhado ao objetivo: ${briefing.objective}`
          : `Desenvolver um trecho de locução coerente com ${briefing.objective}.`;

    return {
      index: index + 1,
      title: `${phase} · Cena ${index + 1}`,
      durationSeconds,
      objective,
      narration,
      visualDirection,
      technicalPrompt: `${briefing.visualStyle}. ${objective} ${visualDirection} Evitar: ${briefing.prohibitedElements || "artefatos visuais, textos incorretos e elementos aleatórios"}.`,
      status: "draft",
    };
  });
}

export async function createStudioVideoProject(input: {
  ownerUid: string;
  ownerEmail?: string | null;
  name: string;
  briefing: StudioVideoBriefing;
}) {
  const db = await getAdminDb();
  const ref = db.collection("studioProjects").doc();
  const storyboard = buildStoryboardScaffold(input.briefing);

  await ref.set({
    name: input.name,
    format: "video",
    status: "planning",
    ownerUid: input.ownerUid,
    ownerEmail: input.ownerEmail ?? null,
    briefing: input.briefing,
    storyboard,
    generation: {
      state: "not_started",
      estimatedCredits: null,
      actualCredits: null,
      provider: null,
      jobId: null,
      outputUrl: null,
    },
    benchmark: {
      enabled: true,
      qualityScore: null,
      promptAdherenceScore: null,
      notes: null,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: ref.id, storyboard };
}

export async function getStudioProject(projectId: string) {
  const db = await getAdminDb();
  const snapshot = await db.collection("studioProjects").doc(projectId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Record<string, unknown> & { id: string };
}

import "server-only";

import { getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

export type StudioPreflightLevel = "error" | "warning" | "ok";
export type StudioPreflightCheck = {
  id: string;
  label: string;
  level: StudioPreflightLevel;
  detail: string;
};

export type StudioPreflightReport = {
  ready: boolean;
  checkedAt: string;
  errors: number;
  warnings: number;
  checks: StudioPreflightCheck[];
};

function push(checks: StudioPreflightCheck[], id: string, label: string, level: StudioPreflightLevel, detail: string) {
  checks.push({ id, label, level, detail });
}

export async function buildStudioPreflightReport(projectId: string): Promise<StudioPreflightReport> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");

  const checks: StudioPreflightCheck[] = [];
  const storyboard = Array.isArray(project.storyboard) ? project.storyboard : [];
  const activeJobs = Array.isArray(project.generation?.sceneJobs) ? project.generation.sceneJobs : [];
  const composition = project.composition ?? null;
  const continuity = project.continuity ?? {};

  const allApproved = storyboard.length > 0 && storyboard.every((scene: any) => scene.status === "approved");
  push(checks, "storyboard", "Storyboard", allApproved ? "ok" : "error", allApproved ? `${storyboard.length} cenas aprovadas.` : "Há cenas do storyboard ainda não aprovadas.");

  const missingScenes = storyboard.filter((scene: any) => !activeJobs.some((job: any) => job.sceneIndex === scene.index && job.status === "succeeded"));
  push(checks, "active-scenes", "Cenas ativas", missingScenes.length ? "error" : "ok", missingScenes.length ? `Faltam versões concluídas para as cenas ${missingScenes.map((scene: any) => scene.index).join(", ")}.` : "Todas as cenas possuem versão ativa concluída.");

  const unarchived = activeJobs.filter((job: any) => job.status === "succeeded" && !job.storagePath);
  push(checks, "archive", "Arquivamento", unarchived.length ? "error" : "ok", unarchived.length ? `Há ${unarchived.length} cena(s) concluída(s) sem arquivo persistido.` : "Todas as cenas concluídas estão arquivadas.");

  const compositionApproved = composition?.state === "approved";
  push(checks, "composition", "Composição", compositionApproved ? "ok" : "error", compositionApproved ? "Composição aprovada para montagem." : "A composição ainda precisa ser aprovada.");

  const overlays = Array.isArray(composition?.sceneOverlays) ? composition.sceneOverlays : [];
  const oversized = overlays.filter((overlay: any) => Number(overlay.widthPercent ?? 84) > 92 || Number(overlay.scalePercent ?? 100) > 140 || Number(overlay.logoScalePercent ?? 100) > 200);
  push(checks, "overlay-safe-area", "Camadas visuais", oversized.length ? "warning" : "ok", oversized.length ? `Revise tamanho/área segura nas cenas ${oversized.map((item: any) => item.sceneIndex).join(", ")}.` : "Camadas dentro dos limites recomendados.");

  if (composition?.brand?.mode === "asset") {
    const path = composition?.brand?.logoStoragePath;
    let exists = false;
    if (path) {
      try { [exists] = await (await getAdminStorage()).bucket().file(path).exists(); } catch { exists = false; }
    }
    push(checks, "brand-asset", "Logomarca", exists ? "ok" : "error", exists ? "Arquivo de logomarca encontrado." : "A composição usa logo do cliente, mas o arquivo não foi encontrado.");
  } else {
    push(checks, "brand-asset", "Marca", "ok", composition?.brand?.mode === "none" ? "Projeto configurado sem marca gráfica." : "Marca configurada sem dependência de arquivo externo.");
  }

  if (continuity.mode === "strict" && continuity.chainPreviousScene !== false && storyboard.length > 1) {
    const chained = activeJobs.filter((job: any) => job.sceneIndex > 1 && job.continuityReferenceType === "previous-scene-frame");
    const expected = storyboard.length - 1;
    push(checks, "continuity", "Continuidade cinematográfica", chained.length === expected ? "ok" : "warning", chained.length === expected ? `Encadeamento confirmado em ${expected} transições.` : `Encadeamento por frame confirmado em ${chained.length}/${expected} transições. Revise visualmente a continuidade antes da entrega.`);
  } else {
    push(checks, "continuity", "Continuidade cinematográfica", "ok", continuity.mode === "independent" ? "Projeto configurado para cenas independentes." : "Continuidade configurada sem exigência estrita de frame chaining.");
  }

  const duplicateText = overlays.filter((overlay: any) => {
    const values = [overlay.eyebrow, overlay.headline, overlay.body, overlay.cta].map((value) => String(value ?? "").trim().toLocaleLowerCase("pt-BR")).filter(Boolean);
    return new Set(values).size !== values.length;
  });
  push(checks, "duplicate-copy", "Textos da composição", duplicateText.length ? "warning" : "ok", duplicateText.length ? `Há texto repetido dentro das camadas das cenas ${duplicateText.map((item: any) => item.sceneIndex).join(", ")}.` : "Nenhuma repetição óbvia de texto detectada nas camadas.");

  const errors = checks.filter((item) => item.level === "error").length;
  const warnings = checks.filter((item) => item.level === "warning").length;
  return { ready: errors === 0, checkedAt: new Date().toISOString(), errors, warnings, checks };
}

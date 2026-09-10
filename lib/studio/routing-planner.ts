import "server-only";

import { dryRunRunwayVideoRouter, extractRunwayRoutingCost } from "@/lib/studio/runway";
import { studioProviders } from "@/lib/studio/providers";
import { getStudioProject, saveStudioRoutingPlan, type StudioStoryboardScene } from "@/lib/studio/project-store";

type RouteCandidate = {
  providerId: string;
  providerName: string;
  score: number;
  executable: boolean;
  reason: string;
};

export type StudioSceneRouting = {
  sceneIndex: number;
  sceneTitle: string;
  selectedProviderId: string;
  selectedProviderName: string;
  selectedModel: string | null;
  estimatedCredits: number | null;
  executable: boolean;
  reason: string;
  candidates: RouteCandidate[];
};

function scoreProvider(providerId: string, scene: StudioStoryboardScene, project: any) {
  const briefing = project.briefing ?? {};
  let score = 50;
  const text = `${scene.title} ${scene.objective} ${scene.visualDirection} ${scene.technicalPrompt}`.toLowerCase();
  if (providerId === "runway") score += 22;
  if (providerId === "heygen" && briefing.useAvatar) score += 40;
  if (providerId === "heygen" && !briefing.useAvatar) score -= 18;
  if (providerId === "higgsfield" && /cinemat|camera|movimento|fashion|visual/.test(text)) score += 16;
  if (providerId === "veo" && /complex|realist|cinemat|audio/.test(text)) score += 12;
  if (providerId === "luma" && /image|produto|ambiente|movimento/.test(text)) score += 7;
  if (providerId === "kling" && /realist|pessoa|movimento/.test(text)) score += 8;
  if (briefing.priority === "cost" && providerId !== "runway") score -= 2;
  if (briefing.priority === "quality" && ["veo", "runway", "higgsfield"].includes(providerId)) score += 6;
  return score;
}

export async function buildStudioRoutingPlan(projectId: string) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const storyboard = (project.storyboard ?? []) as StudioStoryboardScene[];
  if (!storyboard.length) throw new Error("studio_storyboard_empty");
  if (storyboard.some((scene) => scene.status !== "approved")) throw new Error("studio_storyboard_not_approved");

  const selectable = studioProviders.filter((provider) => provider.selectable);
  const manualProviderId = project.briefing?.engineMode === "manual" ? project.briefing.manualEngineId : null;
  const routes: StudioSceneRouting[] = [];

  for (const scene of storyboard) {
    const candidates = selectable
      .map((provider) => ({
        providerId: provider.id,
        providerName: provider.name,
        score: scoreProvider(provider.id, scene, project),
        executable: provider.id === "runway",
        reason: provider.id === "runway" ? "Integração ativa e validada no Studio." : `${provider.name} está catalogado para comparação, mas ainda não possui adapter de geração ativo no Studio.`,
      }))
      .sort((a, b) => b.score - a.score);

    const requested = manualProviderId ? candidates.find((item) => item.providerId === manualProviderId) : null;
    let selected = requested ?? candidates.find((item) => item.executable) ?? candidates[0];
    if (!selected) throw new Error("studio_no_provider_candidate");

    let selectedModel: string | null = null;
    let estimatedCredits: number | null = null;
    let reason = selected.reason;

    if (selected.providerId === "runway") {
      try {
        const ratio = project.briefing?.aspectRatio === "1:1" ? "1:1" : project.briefing?.aspectRatio === "9:16" || project.briefing?.aspectRatio === "4:5" ? "9:16" : "16:9";
        const dryRun = await dryRunRunwayVideoRouter({ promptText: scene.technicalPrompt, aspectRatio: ratio, duration: Math.min(30, Math.max(1, scene.durationSeconds)) });
        const routing: any = dryRun.routing ?? null;
        selectedModel = routing?.model ?? routing?.selectedModel ?? routing?.modelId ?? null;
        estimatedCredits = extractRunwayRoutingCost(routing);
        reason = "Runway selecionado e validado por dry run para esta cena; nenhuma mídia foi gerada.";
      } catch (error) {
        selected = { ...selected, executable: false };
        reason = `Runway não pôde estimar esta cena: ${error instanceof Error ? error.message : "dry_run_failed"}.`;
      }
    }

    routes.push({
      sceneIndex: scene.index,
      sceneTitle: scene.title,
      selectedProviderId: selected.providerId,
      selectedProviderName: selected.providerName,
      selectedModel,
      estimatedCredits,
      executable: selected.executable,
      reason,
      candidates: candidates.slice(0, 4),
    });
  }

  const knownCredits = routes.map((item) => item.estimatedCredits).filter((value): value is number => typeof value === "number");
  const totalEstimatedCredits = knownCredits.length === routes.length ? knownCredits.reduce((sum, value) => sum + value, 0) : null;
  const plan = {
    state: "estimated",
    generatedAt: new Date().toISOString(),
    routes,
    totalEstimatedCredits,
    fullyExecutable: routes.every((item) => item.executable),
    providerCoverage: {
      active: ["runway"],
      recommendedNext: ["heygen", "higgsfield", "remotion"],
      planned: ["veo", "luma", "kling", "seedance", "kie-ai"],
    },
  };

  await saveStudioRoutingPlan(projectId, plan);
  return plan;
}

import "server-only";

import { getAdminStorage } from "@/lib/firebase/admin";
import { dryRunRunwayVideoRouter, extractRunwayRoutingCost } from "@/lib/studio/runway";
import { canKieKling26RenderScene, getKieCreditBalance, getKieIntegrationStatus, KIE_STUDIO_VIDEO_MODEL, normalizeKieKling26Duration } from "@/lib/studio/kie";
import { studioProviders } from "@/lib/studio/providers";
import { getStudioProject, saveStudioRoutingPlan, type StudioStoryboardScene } from "@/lib/studio/project-store";
import { STUDIO_ROUTING_POLICY_VERSION } from "@/lib/studio/governance";

type RouteCandidate = { providerId: string; providerName: string; score: number; executable: boolean; reason: string };
export type StudioSceneRouting = { sceneIndex: number; sceneTitle: string; selectedProviderId: string; selectedProviderName: string; selectedModel: string | null; estimatedCredits: number | null; executable: boolean; reason: string; selectionMode: "automatic" | "manual"; winnerScore: number; runnerUpScore: number | null; scoreMargin: number | null; candidates: RouteCandidate[] };

function scoreProvider(providerId: string, scene: StudioStoryboardScene, project: any, kieCredits: number | null) {
  const briefing = project.briefing ?? {};
  const continuity = project.continuity ?? {};
  let score = 50;
  const text = `${scene.title} ${scene.objective} ${scene.visualDirection} ${scene.technicalPrompt}`.toLowerCase();
  if (providerId === "runway") score += 22;
  if (continuity.mode === "strict") { if (providerId === "runway") score += continuity.referenceImageStoragePath ? 42 : 26; if (providerId === "kie-ai") score -= 18; }
  else if (continuity.mode === "coherent" && providerId === "runway") score += continuity.referenceImageStoragePath ? 18 : 8;
  if (providerId === "kie-ai") { score += kieCredits !== null && kieCredits > 0 ? 18 : -20; if (briefing.priority === "cost") score += 30; if (briefing.priority === "balanced") score += 10; if (/cinemat|realist|camera|movimento|produto|visual/.test(text)) score += 4; }
  if (providerId === "heygen" && briefing.useAvatar) score += 40;
  if (providerId === "heygen" && !briefing.useAvatar) score -= 18;
  if (providerId === "higgsfield" && /cinemat|camera|movimento|fashion|visual/.test(text)) score += 16;
  if (providerId === "veo" && /complex|realist|cinemat|audio/.test(text)) score += 12;
  if (providerId === "luma" && /image|produto|ambiente|movimento/.test(text)) score += 7;
  if (providerId === "kling" && /realist|pessoa|movimento/.test(text)) score += 8;
  if (briefing.priority === "cost" && !["runway", "kie-ai"].includes(providerId)) score -= 2;
  if (briefing.priority === "quality" && ["veo", "runway", "higgsfield"].includes(providerId)) score += 6;
  return score;
}

async function sceneFrameReferenceUrl(project: any) {
  const continuity = project?.continuity ?? {};
  const storagePath = continuity.referenceImageStoragePath;
  if (!storagePath || continuity.mode === "independent" || continuity.referencePurpose !== "scene-frame") return undefined;
  const file = (await getAdminStorage()).bucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) return undefined;
  const [url] = await file.getSignedUrl({ version: "v4", action: "read", expires: Date.now() + 25 * 60 * 1000 });
  return url;
}

function topCandidatesWithActiveProviders(candidates: RouteCandidate[]) {
  const top = candidates.slice(0, 5);
  for (const providerId of ["runway", "kie-ai"]) {
    const candidate = candidates.find(item => item.providerId === providerId);
    if (candidate && !top.some(item => item.providerId === providerId)) top.push(candidate);
  }
  return top.sort((a, b) => b.score - a.score);
}

export async function buildStudioRoutingPlan(projectId: string) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const storyboard = (project.storyboard ?? []) as StudioStoryboardScene[];
  if (!storyboard.length) throw new Error("studio_storyboard_empty");
  if (storyboard.some(scene => scene.status !== "approved")) throw new Error("studio_storyboard_not_approved");

  const kieStatus = getKieIntegrationStatus();
  let kieCredits: number | null = null;
  let kieReachable = false;
  if (kieStatus.configured) {
    try { kieCredits = await getKieCreditBalance(); kieReachable = true; } catch { kieReachable = false; }
  }

  const selectable = studioProviders.filter(provider => provider.selectable || provider.id === "kie-ai");
  const manualProviderId = project.briefing?.engineMode === "manual" ? project.briefing.manualEngineId : null;
  const routes: StudioSceneRouting[] = [];
  const projectSceneFrameUrl = await sceneFrameReferenceUrl(project);

  for (const scene of storyboard) {
    const kieSceneExecutable = kieReachable && (kieCredits ?? 0) > 0 && canKieKling26RenderScene(scene.durationSeconds);
    const candidates = selectable.map(provider => {
      const isRunway = provider.id === "runway";
      const isKie = provider.id === "kie-ai";
      const executable = isRunway || (isKie && kieSceneExecutable);
      const reason = isRunway
        ? (project.continuity?.mode === "strict" ? `Runway priorizado para continuidade estrita${projectSceneFrameUrl ? " com primeiro frame controlado" : ""}.` : "Integração ativa e validada no Studio.")
        : isKie
          ? !kieReachable
            ? (kieStatus.configured ? "Credencial Kie.ai configurada, mas a consulta de saldo não respondeu." : "Kie.ai ainda não possui credencial configurada.")
            : (kieCredits ?? 0) <= 0
              ? "Kie.ai conectado, porém sem créditos disponíveis."
              : !canKieKling26RenderScene(scene.durationSeconds)
                ? "Kling 2.6 via Kie.ai aceita clipes de até 10 segundos neste adapter."
                : `Kie.ai conectado com ${kieCredits ?? 0} créditos; adapter atual é text-to-video e tem menor garantia de identidade entre cenas.`
          : `${provider.name} está catalogado para comparação, mas ainda não possui adapter de geração ativo no Studio.`;
      return { providerId: provider.id, providerName: provider.name, score: scoreProvider(provider.id, scene, project, kieCredits), executable, reason };
    }).sort((a, b) => b.score - a.score);

    const requested = manualProviderId ? candidates.find(item => item.providerId === manualProviderId) : null;
    let selected = requested ?? candidates.find(item => item.executable) ?? candidates[0];
    if (!selected) throw new Error("studio_no_provider_candidate");
    const runnerUp = candidates.find(item => item.providerId !== selected.providerId) ?? null;
    let selectedModel: string | null = selected.providerId === "kie-ai" ? KIE_STUDIO_VIDEO_MODEL : null;
    let estimatedCredits: number | null = null;
    let reason = selected.reason;

    if (selected.providerId === "runway") {
      try {
        const aspect = project.briefing?.aspectRatio === "1:1" ? "1:1" : project.briefing?.aspectRatio === "9:16" || project.briefing?.aspectRatio === "4:5" ? "9:16" : "16:9";
        const dryRun = await dryRunRunwayVideoRouter({ promptText: scene.technicalPrompt, aspectRatio: aspect, duration: Math.min(30, Math.max(1, scene.durationSeconds)), ...(projectSceneFrameUrl ? { referenceImageUrl: projectSceneFrameUrl } : {}) });
        const routing: any = dryRun.routing ?? null;
        selectedModel = routing?.model ?? routing?.selectedModel ?? routing?.modelId ?? null;
        estimatedCredits = extractRunwayRoutingCost(routing);
        const identityNote = project.continuity?.referencePurpose === "character" && project.continuity?.referenceImageStoragePath ? " A imagem de personagem não é usada como primeiro frame para evitar duplicação." : "";
        reason = `Runway validado por dry run${projectSceneFrameUrl ? " com primeiro frame visual" : ""}; nenhuma mídia foi gerada.${identityNote}`;
      } catch (error) {
        selected = { ...selected, executable: false };
        reason = `Runway não pôde estimar esta cena: ${error instanceof Error ? error.message : "dry_run_failed"}.`;
      }
    } else if (selected.providerId === "kie-ai") {
      const renderDuration = normalizeKieKling26Duration(scene.durationSeconds);
      reason = `Kie.ai selecionado com ${kieCredits ?? 0} créditos disponíveis. Kling 2.6 gerará ${renderDuration}s; continuidade será orientada por prompt, sem imagem de referência neste adapter.`;
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
      selectionMode: requested ? "manual" : "automatic",
      winnerScore: selected.score,
      runnerUpScore: runnerUp?.score ?? null,
      scoreMargin: runnerUp ? selected.score - runnerUp.score : null,
      candidates: topCandidatesWithActiveProviders(candidates),
    });
  }

  const knownCredits = routes.map(item => item.estimatedCredits).filter((value): value is number => typeof value === "number");
  const totalEstimatedCredits = knownCredits.length === routes.length ? knownCredits.reduce((sum, value) => sum + value, 0) : null;
  const plan = {
    state: "estimated",
    policyVersion: STUDIO_ROUTING_POLICY_VERSION,
    generatedAt: new Date().toISOString(),
    decisionInputs: {
      priority: project.briefing?.priority ?? "balanced",
      engineMode: project.briefing?.engineMode ?? "automatic",
      manualProviderId: manualProviderId ?? null,
      continuityMode: project.continuity?.mode ?? "coherent",
      useAvatar: Boolean(project.briefing?.useAvatar),
      aspectRatio: project.briefing?.aspectRatio ?? null,
    },
    routes,
    totalEstimatedCredits,
    fullyExecutable: routes.every(item => item.executable),
    continuity: {
      mode: project.continuity?.mode ?? "coherent",
      referenceImageApplied: Boolean(projectSceneFrameUrl),
      referencePurpose: project.continuity?.referencePurpose ?? "character",
      chainPreviousScene: project.continuity?.chainPreviousScene !== false,
    },
    providerCoverage: { active: kieReachable ? ["runway", "kie-ai"] : ["runway"], recommendedNext: ["heygen", "higgsfield", "remotion"], planned: ["veo", "luma", "kling", "seedance"] },
    creditSources: { kie: { configured: kieStatus.configured, reachable: kieReachable, balance: kieCredits } },
  };
  await saveStudioRoutingPlan(projectId, plan);
  return plan;
}

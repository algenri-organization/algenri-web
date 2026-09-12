import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { buildStudioRoutingPlan } from "@/lib/studio/routing-planner";
import { recordStudioGovernanceEvent } from "@/lib/studio/governance";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const routing = await buildStudioRoutingPlan(projectId);
    const storyboard = Array.isArray(project.storyboard) ? project.storyboard : [];
    await recordStudioGovernanceEvent(projectId, {
      type: "routing.calculated",
      actorUid: user.uid,
      actorEmail: user.email ?? null,
      source: "studio-routing",
      summary: `Roteamento calculado para ${routing.routes.length} cena(s) usando a política ${routing.policyVersion}.`,
      details: {
        policyVersion: routing.policyVersion,
        totalEstimatedCredits: routing.totalEstimatedCredits,
        fullyExecutable: routing.fullyExecutable,
        decisionInputs: routing.decisionInputs,
        routes: routing.routes.map(route => {
          const scene = storyboard.find((item: any) => Number(item.index) === route.sceneIndex);
          return {
            sceneIndex: route.sceneIndex,
            provider: route.selectedProviderId,
            model: route.selectedModel,
            estimatedCredits: route.estimatedCredits,
            executable: route.executable,
            selectionMode: route.selectionMode,
            winnerScore: route.winnerScore,
            runnerUpScore: route.runnerUpScore,
            scoreMargin: route.scoreMargin,
            reason: route.reason,
            technicalPrompt: typeof scene?.technicalPrompt === "string" ? scene.technicalPrompt.slice(0, 5000) : null,
          };
        }),
      },
    });
    return Response.json({ ok: true, routing });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    const code = error instanceof Error ? error.message : "studio_routing_failed";
    const status = code === "studio_storyboard_not_approved" ? 409 : code === "studio_project_not_found" ? 404 : 500;
    console.error("studio_routing_failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}

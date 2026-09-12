import { listStudioGovernanceEvents, STUDIO_ROUTING_POLICY_VERSION } from "@/lib/studio/governance";
import { requireStudioProjectOwner, studioApiError } from "@/lib/studio/project-auth";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await requireStudioProjectOwner(request, projectId);
    if (!auth.ok) return auth.response;

    const events = await listStudioGovernanceEvents(projectId);
    const routing = auth.project.routing ?? null;
    const generation = auth.project.generation ?? {};
    const providerUsage = (Array.isArray(generation.sceneVersions) ? generation.sceneVersions : []).reduce((acc: Record<string, { jobs: number; credits: number }>, item: any) => {
      const provider = String(item.provider || "unknown");
      acc[provider] ??= { jobs: 0, credits: 0 };
      acc[provider].jobs += 1;
      if (typeof item.actualCredits === "number") acc[provider].credits += item.actualCredits;
      return acc;
    }, {});

    return Response.json({
      ok: true,
      policyVersion: routing?.policyVersion || STUDIO_ROUTING_POLICY_VERSION,
      routing,
      providerUsage,
      events,
    });
  } catch (error) {
    return studioApiError(error, "studio_governance_load_failed");
  }
}

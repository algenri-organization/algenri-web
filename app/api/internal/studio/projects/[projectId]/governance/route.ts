import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { listStudioGovernanceEvents, STUDIO_ROUTING_POLICY_VERSION } from "@/lib/studio/governance";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const events = await listStudioGovernanceEvents(projectId);
    const routing = project.routing ?? null;
    const generation = project.generation ?? {};
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
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_governance_load_failed", error);
    return Response.json({ ok: false, error: "studio_governance_load_failed" }, { status: 500 });
  }
}

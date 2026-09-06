import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createProject, listProjects } from "@/lib/client-flow/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const clientId = new URL(request.url).searchParams.get("clientId") ?? undefined;
    return Response.json({ ok: true, projects: await listProjects(clientId) });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Project list failed", error);
    return Response.json({ ok: false, error: "project_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const project = await createProject(await request.json(), user.email ?? user.uid);
    return Response.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "project_create_failed";
    const status = code === "client_not_found" ? 404 : code === "project_name_required" ? 400 : 500;
    return Response.json({ ok: false, error: code }, { status });
  }
}

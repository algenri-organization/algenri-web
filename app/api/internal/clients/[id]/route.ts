import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getClient, listProjects, updateClient } from "@/lib/client-flow/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const client = await getClient(id);
    if (!client) return Response.json({ ok: false, error: "client_not_found" }, { status: 404 });
    return Response.json({ ok: true, client, projects: await listProjects(id) });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Client detail failed", error);
    return Response.json({ ok: false, error: "client_detail_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const client = await updateClient(id, await request.json());
    if (!client) return Response.json({ ok: false, error: "client_not_found" }, { status: 404 });
    return Response.json({ ok: true, client });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Client update failed", error);
    return Response.json({ ok: false, error: "client_update_failed" }, { status: 500 });
  }
}

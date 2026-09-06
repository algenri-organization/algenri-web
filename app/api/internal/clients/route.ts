import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createClient, listClients } from "@/lib/client-flow/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, clients: await listClients() });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Client list failed", error);
    return Response.json({ ok: false, error: "client_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const client = await createClient(await request.json(), user.email ?? user.uid);
    return Response.json({ ok: true, client }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "client_create_failed";
    return Response.json({ ok: false, error: code }, { status: code === "client_name_required" ? 400 : 500 });
  }
}

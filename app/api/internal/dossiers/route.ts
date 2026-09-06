import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createProjectDossierFromBriefing, listProjectDossiers } from "@/lib/dossiers/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const dossiers = await listProjectDossiers();
    return Response.json({ ok: true, dossiers });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Dossier list failed", error);
    return Response.json({ ok: false, error: "dossier_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const body = await request.json();
    const briefingInstanceId = String(body.briefingInstanceId ?? "").trim();
    if (!briefingInstanceId) return Response.json({ ok: false, error: "briefing_required" }, { status: 400 });
    const result = await createProjectDossierFromBriefing(briefingInstanceId, user.email ?? user.uid);
    return Response.json({ ok: true, dossier: result.record, created: result.created }, { status: result.created ? 201 : 200 });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "dossier_create_failed";
    const status = code === "briefing_not_found" ? 404 : code === "briefing_not_completed" ? 409 : 500;
    console.error("Dossier creation failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}

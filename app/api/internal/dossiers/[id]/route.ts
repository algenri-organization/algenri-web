import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getProjectDossier, updateProjectDossier, type DossierStatus } from "@/lib/dossiers/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const dossier = await getProjectDossier(id);
    if (!dossier) return Response.json({ ok: false, error: "dossier_not_found" }, { status: 404 });
    return Response.json({ ok: true, dossier });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Dossier detail failed", error);
    return Response.json({ ok: false, error: "dossier_detail_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const body = await request.json();
    const dossier = await updateProjectDossier(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      status: typeof body.status === "string" ? body.status as DossierStatus : undefined,
      sections: Array.isArray(body.sections) ? body.sections : undefined,
    });
    if (!dossier) return Response.json({ ok: false, error: "dossier_not_found" }, { status: 404 });
    return Response.json({ ok: true, dossier });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Dossier update failed", error);
    return Response.json({ ok: false, error: "dossier_update_failed" }, { status: 500 });
  }
}

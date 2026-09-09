import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createDocumentModel, listDocumentModels, updateDocumentModel } from "@/lib/documents/model-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, models: await listDocumentModels() });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Document model list failed", error);
    return Response.json({ ok: false, error: "document_model_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const model = await createDocumentModel(await request.json(), user.email ?? user.uid);
    return Response.json({ ok: true, model }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "document_model_create_failed";
    const status = ["model_name_required", "model_content_required"].includes(code) ? 400 : 500;
    return Response.json({ ok: false, error: code }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const input = await request.json();
    const id = typeof input.id === "string" ? input.id.trim() : "";
    if (!id) return Response.json({ ok: false, error: "model_id_required" }, { status: 400 });
    const model = await updateDocumentModel(id, input, user.email ?? user.uid);
    if (!model) return Response.json({ ok: false, error: "model_not_found" }, { status: 404 });
    return Response.json({ ok: true, model });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "document_model_update_failed";
    const status = ["model_name_required", "model_content_required"].includes(code) ? 400 : 500;
    return Response.json({ ok: false, error: code }, { status });
  }
}

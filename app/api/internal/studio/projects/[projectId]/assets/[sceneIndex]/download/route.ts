import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { readStudioArchivedOutput } from "@/lib/studio/output-storage";

export async function GET(request: Request, context: { params: Promise<{ projectId: string; sceneIndex: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId, sceneIndex } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const index = Number(sceneIndex);
    const asset = Array.isArray(project.assets) ? project.assets.find((item: any) => item.sceneIndex === index && item.storagePath) : null;
    if (!asset?.storagePath) return Response.json({ ok: false, error: "asset_not_found" }, { status: 404 });

    const stored = await readStudioArchivedOutput(asset.storagePath);
    const filename = asset.filename || `ALGENRI-Studio-Cena-${String(index).padStart(2, "0")}.mp4`;
    const body = new Uint8Array(stored.buffer);

    return new Response(body, {
      headers: {
        "Content-Type": stored.contentType,
        "Content-Length": String(stored.sizeBytes),
        "Content-Disposition": `attachment; filename="${filename.replace(/\"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_asset_download_failed", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "studio_asset_download_failed" }, { status: 500 });
  }
}

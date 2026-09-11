import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { studioSceneFilename } from "@/lib/studio/file-naming";
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
    const requestedVersion = Number(new URL(request.url).searchParams.get("version") ?? 0);
    const assets = Array.isArray(project.assets) ? project.assets.filter((item: any) => item.sceneIndex === index && item.storagePath) : [];
    const activeVersion = Number(project.generation?.activeVersionByScene?.[String(index)] ?? 0);
    const targetVersion = requestedVersion > 0 ? requestedVersion : activeVersion;
    const asset = targetVersion > 0
      ? assets.find((item: any) => Number(item.version ?? 1) === targetVersion)
      : assets.sort((a: any, b: any) => Number(b.version ?? 1) - Number(a.version ?? 1))[0];
    if (!asset?.storagePath) return Response.json({ ok: false, error: "asset_not_found" }, { status: 404 });

    const stored = await readStudioArchivedOutput(asset.storagePath);
    const version = Number(asset.version ?? 1);
    const filename = studioSceneFilename(project, index, version).replace(/\"/g, "");
    const body = new Uint8Array(stored.buffer);

    return new Response(body, {
      headers: {
        "Content-Type": stored.contentType,
        "Content-Length": String(stored.sizeBytes),
        "Content-Disposition": `attachment; filename="${filename}"`,
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

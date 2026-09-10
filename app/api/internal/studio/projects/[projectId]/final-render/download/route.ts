import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { readStudioArchivedOutput } from "@/lib/studio/output-storage";
import { getStudioProject } from "@/lib/studio/project-store";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const storagePath = project.finalRender?.outputStoragePath;
    if (!storagePath || project.finalRender?.state !== "completed") {
      return Response.json({ ok: false, error: "studio_final_render_not_completed" }, { status: 409 });
    }

    const archived = await readStudioArchivedOutput(storagePath);
    return new Response(new Uint8Array(archived.buffer), {
      headers: {
        "Content-Type": archived.contentType || "video/mp4",
        "Content-Length": String(archived.sizeBytes),
        "Content-Disposition": `attachment; filename="ALGENRI-Studio-Video-Final.mp4"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_final_render_download_failed", error);
    return Response.json({ ok: false, error: "studio_final_render_download_failed" }, { status: 500 });
  }
}

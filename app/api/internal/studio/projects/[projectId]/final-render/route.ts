import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { prepareStudioFinalRender } from "@/lib/studio/final-render";
import { renderStudioFinalVideo } from "@/lib/studio/final-render-engine";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  action: z.enum(["prepare", "render"]).default("prepare"),
});

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    return Response.json({ ok: true, manifest: project.finalRender ?? null });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    return Response.json({ ok: false, error: "studio_final_render_load_failed" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });

    const manifest = parsed.data.action === "render"
      ? await renderStudioFinalVideo(projectId)
      : await prepareStudioFinalRender(projectId);
    return Response.json({ ok: true, manifest });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_final_render_failed", error);
    const code = error instanceof Error ? error.message : "studio_final_render_failed";
    const human: Record<string, string> = {
      studio_final_render_not_prepared: "Prepare a montagem final antes de renderizar o MP4.",
      studio_ffmpeg_unavailable: "O motor de renderização MP4 não está disponível neste ambiente.",
      studio_composition_not_approved: "A composição precisa estar aprovada antes da montagem final.",
    };
    return Response.json({ ok: false, error: code, message: human[code] ?? "Não foi possível concluir a renderização final." }, { status: 409 });
  }
}

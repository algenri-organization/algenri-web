import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { prepareStudioFinalRender } from "@/lib/studio/final-render";
import { refreshStudioSandboxRender, startStudioSandboxRender } from "@/lib/studio/final-render-sandbox";
import { buildStudioPreflightReport } from "@/lib/studio/preflight";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    const manifest = await refreshStudioSandboxRender(projectId);
    return Response.json({ ok: true, manifest });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_final_render_load_failed", error);
    const technicalDetail = error instanceof Error ? error.message.slice(0, 900) : "studio_final_render_load_failed";
    return Response.json({ ok: false, error: "studio_final_render_load_failed", technicalDetail }, { status: 500 });
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

    const preflight = await buildStudioPreflightReport(projectId);
    if (!preflight.ready) {
      return Response.json({
        ok: false,
        error: "studio_preflight_blocked",
        message: "O controle de qualidade encontrou pendências obrigatórias antes da montagem final.",
        preflight,
      }, { status: 409 });
    }

    const manifest = parsed.data.action === "render"
      ? await startStudioSandboxRender(projectId)
      : await prepareStudioFinalRender(projectId);
    return Response.json({ ok: true, manifest, preflight });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_final_render_failed", error);
    const code = error instanceof Error ? error.message : "studio_final_render_failed";
    const human: Record<string, string> = {
      studio_final_render_not_prepared: "Prepare a montagem final antes de renderizar o MP4.",
      studio_composition_not_approved: "A composição precisa estar aprovada antes da montagem final.",
      studio_sandbox_auth_missing: "A autenticação do worker de renderização não está disponível na Vercel.",
      studio_sandbox_project_id_missing: "O projeto Vercel não expôs o identificador necessário para iniciar o worker de renderização.",
    };
    const knownMessage = human[code];
    const technicalDetail = error instanceof Error ? error.message.slice(0, 1100) : "studio_final_render_failed";
    return Response.json({
      ok: false,
      error: code,
      message: knownMessage ?? "Não foi possível iniciar ou consultar a renderização final.",
      technicalDetail,
    }, { status: 409 });
  }
}

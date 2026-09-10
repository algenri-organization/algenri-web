import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { getStudioComposition, saveStudioComposition } from "@/lib/studio/composition-store";

const overlaySchema = z.object({
  sceneIndex: z.number().int().min(1),
  enabled: z.boolean(),
  eyebrow: z.string().max(80),
  headline: z.string().max(160),
  body: z.string().max(280),
  cta: z.string().max(100),
  align: z.enum(["left", "center", "right"]),
  position: z.enum(["top", "center", "bottom"]),
  showBrand: z.boolean(),
});

const patchSchema = z.object({
  sceneOverlays: z.array(overlaySchema),
  transition: z.enum(["cut", "fade"]),
  approve: z.boolean().optional(),
});

type AuthorizationResult =
  | { ok: true; project: NonNullable<Awaited<ReturnType<typeof getStudioProject>>> }
  | { ok: false; response: Response };

async function authorize(request: Request, projectId: string): Promise<AuthorizationResult> {
  const user = await requireAlgenriInternalUser(request);
  const project = await getStudioProject(projectId);
  if (!project) {
    return { ok: false, response: Response.json({ ok: false, error: "not_found" }, { status: 404 }) };
  }
  if (project.ownerUid && project.ownerUid !== user.uid) {
    return { ok: false, response: Response.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, project };
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    return Response.json({ ok: true, composition: await getStudioComposition(projectId) });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "composition_load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    }
    const composition = await saveStudioComposition(projectId, parsed.data);
    return Response.json({ ok: true, composition });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "composition_save_failed" }, { status: 500 });
  }
}

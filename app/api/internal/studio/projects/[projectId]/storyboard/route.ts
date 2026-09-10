import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { approveAllStudioStoryboardScenes, getStudioProject, updateStudioStoryboardScene } from "@/lib/studio/project-store";
import { regenerateStudioSceneWithAi } from "@/lib/studio/storyboard-ai";

const scenePatchSchema = z.object({
  action: z.literal("update_scene"),
  sceneIndex: z.number().int().min(1),
  patch: z.object({
    title: z.string().trim().min(1).max(300).optional(),
    durationSeconds: z.number().int().min(1).max(30).optional(),
    objective: z.string().trim().min(1).max(2000).optional(),
    narration: z.string().trim().max(3000).optional(),
    visualDirection: z.string().trim().min(1).max(4000).optional(),
    technicalPrompt: z.string().trim().min(1).max(6000).optional(),
    status: z.enum(["draft", "approved"]).optional(),
  }),
});

const regenerateSchema = z.object({
  action: z.literal("regenerate_scene"),
  sceneIndex: z.number().int().min(1),
  instructions: z.string().trim().max(2000).optional(),
});

const approveAllSchema = z.object({ action: z.literal("approve_all") });
const requestSchema = z.discriminatedUnion("action", [scenePatchSchema, regenerateSchema, approveAllSchema]);

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });

    if (parsed.data.action === "approve_all") {
      const storyboard = await approveAllStudioStoryboardScenes(projectId);
      return Response.json({ ok: true, storyboard });
    }

    if (parsed.data.action === "regenerate_scene") {
      const result = await regenerateStudioSceneWithAi(projectId, parsed.data.sceneIndex, parsed.data.instructions);
      return Response.json({ ok: true, ...result });
    }

    const scene = await updateStudioStoryboardScene(projectId, parsed.data.sceneIndex, parsed.data.patch);
    if (!scene) return Response.json({ ok: false, error: "scene_not_found" }, { status: 404 });
    return Response.json({ ok: true, scene });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    const code = error instanceof Error ? error.message : "storyboard_update_failed";
    const status = code.includes("not_found") ? 404 : code.startsWith("ai_") ? 502 : 500;
    console.error("studio_storyboard_update_failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}

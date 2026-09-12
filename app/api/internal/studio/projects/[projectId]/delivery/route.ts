import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

const deliverySchema = z.object({
  variants: z.array(z.enum(["9:16", "16:9", "1:1", "4:5"])).min(1).max(4),
  destinations: z.array(z.string().trim().min(2).max(80)).max(12).default([]),
  subtitles: z.object({
    enabled: z.boolean().default(true),
    format: z.enum(["srt", "vtt", "both"]).default("both"),
    burnIn: z.boolean().default(false),
    style: z.enum(["clean", "social", "minimal"]).default("clean"),
    safeArea: z.number().min(0).max(30).default(10),
  }),
  soundtrack: z.object({
    enabled: z.boolean().default(false),
    libraryItemId: z.string().trim().max(160).optional(),
    label: z.string().trim().max(200).optional(),
    volume: z.number().min(0).max(1).default(0.18),
    ducking: z.boolean().default(true),
    fadeInSeconds: z.number().min(0).max(10).default(0.8),
    fadeOutSeconds: z.number().min(0).max(10).default(1.2),
  }),
  includeScenes: z.boolean().default(false),
  includeAudio: z.boolean().default(true),
  includeCaptions: z.boolean().default(true),
  includeThumbnail: z.boolean().default(true),
});

function timestamp(seconds: number, vtt = false) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);
  const sep = vtt ? "." : ",";
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}${sep}${String(ms).padStart(3,"0")}`;
}

function buildCaptions(project: Record<string, any>) {
  const scenes = Array.isArray(project.storyboard) ? project.storyboard : [];
  let cursor = 0;
  const cues = scenes.map((scene: any, index: number) => {
    const duration = Math.max(1, Number(scene.durationSeconds || 1));
    const start = cursor;
    const end = cursor + duration;
    cursor = end;
    const text = String(scene.narration || "").trim();
    return { index: index + 1, start, end, text };
  }).filter((cue: any) => cue.text);
  const srt = cues.map((cue: any) => `${cue.index}\n${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text}`).join("\n\n");
  const vtt = `WEBVTT\n\n${cues.map((cue: any) => `${timestamp(cue.start,true)} --> ${timestamp(cue.end,true)}\n${cue.text}`).join("\n\n")}`;
  return { cues, srt, vtt, totalDurationSeconds: cursor };
}

async function authorize(request: Request, projectId: string) {
  const user = await requireAlgenriInternalUser(request);
  const project = await getStudioProject(projectId);
  if (!project) return { ok: false as const, response: Response.json({ ok: false, error: "not_found" }, { status: 404 }) };
  if (project.ownerUid && project.ownerUid !== user.uid) return { ok: false as const, response: Response.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  return { ok: true as const, user, project };
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    const captions = buildCaptions(auth.project);
    const delivery = auth.project.delivery ?? {
      variants: [auth.project.briefing?.aspectRatio || "9:16"],
      destinations: [auth.project.briefing?.destination || "Instagram Reels"],
      subtitles: { enabled: true, format: "both", burnIn: false, style: "clean", safeArea: 10 },
      soundtrack: { enabled: false, volume: 0.18, ducking: true, fadeInSeconds: 0.8, fadeOutSeconds: 1.2 },
      includeScenes: false, includeAudio: true, includeCaptions: true, includeThumbnail: true,
    };
    const packageManifest = {
      projectId,
      baseRenderReady: auth.project.finalRender?.state === "completed",
      variants: delivery.variants,
      files: [
        { kind: "video", name: "video-final.mp4", ready: auth.project.finalRender?.state === "completed" },
        ...(delivery.includeCaptions ? [{ kind: "subtitle", name: "legendas.srt", ready: captions.cues.length > 0 }, { kind: "subtitle", name: "legendas.vtt", ready: captions.cues.length > 0 }] : []),
        ...(delivery.includeAudio ? [{ kind: "audio", name: "narracao.wav", ready: Boolean(auth.project.voiceDirection) }] : []),
        ...(delivery.includeScenes ? [{ kind: "scenes", name: "cenas/", ready: Array.isArray(auth.project.generation?.sceneVersions) }] : []),
        ...(delivery.includeThumbnail ? [{ kind: "thumbnail", name: "thumbnail.jpg", ready: false }] : []),
      ],
    };
    return Response.json({ ok: true, delivery, captions, packageManifest });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_delivery_load_failed", error);
    return Response.json({ ok: false, error: "studio_delivery_load_failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    const parsed = deliverySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    const db = await getAdminDb();
    await db.collection("studioProjects").doc(projectId).set({ delivery: { ...parsed.data, updatedAt: new Date().toISOString() }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true, delivery: parsed.data });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_delivery_save_failed", error);
    return Response.json({ ok: false, error: "studio_delivery_save_failed" }, { status: 500 });
  }
}

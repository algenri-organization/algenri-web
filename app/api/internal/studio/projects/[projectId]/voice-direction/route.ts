import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

const sceneDirectionSchema = z.object({
  sceneIndex: z.number().int().min(1),
  emotion: z.string().trim().max(240).default(""),
  pace: z.enum(["inherit", "slow", "natural", "dynamic"]).default("inherit"),
  emphasis: z.string().trim().max(1200).default(""),
  pronunciationNotes: z.string().trim().max(1500).default(""),
  directionNotes: z.string().trim().max(1800).default(""),
});

const voiceDirectionSchema = z.object({
  profileId: z.string().trim().max(160).nullable().default(null),
  mode: z.enum(["single_track", "per_scene"]).default("per_scene"),
  globalDirection: z.string().trim().max(3000).default(""),
  globalPronunciationNotes: z.string().trim().max(3000).default(""),
  sceneDirections: z.array(sceneDirectionSchema).max(30).default([]),
});

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
    return Response.json({ ok: true, voiceDirection: auth.project.voiceDirection ?? null });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_voice_direction_load_failed", error);
    return Response.json({ ok: false, error: "studio_voice_direction_load_failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    const parsed = voiceDirectionSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });

    const db = await getAdminDb();
    let profileSnapshot: Record<string, unknown> | null = null;
    if (parsed.data.profileId) {
      const profile = await db.collection("studioVoiceProfiles").doc(parsed.data.profileId).get();
      if (!profile.exists || profile.data()?.ownerUid !== auth.user.uid) return Response.json({ ok: false, error: "voice_profile_not_found" }, { status: 404 });
      const data = profile.data() as Record<string, any>;
      profileSnapshot = {
        id: profile.id,
        name: data.name ?? "Perfil de voz",
        providerPreference: data.providerPreference ?? "undecided",
        language: data.language ?? "Português (Brasil)",
        voiceReference: data.voiceReference ?? "",
        tone: data.tone ?? "",
        emotion: data.emotion ?? "",
        pace: data.pace ?? "natural",
        pronunciationNotes: data.pronunciationNotes ?? "",
        directionNotes: data.directionNotes ?? "",
      };
    }

    const voiceDirection = {
      ...parsed.data,
      profileSnapshot,
      generationEnabled: false,
      generationState: "not_started",
      updatedAt: new Date().toISOString(),
    };
    await db.collection("studioProjects").doc(projectId).set({ voiceDirection, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true, voiceDirection });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_voice_direction_save_failed", error);
    return Response.json({ ok: false, error: "studio_voice_direction_save_failed" }, { status: 500 });
  }
}

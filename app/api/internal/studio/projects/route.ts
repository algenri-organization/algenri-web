import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createStudioVideoProject } from "@/lib/studio/project-store";

const briefingSchema = z.object({
  creationMode: z.enum(["quick", "advanced"]),
  objective: z.string().trim().min(3).max(2000),
  audience: z.string().trim().min(2).max(500),
  destination: z.string().trim().min(2).max(120),
  durationSeconds: z.number().int().min(3).max(180),
  centralIdea: z.string().trim().min(3).max(3000),
  scriptMode: z.enum(["ai", "manual"]),
  script: z.string().trim().max(6000).optional(),
  visualStyle: z.string().trim().min(2).max(200),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]),
  useBrandIdentity: z.boolean(),
  useAvatar: z.boolean(),
  avatarId: z.string().trim().max(200).optional(),
  useVoice: z.boolean(),
  voiceId: z.string().trim().max(200).optional(),
  pronunciationNotes: z.string().trim().max(1500).optional(),
  requiredScenes: z.string().trim().max(3000).optional(),
  requiredOnScreenText: z.string().trim().max(2000).optional(),
  prohibitedElements: z.string().trim().max(3000).optional(),
  referenceNotes: z.string().trim().max(3000).optional(),
  priority: z.enum(["quality", "cost", "speed", "balanced"]),
  engineMode: z.enum(["automatic", "manual"]),
  manualEngineId: z.string().trim().max(120).optional(),
  budgetLimit: z.number().min(0).max(1000000).optional(),
});

const requestSchema = z.object({
  name: z.string().trim().min(2).max(180),
  briefing: briefingSchema,
});

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    }

    const created = await createStudioVideoProject({
      ownerUid: user.uid,
      ownerEmail: user.email,
      name: parsed.data.name,
      briefing: parsed.data.briefing,
    });

    return Response.json({ ok: true, projectId: created.id, storyboard: created.storyboard }, { status: 201 });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_project_create_failed", error);
    return Response.json({ ok: false, error: "studio_project_create_failed" }, { status: 500 });
  }
}

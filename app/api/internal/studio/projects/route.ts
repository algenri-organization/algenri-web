import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { createStudioVideoProject } from "@/lib/studio/project-store";
import { saveStudioContinuity } from "@/lib/studio/continuity-store";
import { generateStudioStoryboardWithAi } from "@/lib/studio/storyboard-ai";

const briefingSchema = z.object({
  creationMode: z.enum(["quick", "advanced"]), objective: z.string().trim().min(3).max(2000), audience: z.string().trim().min(2).max(500), destination: z.string().trim().min(2).max(120), durationSeconds: z.number().int().min(3).max(180), centralIdea: z.string().trim().min(3).max(3000),
  scriptMode: z.enum(["ai", "manual"]), script: z.string().trim().max(6000).optional(), visualStyle: z.string().trim().min(2).max(200), aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]), useBrandIdentity: z.boolean(), useAvatar: z.boolean(), avatarId: z.string().trim().max(200).optional(), useVoice: z.boolean(), voiceId: z.string().trim().max(200).optional(), pronunciationNotes: z.string().trim().max(1500).optional(), requiredScenes: z.string().trim().max(3000).optional(), requiredOnScreenText: z.string().trim().max(2000).optional(), prohibitedElements: z.string().trim().max(3000).optional(), referenceNotes: z.string().trim().max(3000).optional(), peopleMode: z.enum(["none", "generic", "recurring"]).default("generic"), priority: z.enum(["quality", "cost", "speed", "balanced"]), engineMode: z.enum(["automatic", "manual"]), manualEngineId: z.string().trim().max(120).optional(), budgetLimit: z.number().min(0).max(1000000).optional(),
});

const continuitySeedSchema = z.object({
  mode: z.enum(["independent", "coherent", "strict"]).default("coherent"),
  characters: z.string().trim().max(1800).default(""),
  environment: z.string().trim().max(1800).default(""),
  wardrobe: z.string().trim().max(1200).default(""),
  visualRules: z.string().trim().max(1800).default(""),
  chainPreviousScene: z.boolean().default(true),
}).optional();

const commercialLinkSchema = z.object({ origin: z.enum(["internal", "client"]), clientId: z.string().trim().optional(), commercialProjectId: z.string().trim().optional(), proposalId: z.string().trim().optional(), contractId: z.string().trim().optional() });
const requestSchema = z.object({ name: z.string().trim().min(2).max(180), briefing: briefingSchema, continuitySeed: continuitySeedSchema, commercialLink: commercialLinkSchema.default({ origin: "internal" }) });

function iso(value: any) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const db = await getAdminDb();
    const snapshot = await db.collection("studioProjects").where("ownerUid", "==", user.uid).get();
    const projects = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      const storyboard = Array.isArray(data.storyboard) ? data.storyboard : [];
      const generation = data.generation ?? {};
      return {
        id: doc.id,
        name: data.name || "Projeto sem nome",
        format: data.format || "video",
        status: data.status || "planning",
        destination: data.briefing?.destination || "—",
        aspectRatio: data.briefing?.aspectRatio || "—",
        durationSeconds: Number(data.briefing?.durationSeconds || 0) || null,
        visualStyle: data.briefing?.visualStyle || "—",
        sceneCount: storyboard.length,
        generationState: generation.state || "not_started",
        finalRenderState: data.finalRender?.state || null,
        createdAt: iso(data.createdAt),
        updatedAt: iso(data.updatedAt),
      };
    }).sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));

    return Response.json({ ok: true, projects });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_project_list_failed", error);
    return Response.json({ ok: false, error: "studio_project_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });

    const created = await createStudioVideoProject({ ownerUid: user.uid, ownerEmail: user.email, name: parsed.data.name, briefing: parsed.data.briefing, commercialLink: parsed.data.commercialLink });
    if (parsed.data.continuitySeed) await saveStudioContinuity(created.id, parsed.data.continuitySeed);
    let storyboard = created.storyboard;
    let ai = { generated: false, fallback: false, model: null as string | null };

    if (parsed.data.briefing.scriptMode === "ai") {
      try {
        const generated = await generateStudioStoryboardWithAi(created.id);
        storyboard = generated.storyboard;
        ai = { generated: true, fallback: false, model: generated.model };
      } catch (error) {
        console.error("studio_storyboard_ai_fallback", error);
        ai = { generated: false, fallback: true, model: null };
      }
    }

    return Response.json({ ok: true, projectId: created.id, storyboard, commercialLink: created.commercialLink, ai }, { status: 201 });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    const code = error instanceof Error ? error.message : "studio_project_create_failed";
    const status = code.includes("required") || code.includes("mismatch") ? 400 : code.includes("not_found") ? 404 : 500;
    console.error("studio_project_create_failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}

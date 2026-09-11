import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const profileSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().min(2).max(120),
  providerPreference: z.enum(["undecided", "elevenlabs", "minimax"]).default("undecided"),
  language: z.string().trim().min(2).max(80).default("Português (Brasil)"),
  voiceReference: z.string().trim().max(240).optional(),
  tone: z.string().trim().max(240).optional(),
  emotion: z.string().trim().max(240).optional(),
  pace: z.enum(["slow", "natural", "dynamic"]).default("natural"),
  pronunciationNotes: z.string().trim().max(3000).optional(),
  directionNotes: z.string().trim().max(3000).optional(),
  usageNotes: z.string().trim().max(2000).optional(),
  isDefault: z.boolean().default(false),
});

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
    const snapshot = await db.collection("studioVoiceProfiles").where("ownerUid", "==", user.uid).get();
    const profiles = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        name: data.name || "Perfil sem nome",
        providerPreference: data.providerPreference || "undecided",
        language: data.language || "Português (Brasil)",
        voiceReference: data.voiceReference || "",
        tone: data.tone || "",
        emotion: data.emotion || "",
        pace: data.pace || "natural",
        pronunciationNotes: data.pronunciationNotes || "",
        directionNotes: data.directionNotes || "",
        usageNotes: data.usageNotes || "",
        isDefault: Boolean(data.isDefault),
        createdAt: iso(data.createdAt),
        updatedAt: iso(data.updatedAt),
      };
    }).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || String(a.name).localeCompare(String(b.name)));
    return Response.json({ ok: true, profiles });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_voice_profiles_list_failed", error);
    return Response.json({ ok: false, error: "studio_voice_profiles_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    const db = await getAdminDb();
    const data = parsed.data;
    const ref = data.id ? db.collection("studioVoiceProfiles").doc(data.id) : db.collection("studioVoiceProfiles").doc();

    if (data.id) {
      const current = await ref.get();
      if (!current.exists || current.data()?.ownerUid !== user.uid) return Response.json({ ok: false, error: "voice_profile_not_found" }, { status: 404 });
    }

    if (data.isDefault) {
      const defaults = await db.collection("studioVoiceProfiles").where("ownerUid", "==", user.uid).where("isDefault", "==", true).get();
      await Promise.all(defaults.docs.filter((doc) => doc.id !== ref.id).map((doc) => doc.ref.set({ isDefault: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true })));
    }

    await ref.set({
      ownerUid: user.uid,
      ownerEmail: user.email ?? null,
      name: data.name,
      providerPreference: data.providerPreference,
      language: data.language,
      voiceReference: data.voiceReference || "",
      tone: data.tone || "",
      emotion: data.emotion || "",
      pace: data.pace,
      pronunciationNotes: data.pronunciationNotes || "",
      directionNotes: data.directionNotes || "",
      usageNotes: data.usageNotes || "",
      isDefault: data.isDefault,
      updatedAt: FieldValue.serverTimestamp(),
      ...(data.id ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    return Response.json({ ok: true, id: ref.id });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_voice_profile_save_failed", error);
    return Response.json({ ok: false, error: "studio_voice_profile_save_failed" }, { status: 500 });
  }
}

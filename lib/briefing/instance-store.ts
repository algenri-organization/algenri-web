import { getAdminDb } from "@/lib/firebase/admin";
import { calculateBriefingProgress } from "@/lib/briefing/progress";
import { createBriefingToken, verifyBriefingToken } from "@/lib/briefing/tokens";
import { getBriefingTemplate } from "@/lib/briefing/template-store";
import type { BriefingStatus, BriefingTemplateSnapshot } from "@/lib/briefing/types";

const INSTANCE_COLLECTION = "briefing_instances";
const RESPONSE_COLLECTION = "briefing_responses";

export type BriefingInstanceRecord = {
  id: string;
  templateId: string;
  templateVersion: string;
  templateSnapshot: BriefingTemplateSnapshot;
  slug: string;
  clientName: string;
  projectName: string;
  clientId: string;
  projectId: string;
  accessTokenHash: string;
  status: BriefingStatus;
  progress: number;
  startedAt: string | null;
  lastSavedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function createBriefingInstance(input: {
  templateId: string;
  clientName: string;
  projectName: string;
  slug: string;
  createdBy: string;
}) {
  const template = await getBriefingTemplate(input.templateId);
  if (!template) throw new Error("template_not_found");
  if (template.status !== "published") throw new Error("template_not_published");

  const slug = normalizeSlug(input.slug);
  if (!slug) throw new Error("invalid_slug");

  const db = await getAdminDb();
  const existing = await db.collection(INSTANCE_COLLECTION).where("slug", "==", slug).limit(1).get();
  if (!existing.empty) throw new Error("slug_in_use");

  const ref = db.collection(INSTANCE_COLLECTION).doc();
  const now = new Date().toISOString();
  const { token, hash } = createBriefingToken();
  const snapshot: BriefingTemplateSnapshot = {
    name: template.name,
    projectType: template.projectType,
    version: template.version,
    privacyNoticeVersion: template.privacyNoticeVersion,
    sections: template.sections,
  };

  const record: BriefingInstanceRecord = {
    id: ref.id,
    templateId: template.id,
    templateVersion: template.version,
    templateSnapshot: snapshot,
    slug,
    clientName: input.clientName.trim(),
    projectName: input.projectName.trim(),
    clientId: slug,
    projectId: `${slug}-${ref.id.slice(0, 8)}`,
    accessTokenHash: hash,
    status: "not_started",
    progress: 0,
    startedAt: null,
    lastSavedAt: null,
    completedAt: null,
    expiresAt: null,
    createdAt: now,
    createdBy: input.createdBy,
  };

  await ref.set(record);
  await db.collection(RESPONSE_COLLECTION).doc(ref.id).set({ instanceId: ref.id, answers: {}, updatedAt: now });
  return { record, token };
}

export async function getBriefingInstanceBySlug(slug: string) {
  const db = await getAdminDb();
  const snapshot = await db.collection(INSTANCE_COLLECTION).where("slug", "==", normalizeSlug(slug)).limit(1).get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as BriefingInstanceRecord;
}

export async function getAuthorizedPublicBriefing(slug: string, token: string) {
  const instance = await getBriefingInstanceBySlug(slug);
  if (!instance || !verifyBriefingToken(token, instance.accessTokenHash)) return null;

  const db = await getAdminDb();
  const response = await db.collection(RESPONSE_COLLECTION).doc(instance.id).get();
  const answers = (response.data()?.answers ?? {}) as Record<string, unknown>;
  return { instance, answers };
}

export async function savePublicBriefingAnswers(slug: string, token: string, answers: Record<string, unknown>) {
  const authorized = await getAuthorizedPublicBriefing(slug, token);
  if (!authorized) return null;
  if (authorized.instance.status === "completed" || authorized.instance.status === "archived") throw new Error("briefing_locked");

  const db = await getAdminDb();
  const now = new Date().toISOString();
  const merged = { ...authorized.answers, ...answers };
  const progress = calculateBriefingProgress(authorized.instance.templateSnapshot.sections, merged);
  const status: BriefingStatus = merged && Object.keys(merged).length ? "in_progress" : authorized.instance.status;

  await db.collection(RESPONSE_COLLECTION).doc(authorized.instance.id).set({ answers: merged, updatedAt: now }, { merge: true });
  await db.collection(INSTANCE_COLLECTION).doc(authorized.instance.id).set({
    progress,
    status,
    startedAt: authorized.instance.startedAt ?? now,
    lastSavedAt: now,
  }, { merge: true });

  return { progress, status, lastSavedAt: now };
}

export async function completePublicBriefing(slug: string, token: string) {
  const authorized = await getAuthorizedPublicBriefing(slug, token);
  if (!authorized) return null;

  const progress = calculateBriefingProgress(authorized.instance.templateSnapshot.sections, authorized.answers);
  if (progress < 100) throw new Error("required_answers_missing");

  const db = await getAdminDb();
  const now = new Date().toISOString();
  await db.collection(INSTANCE_COLLECTION).doc(authorized.instance.id).set({
    progress: 100,
    status: "completed",
    completedAt: now,
    lastSavedAt: now,
  }, { merge: true });
  return { completedAt: now };
}

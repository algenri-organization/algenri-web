import { getAdminDb } from "@/lib/firebase/admin";
import { calculateBriefingProgress, hasMissingRequiredBriefingAnswers } from "@/lib/briefing/progress";
import { createBriefingToken, verifyBriefingToken } from "@/lib/briefing/tokens";
import { getBriefingTemplate } from "@/lib/briefing/template-store";
import { getClient, getProject } from "@/lib/client-flow/store";
import type { BriefingStatus, BriefingTemplateSnapshot } from "@/lib/briefing/types";

const INSTANCE_COLLECTION = "briefing_instances";
const RESPONSE_COLLECTION = "briefing_responses";
const DOSSIER_COLLECTION = "project_dossiers";

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
  linkedAt?: string | null;
  linkedBy?: string | null;
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
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

export async function createBriefingInstance(input: { templateId: string; clientName: string; projectName: string; slug: string; createdBy: string; clientId?: string; projectId?: string; }) {
  const template = await getBriefingTemplate(input.templateId);
  if (!template) throw new Error("template_not_found");
  if (template.status !== "published") throw new Error("template_not_published");
  const slug = normalizeSlug(input.slug);
  if (!slug) throw new Error("invalid_slug");
  const db = await getAdminDb();
  const existing = await db.collection(INSTANCE_COLLECTION).where("slug", "==", slug).limit(1).get();
  if (!existing.empty) throw new Error("slug_in_use");

  let clientName = input.clientName.trim();
  let projectName = input.projectName.trim();
  let clientId = slug;
  let projectId = "";
  let linkedAt: string | null = null;
  let linkedBy: string | null = null;

  if (input.clientId && input.projectId) {
    const [client, project] = await Promise.all([getClient(input.clientId), getProject(input.projectId)]);
    if (!client) throw new Error("client_not_found");
    if (!project || project.clientId !== client.id) throw new Error("project_client_mismatch");
    clientId = client.id;
    projectId = project.id;
    clientName = client.tradeName || client.legalName;
    projectName = project.name;
    linkedAt = new Date().toISOString();
    linkedBy = input.createdBy;
  }

  const ref = db.collection(INSTANCE_COLLECTION).doc();
  const now = new Date().toISOString();
  if (!projectId) projectId = `${slug}-${ref.id.slice(0, 8)}`;
  const { token, hash } = createBriefingToken();
  const snapshot: BriefingTemplateSnapshot = { name: template.name, projectType: template.projectType, version: template.version, privacyNoticeVersion: template.privacyNoticeVersion, sections: template.sections };
  const record: BriefingInstanceRecord = { id: ref.id, templateId: template.id, templateVersion: template.version, templateSnapshot: snapshot, slug, clientName, projectName, clientId, projectId, linkedAt, linkedBy, accessTokenHash: hash, status: "not_started", progress: 0, startedAt: null, lastSavedAt: null, completedAt: null, expiresAt: null, createdAt: now, createdBy: input.createdBy };
  await ref.set(record);
  await db.collection(RESPONSE_COLLECTION).doc(ref.id).set({ instanceId: ref.id, answers: {}, updatedAt: now });
  return { record, token };
}

export async function listBriefingInstances(filters?: { projectId?: string; unlinked?: boolean }) {
  const db = await getAdminDb();
  const snapshot = await db.collection(INSTANCE_COLLECTION).orderBy("createdAt", "desc").limit(100).get();
  let records = snapshot.docs.map((doc) => doc.data() as BriefingInstanceRecord);
  if (filters?.projectId) records = records.filter((record) => record.projectId === filters.projectId && Boolean(record.linkedAt));
  if (filters?.unlinked) records = records.filter((record) => !record.linkedAt);
  return records;
}

export async function linkBriefingInstanceToProject(id: string, clientId: string, projectId: string, linkedBy: string) {
  const [client, project] = await Promise.all([getClient(clientId), getProject(projectId)]);
  if (!client) throw new Error("client_not_found");
  if (!project || project.clientId !== client.id) throw new Error("project_client_mismatch");
  const db = await getAdminDb();
  const ref = db.collection(INSTANCE_COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("briefing_not_found");
  const current = doc.data() as BriefingInstanceRecord;
  if (current.linkedAt && (current.clientId !== clientId || current.projectId !== projectId)) throw new Error("briefing_already_linked");
  const linkedAt = new Date().toISOString();
  await ref.set({ clientId, projectId, clientName: client.tradeName || client.legalName, projectName: project.name, linkedAt, linkedBy }, { merge: true });
  const updated = await ref.get();
  return updated.data() as BriefingInstanceRecord;
}

export async function unlinkBriefingInstanceFromProject(id: string) {
  const db = await getAdminDb();
  const dossier = await db.collection(DOSSIER_COLLECTION).where("sourceBriefingInstanceId", "==", id).limit(1).get();
  if (!dossier.empty) throw new Error("briefing_has_dossier");
  const ref = db.collection(INSTANCE_COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("briefing_not_found");
  const current = doc.data() as BriefingInstanceRecord;
  const legacyClientId = current.slug;
  const legacyProjectId = `${current.slug}-${current.id.slice(0, 8)}`;
  await ref.set({ clientId: legacyClientId, projectId: legacyProjectId, linkedAt: null, linkedBy: null }, { merge: true });
  return { ok: true };
}

export async function getInternalBriefingInstance(id: string) {
  const db = await getAdminDb();
  const instanceDoc = await db.collection(INSTANCE_COLLECTION).doc(id).get();
  if (!instanceDoc.exists) return null;
  const instance = instanceDoc.data() as BriefingInstanceRecord;
  const responseDoc = await db.collection(RESPONSE_COLLECTION).doc(id).get();
  const answers = (responseDoc.data()?.answers ?? {}) as Record<string, unknown>;
  const progress = calculateBriefingProgress(instance.templateSnapshot.sections, answers);
  if (progress !== instance.progress) { await db.collection(INSTANCE_COLLECTION).doc(id).set({ progress }, { merge: true }); instance.progress = progress; }
  return { instance, answers };
}

export async function resetBriefingInstance(id: string) {
  const db = await getAdminDb();
  const instanceRef = db.collection(INSTANCE_COLLECTION).doc(id);
  const responseRef = db.collection(RESPONSE_COLLECTION).doc(id);
  const instanceDoc = await instanceRef.get();
  if (!instanceDoc.exists) return null;
  const now = new Date().toISOString();
  const batch = db.batch();
  batch.set(responseRef, { instanceId: id, answers: {}, updatedAt: now });
  batch.set(instanceRef, { status: "not_started", progress: 0, startedAt: null, lastSavedAt: null, completedAt: null }, { merge: true });
  await batch.commit();
  return { ok: true, resetAt: now };
}

export async function regenerateBriefingAccessToken(id: string) {
  const db = await getAdminDb();
  const instanceRef = db.collection(INSTANCE_COLLECTION).doc(id);
  const instanceDoc = await instanceRef.get();
  if (!instanceDoc.exists) return null;
  const instance = instanceDoc.data() as BriefingInstanceRecord;
  const { token, hash } = createBriefingToken();
  const generatedAt = new Date().toISOString();
  await instanceRef.set({ accessTokenHash: hash, accessTokenRotatedAt: generatedAt }, { merge: true });
  return { ok: true, slug: instance.slug, token, generatedAt };
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
  const recalculatedProgress = calculateBriefingProgress(instance.templateSnapshot.sections, answers);
  if (recalculatedProgress !== instance.progress) { await db.collection(INSTANCE_COLLECTION).doc(instance.id).set({ progress: recalculatedProgress }, { merge: true }); instance.progress = recalculatedProgress; }
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
  await db.collection(INSTANCE_COLLECTION).doc(authorized.instance.id).set({ progress, status, startedAt: authorized.instance.startedAt ?? now, lastSavedAt: now }, { merge: true });
  return { progress, status, lastSavedAt: now };
}

export async function completePublicBriefing(slug: string, token: string) {
  const authorized = await getAuthorizedPublicBriefing(slug, token);
  if (!authorized) return null;
  if (hasMissingRequiredBriefingAnswers(authorized.instance.templateSnapshot.sections, authorized.answers)) throw new Error("required_answers_missing");
  const db = await getAdminDb();
  const now = new Date().toISOString();
  const progress = calculateBriefingProgress(authorized.instance.templateSnapshot.sections, authorized.answers);
  await db.collection(INSTANCE_COLLECTION).doc(authorized.instance.id).set({ progress, status: "completed", completedAt: now, lastSavedAt: now }, { merge: true });
  return { completedAt: now, progress };
}

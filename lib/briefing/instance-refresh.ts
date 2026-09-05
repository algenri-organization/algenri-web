import { getAdminDb } from "@/lib/firebase/admin";
import { getBriefingTemplate } from "@/lib/briefing/template-store";
import type { BriefingTemplateSnapshot } from "@/lib/briefing/types";

const INSTANCE_COLLECTION = "briefing_instances";
const RESPONSE_COLLECTION = "briefing_responses";

export async function refreshBriefingInstanceTemplate(instanceId: string, templateId: string) {
  const template = await getBriefingTemplate(templateId);
  if (!template) throw new Error("template_not_found");
  if (template.status !== "published") throw new Error("template_not_published");

  const db = await getAdminDb();
  const instanceRef = db.collection(INSTANCE_COLLECTION).doc(instanceId);
  const responseRef = db.collection(RESPONSE_COLLECTION).doc(instanceId);
  const instanceDoc = await instanceRef.get();
  if (!instanceDoc.exists) return null;

  const now = new Date().toISOString();
  const snapshot: BriefingTemplateSnapshot = {
    name: template.name,
    projectType: template.projectType,
    version: template.version,
    privacyNoticeVersion: template.privacyNoticeVersion,
    sections: template.sections,
  };

  const batch = db.batch();
  batch.set(responseRef, { instanceId, answers: {}, updatedAt: now });
  batch.set(instanceRef, {
    templateId: template.id,
    templateVersion: template.version,
    templateSnapshot: snapshot,
    status: "not_started",
    progress: 0,
    startedAt: null,
    lastSavedAt: null,
    completedAt: null,
  }, { merge: true });
  await batch.commit();

  return {
    ok: true,
    refreshedAt: now,
    templateId: template.id,
    templateVersion: template.version,
    templateName: template.name,
  };
}

import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import type { BriefingImportResult } from "@/lib/briefing/importer";
import type { BriefingTemplateRecord, BriefingTemplateSnapshot, TemplateStatus } from "@/lib/briefing/types";

const TEMPLATE_COLLECTION = "briefing_templates";

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "briefing.docx";
}

export async function persistImportedBriefingTemplate(input: {
  importResult: BriefingImportResult;
  originalFile: Buffer;
  originalFileName: string;
  mimeType: string;
  createdBy: string;
}): Promise<BriefingTemplateRecord> {
  const db = await getAdminDb();
  const storage = await getAdminStorage();
  const templateRef = db.collection(TEMPLATE_COLLECTION).doc();
  const now = new Date().toISOString();
  const sourceName = safeFileName(input.originalFileName);
  const storagePath = `briefing-templates/${templateRef.id}/source/${Date.now()}-${sourceName}`;
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  await file.save(input.originalFile, {
    resumable: false,
    metadata: {
      contentType: input.mimeType,
      cacheControl: "private, no-store, max-age=0",
      metadata: {
        templateId: templateRef.id,
        uploadedBy: input.createdBy,
      },
    },
  });

  const record: BriefingTemplateRecord = {
    id: templateRef.id,
    ...input.importResult.template,
    status: "draft",
    source: {
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.originalFile.byteLength,
      storagePath,
      parser: input.importResult.source.parser,
      importedAt: now,
      warnings: input.importResult.warnings.map((warning) => warning.message),
    },
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await templateRef.set(record);
  } catch (error) {
    await file.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw error;
  }

  return record;
}

export async function listBriefingTemplates(limit = 50): Promise<BriefingTemplateRecord[]> {
  const db = await getAdminDb();
  const snapshot = await db.collection(TEMPLATE_COLLECTION).orderBy("updatedAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => doc.data() as BriefingTemplateRecord);
}

export async function getBriefingTemplate(id: string): Promise<BriefingTemplateRecord | null> {
  const db = await getAdminDb();
  const snapshot = await db.collection(TEMPLATE_COLLECTION).doc(id).get();
  return snapshot.exists ? (snapshot.data() as BriefingTemplateRecord) : null;
}

export async function updateBriefingTemplate(input: {
  id: string;
  snapshot: BriefingTemplateSnapshot;
  status: TemplateStatus;
  updatedBy: string;
}): Promise<BriefingTemplateRecord | null> {
  const db = await getAdminDb();
  const ref = db.collection(TEMPLATE_COLLECTION).doc(input.id);
  const current = await ref.get();
  if (!current.exists) return null;

  const currentData = current.data() as BriefingTemplateRecord;
  const updated: BriefingTemplateRecord = {
    ...currentData,
    ...input.snapshot,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };

  await ref.set({ ...updated, updatedBy: input.updatedBy }, { merge: true });
  return updated;
}

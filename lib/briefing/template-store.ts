import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import type { BriefingImportResult } from "@/lib/briefing/importer";
import type { BriefingTemplateRecord } from "@/lib/briefing/types";

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

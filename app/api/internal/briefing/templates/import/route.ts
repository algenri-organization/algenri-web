import { importBriefingDocx } from "@/lib/briefing/importer";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { persistImportedBriefingTemplate } from "@/lib/briefing/template-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOCX_BYTES = 10 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function textField(formData: FormData, name: string, fallback?: string) {
  const value = formData.get(name);
  if (typeof value === "string" && value.trim()) return value.trim();
  if (fallback !== undefined) return fallback;
  throw new Error(`MISSING_FIELD:${name}`);
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "docx_file_required" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".docx") && file.type !== DOCX_MIME) {
      return Response.json({ ok: false, error: "invalid_file_type" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_DOCX_BYTES) {
      return Response.json({ ok: false, error: "invalid_file_size", maxBytes: MAX_DOCX_BYTES }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const importResult = await importBriefingDocx(buffer, {
      name: textField(formData, "name"),
      projectType: textField(formData, "projectType"),
      version: textField(formData, "version", "1.0"),
      privacyNoticeVersion: textField(formData, "privacyNoticeVersion", "1.0"),
    });

    if (importResult.source.questionCount === 0) {
      return Response.json({
        ok: false,
        error: "no_questions_detected",
        warnings: importResult.warnings,
      }, { status: 422 });
    }

    const record = await persistImportedBriefingTemplate({
      importResult,
      originalFile: buffer,
      originalFileName: file.name,
      mimeType: file.type || DOCX_MIME,
      createdBy: user.email,
    });

    return Response.json({
      ok: true,
      templateId: record.id,
      status: record.status,
      name: record.name,
      version: record.version,
      sectionCount: importResult.source.sectionCount,
      questionCount: importResult.source.questionCount,
      warnings: importResult.warnings,
    }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("MISSING_FIELD:")) {
      return Response.json({ ok: false, error: "missing_required_field", field: message.split(":")[1] }, { status: 400 });
    }

    console.error("Briefing DOCX import failed", error);
    return Response.json({ ok: false, error: "briefing_import_failed" }, { status: 500 });
  }
}

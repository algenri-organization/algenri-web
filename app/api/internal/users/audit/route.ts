import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { isInternalAdmin, listInternalAccessAudit } from "@/lib/internal/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    if (!(await isInternalAdmin(user.uid, user.email))) return Response.json({ ok: false, error: "admin_required" }, { status: 403 });
    const entries = await listInternalAccessAudit(30);
    return Response.json({ ok: true, entries });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "access_audit_load_failed" }, { status: 500 });
  }
}

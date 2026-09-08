import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { isInternalAdmin, listInternalUsers, normalizePermissions, provisionInternalUser, updateInternalUser } from "@/lib/internal/users";

async function requireAdmin(request: Request) {
  const user = await requireAlgenriInternalUser(request);
  if (!(await isInternalAdmin(user.uid, user.email))) throw new Error("INTERNAL_ADMIN_REQUIRED");
  return user;
}

function authError(error: unknown) {
  const base = internalAuthResponse(error);
  if (base) return base;
  if (error instanceof Error && error.message === "INTERNAL_ADMIN_REQUIRED") return Response.json({ ok: false, error: "admin_required" }, { status: 403 });
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await requireAdmin(request);
    const users = await listInternalUsers(user);
    return Response.json({ ok: true, users });
  } catch (error) {
    return authError(error) ?? Response.json({ ok: false, error: "users_load_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json();
    const user = await provisionInternalUser(actor, {
      email: String(body.email || ""),
      displayName: String(body.displayName || ""),
      role: body.role === "admin" ? "admin" : "member",
      permissions: normalizePermissions(body.permissions),
    });
    return Response.json({ ok: true, user });
  } catch (error) {
    const handled = authError(error);
    if (handled) return handled;
    const code = error instanceof Error ? error.message : "";
    if (code === "domain_not_allowed") return Response.json({ ok: false, error: code }, { status: 400 });
    return Response.json({ ok: false, error: "user_create_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json();
    await updateInternalUser(actor, {
      uid: String(body.uid || ""),
      role: body.role === "admin" ? "admin" : body.role === "member" ? "member" : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      permissions: Array.isArray(body.permissions) ? normalizePermissions(body.permissions) : undefined,
    });
    return Response.json({ ok: true });
  } catch (error) {
    const handled = authError(error);
    if (handled) return handled;
    const code = error instanceof Error ? error.message : "";
    if (["uid_required", "cannot_disable_self", "cannot_demote_self", "user_not_found"].includes(code)) return Response.json({ ok: false, error: code }, { status: code === "user_not_found" ? 404 : 400 });
    return Response.json({ ok: false, error: "user_update_failed" }, { status: 500 });
  }
}

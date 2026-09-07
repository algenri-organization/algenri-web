import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getInternalAccess } from "@/lib/internal/users";
import { getCompanySettings, saveCompanySettings } from "@/lib/internal/company-settings";

async function requireSettingsAccess(request: Request) {
  const user = await requireAlgenriInternalUser(request);
  const access = await getInternalAccess(user.uid, user.email);
  if (!access.active || !access.permissions.includes("settings")) throw new Error("INTERNAL_MODULE_ACCESS_DENIED");
  return { user, access };
}

export async function GET(request: Request) {
  try {
    await requireSettingsAccess(request);
    const settings = await getCompanySettings();
    return Response.json({ ok: true, settings });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "company_settings_load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, access } = await requireSettingsAccess(request);
    if (access.role !== "admin") return Response.json({ ok: false, error: "admin_required" }, { status: 403 });
    const body = await request.json();
    const settings = await saveCompanySettings(body, user.email);
    return Response.json({ ok: true, settings });
  } catch (error) {
    const handled = internalAuthResponse(error);
    if (handled) return handled;
    const code = error instanceof Error ? error.message : "";
    if (code === "brand_name_required") return Response.json({ ok: false, error: code }, { status: 400 });
    return Response.json({ ok: false, error: "company_settings_save_failed" }, { status: 500 });
  }
}

import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getNotificationPreferences, saveNotificationPreferences } from "@/lib/internal/notification-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const preferences = await getNotificationPreferences(user.uid);
    return Response.json({ ok: true, preferences });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "notification_preferences_load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const body = await request.json();
    const preferences = await saveNotificationPreferences(user.uid, body, user.email);
    return Response.json({ ok: true, preferences });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "notification_preferences_save_failed" }, { status: 500 });
  }
}

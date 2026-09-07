import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getInternalAccess } from "@/lib/internal/users";

export async function GET(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const access = await getInternalAccess(user.uid, user.email);
    return Response.json({ ok: true, ...access });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "access_load_failed" }, { status: 500 });
  }
}

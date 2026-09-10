import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getRunwayIntegrationStatus } from "@/lib/studio/runway";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, provider: "runway", ...getRunwayIntegrationStatus() });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "runway_status_failed" }, { status: 500 });
  }
}

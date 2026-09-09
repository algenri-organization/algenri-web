import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { endRecurringSeries, listRecurringSeries, setRecurringSeriesPaused } from "@/lib/finance/recurring-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, series: await listRecurringSeries() });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Recurring series list failed", error);
    return Response.json({ ok: false, error: "recurring_series_list_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const input = await request.json();
    const seriesId = typeof input.seriesId === "string" ? input.seriesId.trim() : "";
    if (!seriesId) return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });

    if (input.action === "end") {
      const reason = typeof input.reason === "string" ? input.reason.trim() : "";
      const series = await endRecurringSeries(seriesId, user.email ?? user.uid, reason);
      return Response.json({ ok: true, series });
    }

    if (typeof input.paused !== "boolean") return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
    const series = await setRecurringSeriesPaused(seriesId, input.paused, user.email ?? user.uid);
    return Response.json({ ok: true, series });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "recurring_series_update_failed";
    const status = ["series_not_found"].includes(code) ? 404 : ["no_future_occurrences", "end_reason_required"].includes(code) ? 400 : 500;
    return Response.json({ ok: false, error: code }, { status });
  }
}

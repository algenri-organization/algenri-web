import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { dryRunRunwayVideoRouter } from "@/lib/studio/runway";

const requestSchema = z.object({
  promptText: z.string().trim().min(3).max(3500),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  duration: z.number().int().min(1).max(30).default(5),
  referenceImageUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    }

    const result = await dryRunRunwayVideoRouter(parsed.data);
    return Response.json({
      ok: true,
      provider: "runway",
      dryRun: true,
      routing: result.routing ?? null,
    });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;

    if (error instanceof Error && error.message === "runway_not_configured") {
      return Response.json({ ok: false, error: "runway_not_configured" }, { status: 503 });
    }
    if (error instanceof Error && error.message === "runway_router_not_configured") {
      return Response.json({ ok: false, error: "runway_router_not_configured" }, { status: 503 });
    }

    const runwayError = error as Error & { status?: number; payload?: unknown };
    return Response.json(
      { ok: false, error: "runway_dry_run_failed", providerStatus: runwayError.status ?? null, providerPayload: runwayError.payload ?? null },
      { status: 502 },
    );
  }
}

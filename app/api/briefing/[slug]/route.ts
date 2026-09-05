import {
  completePublicBriefing,
  getAuthorizedPublicBriefing,
  savePublicBriefingAnswers,
} from "@/lib/briefing/instance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readToken(request: Request) {
  const header = request.headers.get("x-briefing-token");
  if (header) return header;
  return new URL(request.url).searchParams.get("token") ?? "";
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const token = readToken(request);
  if (!token) return Response.json({ ok: false, error: "access_token_required" }, { status: 401 });

  const authorized = await getAuthorizedPublicBriefing(slug, token);
  if (!authorized) return Response.json({ ok: false, error: "invalid_access" }, { status: 403 });

  const { instance, answers } = authorized;
  return Response.json({
    ok: true,
    briefing: {
      slug: instance.slug,
      clientName: instance.clientName,
      projectName: instance.projectName,
      status: instance.status,
      progress: instance.progress,
      startedAt: instance.startedAt,
      lastSavedAt: instance.lastSavedAt,
      completedAt: instance.completedAt,
      template: instance.templateSnapshot,
      answers,
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const token = readToken(request);
  if (!token) return Response.json({ ok: false, error: "access_token_required" }, { status: 401 });

  try {
    const body = await request.json();
    const answers = body.answers && typeof body.answers === "object" ? body.answers as Record<string, unknown> : {};
    const result = await savePublicBriefingAnswers(slug, token, answers);
    if (!result) return Response.json({ ok: false, error: "invalid_access" }, { status: 403 });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "briefing_save_failed";
    return Response.json({ ok: false, error: code }, { status: code === "briefing_locked" ? 409 : 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const token = readToken(request);
  if (!token) return Response.json({ ok: false, error: "access_token_required" }, { status: 401 });

  try {
    const result = await completePublicBriefing(slug, token);
    if (!result) return Response.json({ ok: false, error: "invalid_access" }, { status: 403 });
    return Response.json({ ok: true, status: "completed", ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "briefing_complete_failed";
    return Response.json({ ok: false, error: code }, { status: code === "required_answers_missing" ? 422 : 500 });
  }
}

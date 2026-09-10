import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getRunwayTask } from "@/lib/studio/runway";

export async function GET(request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { taskId } = await context.params;
    if (!taskId) return Response.json({ ok: false, error: "missing_task_id" }, { status: 400 });

    const task = await getRunwayTask(taskId);
    return Response.json({
      ok: true,
      provider: "runway",
      task: {
        id: task.id ?? task.taskId ?? taskId,
        status: task.status ?? null,
        output: task.output ?? [],
        failure: task.failure ?? null,
      },
    });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    const runwayError = error as Error & { status?: number; payload?: unknown };
    return Response.json(
      { ok: false, error: "runway_task_failed", providerStatus: runwayError.status ?? null, providerPayload: runwayError.payload ?? null },
      { status: 502 },
    );
  }
}

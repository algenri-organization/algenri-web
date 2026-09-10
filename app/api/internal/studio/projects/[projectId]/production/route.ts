import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getRunwayTask, generateRunwayVideoRouter, extractRunwayRoutingCost } from "@/lib/studio/runway";
import { createKieKling26TextToVideo, getKieCreditBalance, getKieTaskDetails, KIE_STUDIO_VIDEO_MODEL } from "@/lib/studio/kie";
import { getStudioProject, upsertStudioSceneGenerationJob, type StudioSceneGenerationJob } from "@/lib/studio/project-store";
import { archiveStudioOutput } from "@/lib/studio/output-storage";

const startSchema = z.object({ action: z.literal("start_scene"), sceneIndex: z.number().int().min(1), confirmSpend: z.literal(true) });
const refreshSchema = z.object({ action: z.literal("refresh_scene"), sceneIndex: z.number().int().min(1) });
const requestSchema = z.discriminatedUnion("action", [startSchema, refreshSchema]);

function normalizeRunwayStatus(value: unknown): StudioSceneGenerationJob["status"] {
  const status = String(value ?? "").toUpperCase();
  if (["SUCCEEDED", "SUCCESS", "COMPLETED", "DONE"].includes(status)) return "succeeded";
  if (["FAILED", "CANCELLED", "CANCELED"].includes(status)) return "failed";
  if (["RUNNING", "PROCESSING", "IN_PROGRESS", "INPROGRESS"].includes(status)) return "running";
  return "queued";
}

function normalizeKieStatus(value: unknown): StudioSceneGenerationJob["status"] {
  const status = String(value ?? "").toLowerCase();
  if (status === "success") return "succeeded";
  if (status === "fail") return "failed";
  if (status === "generating") return "running";
  return "queued";
}

function firstOutputUrl(output: unknown) {
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (typeof item === "string" && /^https?:\/\//.test(item)) return item;
    if (item && typeof item === "object") {
      const value = (item as any).url ?? (item as any).uri;
      if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
    }
  }
  return null;
}

function ratio(value: unknown): "16:9" | "9:16" | "1:1" {
  return value === "1:1" ? "1:1" : value === "9:16" || value === "4:5" ? "9:16" : "16:9";
}

async function archiveIfNeeded(input: { projectId: string; sceneIndex: number; job: StudioSceneGenerationJob; outputUrl: string | null; status: StudioSceneGenerationJob["status"] }) {
  if (input.status !== "succeeded" || !input.outputUrl || input.job.storagePath) return {} as Partial<StudioSceneGenerationJob>;
  try {
    const archived = await archiveStudioOutput({ projectId: input.projectId, sceneIndex: input.sceneIndex, provider: input.job.provider, taskId: input.job.taskId, outputUrl: input.outputUrl });
    return { storagePath: archived.storagePath, storageStatus: "archived" as const, storageError: null, contentType: archived.contentType, sizeBytes: archived.sizeBytes, archivedAt: archived.archivedAt };
  } catch (archiveError) {
    console.error("studio_output_archive_failed", archiveError);
    return { storageStatus: "failed" as const, storageError: archiveError instanceof Error ? archiveError.message : "studio_output_archive_failed" };
  }
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });

    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const scene = (project.storyboard ?? []).find((item: any) => item.index === parsed.data.sceneIndex);
    if (!scene) return Response.json({ ok: false, error: "scene_not_found" }, { status: 404 });
    if (scene.status !== "approved") return Response.json({ ok: false, error: "scene_not_approved" }, { status: 409 });

    const route = (project.routing?.routes ?? []).find((item: any) => item.sceneIndex === scene.index);
    if (!route) return Response.json({ ok: false, error: "scene_not_routed" }, { status: 409 });
    if (!route.executable || !["runway", "kie-ai"].includes(route.selectedProviderId)) return Response.json({ ok: false, error: "provider_not_executable" }, { status: 409 });

    const existing = (project.generation?.sceneJobs ?? []).find((item: any) => item.sceneIndex === scene.index) as StudioSceneGenerationJob | undefined;

    if (parsed.data.action === "start_scene") {
      if (existing && ["queued", "running", "succeeded"].includes(existing.status)) return Response.json({ ok: false, error: "scene_generation_already_exists", job: existing }, { status: 409 });

      if (typeof route.estimatedCredits !== "number" || !Number.isFinite(route.estimatedCredits) || route.estimatedCredits <= 0) {
        return Response.json({ ok: false, error: "cost_estimate_required_before_generation", provider: route.selectedProviderId, model: route.selectedModel ?? null }, { status: 409 });
      }

      const budgetLimit = Number(project.briefing?.budgetLimit ?? 0);
      const totalEstimated = project.routing?.totalEstimatedCredits;
      if (budgetLimit > 0 && typeof totalEstimated === "number" && totalEstimated > budgetLimit) {
        return Response.json({ ok: false, error: "budget_limit_exceeded", budgetLimit, totalEstimatedCredits: totalEstimated }, { status: 409 });
      }

      if (route.selectedProviderId === "kie-ai") {
        const balance = await getKieCreditBalance();
        if (balance === null || balance < route.estimatedCredits) return Response.json({ ok: false, error: "kie_insufficient_credits", balance, estimatedCredits: route.estimatedCredits }, { status: 409 });
        const task = await createKieKling26TextToVideo({ prompt: scene.technicalPrompt, aspectRatio: ratio(project.briefing?.aspectRatio), durationSeconds: scene.durationSeconds, sound: false });
        const job: StudioSceneGenerationJob = { sceneIndex: scene.index, provider: "kie-ai", model: KIE_STUDIO_VIDEO_MODEL, taskId: task.taskId, status: "queued", estimatedCredits: route.estimatedCredits, actualCredits: null, outputUrl: null, storagePath: null, storageStatus: null, failure: null, startedAt: new Date().toISOString(), completedAt: null };
        await upsertStudioSceneGenerationJob(projectId, job);
        return Response.json({ ok: true, job, balanceBefore: balance }, { status: 201 });
      }

      const task = await generateRunwayVideoRouter({ promptText: scene.technicalPrompt, aspectRatio: ratio(project.briefing?.aspectRatio), duration: Math.min(30, Math.max(1, scene.durationSeconds)) });
      const taskId = task.id ?? task.taskId ?? null;
      if (!taskId) return Response.json({ ok: false, error: "runway_missing_task_id", providerPayload: task }, { status: 502 });
      const routing = task.routing ?? null;
      const estimatedCredits = extractRunwayRoutingCost(routing) ?? route.estimatedCredits;
      const job: StudioSceneGenerationJob = { sceneIndex: scene.index, provider: "runway", model: routing?.model ?? routing?.selectedModel ?? routing?.modelId ?? route.selectedModel ?? null, taskId, status: "queued", estimatedCredits, actualCredits: null, outputUrl: null, storagePath: null, storageStatus: null, failure: null, startedAt: new Date().toISOString(), completedAt: null };
      await upsertStudioSceneGenerationJob(projectId, job);
      return Response.json({ ok: true, job }, { status: 201 });
    }

    if (!existing?.taskId) return Response.json({ ok: false, error: "scene_generation_not_started" }, { status: 409 });

    if (existing.provider === "kie-ai") {
      const task = await getKieTaskDetails(existing.taskId);
      const status = normalizeKieStatus(task.state);
      const outputUrl = task.resultUrls[0] ?? existing.outputUrl;
      const completed = status === "succeeded" || status === "failed";
      const storageFields = await archiveIfNeeded({ projectId, sceneIndex: scene.index, job: existing, outputUrl, status });
      const job: StudioSceneGenerationJob = { ...existing, ...storageFields, model: task.model ?? existing.model, status, outputUrl, failure: task.failMsg ?? task.failCode ?? null, actualCredits: task.creditsConsumed ?? existing.actualCredits ?? null, completedAt: completed ? (existing.completedAt ?? new Date().toISOString()) : null };
      await upsertStudioSceneGenerationJob(projectId, job);
      return Response.json({ ok: true, job, progress: task.progress });
    }

    const task = await getRunwayTask(existing.taskId);
    const status = normalizeRunwayStatus(task.status);
    const outputUrl = firstOutputUrl(task.output) ?? existing.outputUrl;
    const completed = status === "succeeded" || status === "failed";
    const actualCredits = typeof (task as any).costCredits === "number" ? (task as any).costCredits : typeof (task as any).creditsUsed === "number" ? (task as any).creditsUsed : existing.actualCredits;
    const storageFields = await archiveIfNeeded({ projectId, sceneIndex: scene.index, job: existing, outputUrl, status });
    const job: StudioSceneGenerationJob = { ...existing, ...storageFields, status, outputUrl, failure: task.failure ?? null, actualCredits: actualCredits ?? null, completedAt: completed ? (existing.completedAt ?? new Date().toISOString()) : null };
    await upsertStudioSceneGenerationJob(projectId, job);
    return Response.json({ ok: true, job });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    const providerError = error as Error & { status?: number; payload?: unknown };
    console.error("studio_scene_production_failed", error);
    return Response.json({ ok: false, error: providerError.message || "studio_scene_production_failed", providerStatus: providerError.status ?? null, providerPayload: providerError.payload ?? null }, { status: 502 });
  }
}

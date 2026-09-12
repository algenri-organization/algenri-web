import "server-only";

import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";

export async function requireStudioProjectOwner(request: Request, projectId: string) {
  const user = await requireAlgenriInternalUser(request);
  const project = await getStudioProject(projectId);
  if (!project) {
    return { ok: false as const, response: Response.json({ ok: false, error: "not_found" }, { status: 404 }) };
  }
  if (project.ownerUid && project.ownerUid !== user.uid) {
    return { ok: false as const, response: Response.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, user, project };
}

export function studioApiError(error: unknown, fallbackCode: string) {
  const auth = internalAuthResponse(error);
  if (auth) return auth;
  console.error(fallbackCode, error);
  return Response.json({ ok: false, error: fallbackCode }, { status: 500 });
}

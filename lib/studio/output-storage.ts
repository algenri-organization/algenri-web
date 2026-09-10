import "server-only";

import { getAdminStorage } from "@/lib/firebase/admin";

export type StudioArchivedOutput = {
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  archivedAt: string;
};

export async function archiveStudioOutput(input: { projectId: string; sceneIndex: number; provider: string; taskId: string; outputUrl: string }) {
  const response = await fetch(input.outputUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`studio_output_fetch_${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "video/mp4";
  const safeProvider = input.provider.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const safeTask = input.taskId.replace(/[^a-z0-9_-]/gi, "-");
  const storagePath = `studio/projects/${input.projectId}/scenes/${input.sceneIndex}/${safeProvider}-${safeTask}.mp4`;

  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "private,max-age=31536000,immutable",
      metadata: {
        studioProjectId: input.projectId,
        studioSceneIndex: String(input.sceneIndex),
        provider: input.provider,
        providerTaskId: input.taskId,
      },
    },
  });

  return {
    storagePath,
    contentType,
    sizeBytes: buffer.length,
    archivedAt: new Date().toISOString(),
  } satisfies StudioArchivedOutput;
}

export async function readStudioArchivedOutput(storagePath: string) {
  const storage = await getAdminStorage();
  const file = storage.bucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) throw new Error("studio_output_not_found");
  const [[buffer], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
  return {
    buffer,
    contentType: metadata.contentType || "video/mp4",
    sizeBytes: Number(metadata.size || buffer.length),
  };
}

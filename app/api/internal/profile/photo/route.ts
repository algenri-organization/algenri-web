import { randomUUID } from "node:crypto";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function profileObjectPath(uid: string) {
  return `internal-users/${uid}/profile/avatar`;
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const formData = await request.formData();
    const upload = formData.get("file");

    if (!(upload instanceof File)) {
      return Response.json({ ok: false, error: "photo_required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(upload.type)) {
      return Response.json({ ok: false, error: "photo_type_invalid" }, { status: 400 });
    }
    if (upload.size <= 0 || upload.size > MAX_PHOTO_SIZE) {
      return Response.json({ ok: false, error: "photo_size_invalid" }, { status: 400 });
    }

    const storage = await getAdminStorage();
    const bucket = storage.bucket();
    const objectPath = profileObjectPath(user.uid);
    const token = randomUUID();
    const target = bucket.file(objectPath);

    await target.save(Buffer.from(await upload.arrayBuffer()), {
      resumable: false,
      metadata: {
        contentType: upload.type,
        cacheControl: "public,max-age=3600",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const photoURL = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${encodeURIComponent(token)}`;
    return Response.json({ ok: true, photoURL });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Profile photo upload failed", error);
    return Response.json({ ok: false, error: "photo_upload_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const storage = await getAdminStorage();
    await storage.bucket().file(profileObjectPath(user.uid)).delete({ ignoreNotFound: true });
    return Response.json({ ok: true });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Profile photo delete failed", error);
    return Response.json({ ok: false, error: "photo_delete_failed" }, { status: 500 });
  }
}

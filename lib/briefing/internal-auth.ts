import { getAdminAuth } from "@/lib/firebase/admin";

export type InternalUser = {
  uid: string;
  email: string;
};

export async function requireAlgenriInternalUser(request: Request): Promise<InternalUser> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("INTERNAL_AUTH_REQUIRED");
  }

  const idToken = authorization.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("INTERNAL_AUTH_REQUIRED");

  const auth = await getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken, true);
  const email = decoded.email?.toLowerCase();

  if (!email || !email.endsWith("@algenri.com.br") || decoded.email_verified !== true) {
    throw new Error("INTERNAL_ACCESS_DENIED");
  }

  return { uid: decoded.uid, email };
}

export function internalAuthResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "INTERNAL_AUTH_REQUIRED") {
    return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  if (message === "INTERNAL_ACCESS_DENIED") {
    return Response.json({ ok: false, error: "access_denied" }, { status: 403 });
  }

  return null;
}

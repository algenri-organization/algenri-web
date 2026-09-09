import { getAdminAuth } from "@/lib/firebase/admin";
import { getInternalAccess, getInternalUserRecord, type InternalModule } from "@/lib/internal/users";

export type InternalUser = {
  uid: string;
  email: string;
};

function getProvisionedInternalEmails() {
  const configured = process.env.ALGENRI_INTERNAL_ALLOWED_EMAILS ?? "michel@algenri.com.br";
  return new Set(configured.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function apiModule(pathname: string): InternalModule | null {
  if (pathname === "/api/internal/settings/notifications") return null;
  if (["/api/internal/leads", "/api/internal/clients", "/api/internal/projects", "/api/internal/proposals", "/api/internal/contracts"].some((prefix) => pathname.startsWith(prefix))) return "commercial";
  if (["/api/internal/briefing", "/api/internal/dossiers"].some((prefix) => pathname.startsWith(prefix))) return "operation";
  if (pathname.startsWith("/api/internal/finance")) return "finance";
  if (["/api/internal/readiness", "/api/internal/firebase-health", "/api/internal/settings"].some((prefix) => pathname.startsWith(prefix))) return "settings";
  return null;
}

export async function requireAlgenriInternalUser(request: Request): Promise<InternalUser> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("INTERNAL_AUTH_REQUIRED");
  const idToken = authorization.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("INTERNAL_AUTH_REQUIRED");

  const auth = await getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken, true);
  const email = decoded.email?.toLowerCase();
  if (!email || !email.endsWith("@algenri.com.br")) throw new Error("INTERNAL_ACCESS_DENIED");

  const accessRecord = await getInternalUserRecord(decoded.uid);
  if (accessRecord) {
    if (!accessRecord.active) throw new Error("INTERNAL_ACCESS_DENIED");
    const module = apiModule(new URL(request.url).pathname);
    if (module) {
      const access = await getInternalAccess(decoded.uid, email);
      if (!access.permissions.includes(module)) throw new Error("INTERNAL_MODULE_ACCESS_DENIED");
    }
    return { uid: decoded.uid, email };
  }

  const provisionedEmails = getProvisionedInternalEmails();
  if (!provisionedEmails.has(email)) throw new Error("INTERNAL_ACCESS_DENIED");
  return { uid: decoded.uid, email };
}

export function internalAuthResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "INTERNAL_AUTH_REQUIRED") return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  if (message === "INTERNAL_EMAIL_VERIFICATION_REQUIRED") return Response.json({ ok: false, error: "email_verification_required" }, { status: 403 });
  if (message === "INTERNAL_MODULE_ACCESS_DENIED") return Response.json({ ok: false, error: "module_access_denied" }, { status: 403 });
  if (message === "INTERNAL_ACCESS_DENIED") return Response.json({ ok: false, error: "access_denied" }, { status: 403 });
  return null;
}

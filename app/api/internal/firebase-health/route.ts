import { getVercelOidcToken } from "@vercel/oidc";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiagnosticError = Error & {
  code?: number | string;
  details?: string;
};

function classifyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("is not configured")) return "missing_environment_variable";
  if (message.includes("oidc") || message.includes("subject token")) return "oidc_token_error";
  if (message.includes("audience") || message.includes("invalid_target")) return "oidc_audience_error";
  if (message.includes("permission_denied") || message.includes("permission denied") || message.includes("403")) {
    return "iam_permission_error";
  }
  if (message.includes("unauthenticated") || message.includes("invalid_grant") || message.includes("401")) {
    return "google_token_exchange_error";
  }
  if (message.includes("firestore") || message.includes("grpc")) return "firestore_access_error";

  return "unknown_auth_or_firestore_error";
}

function sanitizeDiagnostic(error: unknown) {
  if (!(error instanceof Error)) {
    return { errorName: "UnknownError", errorCode: null, errorMessage: "unknown" };
  }

  const diagnosticError = error as DiagnosticError;
  const rawMessage = error.message || "unknown";
  const safeMessage = rawMessage
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "[redacted-token]")
    .replace(/eyJ[A-Za-z0-9._-]{20,}/g, "[redacted-jwt]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(0, 500);

  return {
    errorName: error.name || "Error",
    errorCode: diagnosticError.code ?? null,
    errorMessage: safeMessage,
    errorDetails: typeof diagnosticError.details === "string" ? diagnosticError.details.slice(0, 300) : null,
  };
}

export async function GET() {
  const requiredEnv = [
    "GCP_PROJECT_ID",
    "GCP_PROJECT_NUMBER",
    "GCP_SERVICE_ACCOUNT_EMAIL",
    "GCP_WORKLOAD_IDENTITY_POOL_ID",
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
  ];

  const missingEnv = requiredEnv.filter((name) => !process.env[name]);

  try {
    const oidcToken = await getVercelOidcToken();

    if (!oidcToken) {
      return Response.json(
        {
          ok: false,
          stage: "vercel_oidc",
          reason: "oidc_token_missing",
          missingEnv,
        },
        { status: 500 },
      );
    }

    const db = await getAdminDb();
    const snapshot = await db.collection("_system").doc("health").get();

    return Response.json({
      ok: true,
      stage: "firestore",
      firestore: "reachable",
      healthDocumentExists: snapshot.exists,
      projectId: process.env.GCP_PROJECT_ID ?? null,
      oidcTokenPresent: true,
      missingEnv,
    });
  } catch (error) {
    console.error("Firebase health check failed", error);

    return Response.json(
      {
        ok: false,
        stage: "google_wif_or_firestore",
        reason: classifyError(error),
        oidcTokenPresent: true,
        missingEnv,
        diagnostic: sanitizeDiagnostic(error),
      },
      { status: 500 },
    );
  }
}

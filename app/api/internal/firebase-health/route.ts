import { getVercelOidcToken } from "@vercel/oidc";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const snapshot = await getAdminDb().collection("_system").doc("health").get();

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
      },
      { status: 500 },
    );
  }
}

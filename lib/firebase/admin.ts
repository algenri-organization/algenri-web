import { getVercelOidcToken } from "@vercel/oidc";
import { getApps, initializeApp, type App, type Credential, type GoogleOAuthAccessToken } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { ExternalAccountClient } from "google-auth-library";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function createWorkloadIdentityCredential(): Credential {
  const projectNumber = requiredEnv("GCP_PROJECT_NUMBER");
  const serviceAccountEmail = requiredEnv("GCP_SERVICE_ACCOUNT_EMAIL");
  const poolId = requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");

  return {
    async getAccessToken(): Promise<GoogleOAuthAccessToken> {
      const authClient = ExternalAccountClient.fromJSON({
        type: "external_account",
        audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
        token_url: "https://sts.googleapis.com/v1/token",
        service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
        subject_token_supplier: {
          getSubjectToken: getVercelOidcToken,
        },
      });

      if (!authClient) {
        throw new Error("Unable to initialize Google external account client.");
      }

      const token = await authClient.getAccessToken();
      if (!token.token) {
        throw new Error("Google Workload Identity Federation did not return an access token.");
      }

      return {
        access_token: token.token,
        expires_in: 3300,
      };
    },
  };
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = requiredEnv("GCP_PROJECT_ID");

  return initializeApp({
    credential: createWorkloadIdentityCredential(),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

import { getVercelOidcToken } from "@vercel/oidc";
import { getApps, initializeApp, type Credential, type GoogleOAuthAccessToken } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { ExternalAccountClient } from "google-auth-library";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

const projectId = requiredEnv("GCP_PROJECT_ID");
const projectNumber = requiredEnv("GCP_PROJECT_NUMBER");
const serviceAccountEmail = requiredEnv("GCP_SERVICE_ACCOUNT_EMAIL");
const poolId = requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_ID");
const providerId = requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");

const workloadIdentityCredential: Credential = {
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

const app =
  getApps()[0] ??
  initializeApp({
    credential: workloadIdentityCredential,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);

import { writeFile } from "node:fs/promises";
import { getVercelOidcToken } from "@vercel/oidc";
import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const ADC_PATH = "/tmp/algenri-google-wif.json";
const OIDC_TOKEN_PATH = "/tmp/algenri-vercel-oidc-token";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function prepareWorkloadIdentityAdc() {
  const projectNumber = requiredEnv("GCP_PROJECT_NUMBER");
  const serviceAccountEmail = requiredEnv("GCP_SERVICE_ACCOUNT_EMAIL");
  const poolId = requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = requiredEnv("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const oidcToken = await getVercelOidcToken();

  if (!oidcToken) {
    throw new Error("Vercel OIDC token is not available.");
  }

  const externalAccountConfig = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    credential_source: {
      file: OIDC_TOKEN_PATH,
    },
  };

  await Promise.all([
    writeFile(OIDC_TOKEN_PATH, oidcToken, { encoding: "utf8", mode: 0o600 }),
    writeFile(ADC_PATH, JSON.stringify(externalAccountConfig), { encoding: "utf8", mode: 0o600 }),
  ]);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = ADC_PATH;
}

async function getAdminApp(): Promise<App> {
  // Refresh the short-lived subject token on every server request. The Google
  // auth client may cache access tokens, but when it needs a new one it reads
  // the current Vercel OIDC token from OIDC_TOKEN_PATH.
  await prepareWorkloadIdentityAdc();

  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = requiredEnv("GCP_PROJECT_ID");

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export async function getAdminAuth() {
  return getAuth(await getAdminApp());
}

export async function getAdminDb() {
  return getFirestore(await getAdminApp());
}

export async function getAdminStorage() {
  return getStorage(await getAdminApp());
}

import "server-only";

export const HIGGSFIELD_API_BASE = "https://cloud.higgsfield.ai";

export function getHiggsfieldIntegrationStatus() {
  const keyIdConfigured = Boolean(process.env.HIGGSFIELD_API_KEY_ID?.trim());
  const keySecretConfigured = Boolean(process.env.HIGGSFIELD_API_KEY_SECRET?.trim());
  return {
    configured: keyIdConfigured && keySecretConfigured,
    keyIdConfigured,
    keySecretConfigured,
    keyIdEnvironmentVariable: "HIGGSFIELD_API_KEY_ID",
    keySecretEnvironmentVariable: "HIGGSFIELD_API_KEY_SECRET",
    apiBase: HIGGSFIELD_API_BASE,
    authMode: "api-key-id+secret",
    alternativeAuth: "OAuth/MCP",
    intendedCapabilities: ["video", "image", "cinematic", "character-consistency"],
  } as const;
}

export function getHiggsfieldCredentials() {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID?.trim();
  const keySecret = process.env.HIGGSFIELD_API_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("higgsfield_not_configured");
  return { keyId, keySecret };
}

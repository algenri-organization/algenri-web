import "server-only";

export const HIGGSFIELD_API_BASE = "https://cloud.higgsfield.ai";

export function getHiggsfieldIntegrationStatus() {
  const configured = Boolean(process.env.HIGGSFIELD_API_KEY?.trim());
  return {
    configured,
    environmentVariable: "HIGGSFIELD_API_KEY",
    apiBase: HIGGSFIELD_API_BASE,
    authMode: "developer-api-key",
    alternativeAuth: "OAuth/MCP",
    intendedCapabilities: ["video", "image", "cinematic", "character-consistency"],
  } as const;
}

export function getHiggsfieldApiKey() {
  const apiKey = process.env.HIGGSFIELD_API_KEY?.trim();
  if (!apiKey) throw new Error("higgsfield_not_configured");
  return apiKey;
}

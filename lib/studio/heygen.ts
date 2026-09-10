import "server-only";

export const HEYGEN_API_BASE = "https://api.heygen.com";

export function getHeyGenIntegrationStatus() {
  const configured = Boolean(process.env.HEYGEN_API_KEY?.trim());
  return {
    configured,
    environmentVariable: "HEYGEN_API_KEY",
    apiBase: HEYGEN_API_BASE,
    authMode: "X-Api-Key",
    intendedCapabilities: ["avatar", "voice", "lip-sync", "video"],
  } as const;
}

export function getHeyGenHeaders() {
  const apiKey = process.env.HEYGEN_API_KEY?.trim();
  if (!apiKey) throw new Error("heygen_not_configured");
  return {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
  };
}

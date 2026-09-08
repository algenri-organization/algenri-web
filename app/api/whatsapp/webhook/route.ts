import crypto from "node:crypto";
import { updateLeadDeliveryByMessageId, type WhatsAppDeliveryStatus } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unixToIso(value: unknown) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function safeEqualHex(left: string, right: string) {
  try {
    const a = Buffer.from(left, "hex");
    const b = Buffer.from(right, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function verifySignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;
  if (!appSecret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature.slice(7));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (url.searchParams.get("diagnostic") === "1") {
    return Response.json({
      endpoint: "whatsapp-webhook",
      verifyTokenConfigured: Boolean(expected),
      verifyTokenLength: expected?.length ?? 0,
      receivedTokenLength: token?.length ?? 0,
      tokenMatches: Boolean(expected && token && token === expected),
      mode,
      challengePresent: Boolean(challenge),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
  }
  return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const statuses = Array.isArray(payload?.entry)
    ? payload.entry.flatMap((entry: any) => Array.isArray(entry?.changes)
      ? entry.changes.flatMap((change: any) => Array.isArray(change?.value?.statuses) ? change.value.statuses : [])
      : [])
    : [];

  for (const status of statuses) {
    const messageId = typeof status?.id === "string" ? status.id : "";
    const rawStatus = typeof status?.status === "string" ? status.status : "";
    if (!messageId || !["sent", "delivered", "read", "failed"].includes(rawStatus)) continue;

    const errorText = Array.isArray(status?.errors) && status.errors.length
      ? status.errors.map((error: any) => [error?.code, error?.title, error?.message, error?.error_data?.details].filter(Boolean).join(":" )).join(" | ").slice(0, 1000)
      : null;

    await updateLeadDeliveryByMessageId({
      messageId,
      status: rawStatus as WhatsAppDeliveryStatus,
      timestamp: unixToIso(status?.timestamp),
      error: errorText,
    });
  }

  return Response.json({ ok: true });
}

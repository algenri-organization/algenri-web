import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function pepper() {
  const value = process.env.BRIEFING_TOKEN_PEPPER;
  if (!value) throw new Error("BRIEFING_TOKEN_PEPPER is not configured.");
  return value;
}

export function createBriefingToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashBriefingToken(token) };
}

export function hashBriefingToken(token: string) {
  return createHash("sha256").update(`${pepper()}:${token}`).digest("hex");
}

export function verifyBriefingToken(token: string, expectedHash: string) {
  const actual = Buffer.from(hashBriefingToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

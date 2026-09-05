import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createBriefingToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashBriefingToken(token) };
}

export function hashBriefingToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyBriefingToken(token: string, expectedHash: string) {
  const actual = Buffer.from(hashBriefingToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

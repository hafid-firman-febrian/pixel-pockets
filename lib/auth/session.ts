import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE_NAME = "pp_session";

interface SessionPayload {
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 32 characters.",
    );
  }
  return secret;
}

function base64url(data: Buffer | string): string {
  const buffer = typeof data === "string" ? Buffer.from(data) : data;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(payload: string, secret: string): string {
  return base64url(createHmac("sha256", secret).update(payload).digest());
}

export function createSessionToken(): {
  token: string;
  expiresAt: Date;
} {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload, getSecret());

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return false;

  let expectedSignature: string;
  try {
    expectedSignature = sign(encodedPayload, getSecret());
  } catch {
    return false;
  }

  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length) return false;
  if (!timingSafeEqual(expected, provided)) return false;

  try {
    const payload = JSON.parse(
      base64urlDecode(encodedPayload).toString("utf8"),
    ) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

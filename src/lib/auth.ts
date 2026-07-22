import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const SESSION_COOKIE = "cozy_planner_session";

export interface SessionPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// A dummy hash computed once on first use, so a login attempt for a
// non-existent user still performs an equivalent scrypt comparison. This keeps
// response timing similar whether or not the username exists, defeating
// username enumeration via timing. Always resolves false.
let dummyHashPromise: Promise<string> | null = null;
export async function dummyVerify(password: string): Promise<false> {
  if (!dummyHashPromise) dummyHashPromise = hashPassword("cozy-planner::timing-safe::dummy");
  await verifyPassword(password, await dummyHashPromise);
  return false;
}

export function isAcceptablePassword(password: string): boolean {
  const trimmed = password.trim();
  if (trimmed.length < 8) return false;
  return /[A-Za-zก-๙]/.test(trimmed) && /\d|[^A-Za-zก-๙\s]/.test(trimmed);
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function signSession(payload: SessionPayload, secret: string): string {
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifySession(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (
      typeof parsed.userId !== "number" ||
      typeof parsed.username !== "string" ||
      typeof parsed.isAdmin !== "boolean"
    ) {
      return null;
    }
    return { userId: parsed.userId, username: parsed.username, isAdmin: parsed.isAdmin };
  } catch {
    return null;
  }
}

export function sessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }

  return "cozy-planner-local-dev-secret-change-me";
}

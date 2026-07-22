import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

/** Failed attempts allowed before a username is temporarily locked. */
export const MAX_FAILED_ATTEMPTS = 5;
/** How long a lock lasts once triggered. */
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface GateRecord {
  failedCount: number;
  lockedUntilMs: number | null;
}

export interface GateState {
  locked: boolean;
  retryAfterMs: number;
}

/** Pure: is login currently blocked for this record? */
export function evaluateGate(record: GateRecord | undefined, now: number): GateState {
  if (record?.lockedUntilMs && now < record.lockedUntilMs) {
    return { locked: true, retryAfterMs: record.lockedUntilMs - now };
  }
  return { locked: false, retryAfterMs: 0 };
}

export interface FailureResult {
  failedCount: number;
  lockedUntilMs: number | null;
  justLocked: boolean;
  remaining: number;
}

/**
 * Pure: next state after one more failed attempt. On reaching the limit the
 * counter resets and a lock window opens, so a fresh set of attempts is granted
 * once the lock expires. Callers gate on {@link evaluateGate} first, so this is
 * only invoked while not actively locked.
 */
export function applyFailure(record: GateRecord | undefined, now: number): FailureResult {
  const newCount = (record?.failedCount ?? 0) + 1;
  if (newCount >= MAX_FAILED_ATTEMPTS) {
    return {
      failedCount: 0,
      lockedUntilMs: now + LOCK_DURATION_MS,
      justLocked: true,
      remaining: 0,
    };
  }
  return {
    failedCount: newCount,
    lockedUntilMs: null,
    justLocked: false,
    remaining: MAX_FAILED_ATTEMPTS - newCount,
  };
}

function toRecord(
  row: typeof schema.loginAttempts.$inferSelect | undefined
): GateRecord | undefined {
  if (!row) return undefined;
  return {
    failedCount: row.failedCount,
    lockedUntilMs: row.lockedUntil ? row.lockedUntil.getTime() : null,
  };
}

async function readRow(username: string) {
  const [row] = await db
    .select()
    .from(schema.loginAttempts)
    .where(eq(schema.loginAttempts.username, username))
    .limit(1);
  return row;
}

/** Is this username currently locked out? */
export async function checkLoginGate(username: string, now = Date.now()): Promise<GateState> {
  return evaluateGate(toRecord(await readRow(username)), now);
}

/** Record a failed attempt and return the resulting throttle state. */
export async function registerFailedLogin(
  username: string,
  now = Date.now()
): Promise<FailureResult> {
  const result = applyFailure(toRecord(await readRow(username)), now);
  const values = {
    failedCount: result.failedCount,
    lockedUntil: result.lockedUntilMs != null ? new Date(result.lockedUntilMs) : null,
    updatedAt: new Date(now),
  };
  await db
    .insert(schema.loginAttempts)
    .values({ username, ...values })
    .onConflictDoUpdate({ target: schema.loginAttempts.username, set: values });
  return result;
}

/** Clear the throttle for a username (call on successful login). */
export async function clearLoginGate(username: string): Promise<void> {
  await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.username, username));
}

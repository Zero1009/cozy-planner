import webpush, { WebPushError } from "web-push";
import { buildPushPayload, type PushPayloadInput } from "./push";

export interface SendableSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushSendResult {
  ok: boolean;
  gone: boolean;
  error?: string;
}

let configured = false;

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}

export function hasVapidConfig(): boolean {
  return Boolean(getVapidPublicKey() && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  if (configured) return;
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required for push notifications");
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@cozy-planner.local", publicKey, privateKey);
  configured = true;
}

export async function sendPushNotification(
  subscription: SendableSubscription,
  payloadInput: PushPayloadInput
): Promise<PushSendResult> {
  configureWebPush();
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(buildPushPayload(payloadInput)),
      { TTL: 60 * 60 }
    );
    return { ok: true, gone: false };
  } catch (error) {
    const statusCode = error instanceof WebPushError ? error.statusCode : undefined;
    return {
      ok: false,
      gone: statusCode === 404 || statusCode === 410,
      error: statusCode ? `push-service-${statusCode}` : "push-send-failed",
    };
  }
}

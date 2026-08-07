import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getJSON } from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(response: Response) {
  globalThis.fetch = (async () => response) as typeof fetch;
}

async function rejectionMessage(promise: Promise<unknown>) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof Error);
    return true;
  });

  try {
    await promise;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }

  throw new Error("Expected promise to reject");
}

describe("api error mapping", () => {
  it("replaces generic bad-request API errors with friendly guidance", async () => {
    mockFetch(
      new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const message = await rejectionMessage(getJSON("/api/todos"));

    assert.equal(message, "ข้อมูลไม่ถูกต้อง กรุณาตรวจข้อมูลที่กรอกแล้วลองใหม่อีกครั้ง");
    assert.doesNotMatch(message, /Invalid request|400|Bad Request/i);
  });

  it("keeps intentional Thai server messages for auth and validation", async () => {
    mockFetch(
      new Response(JSON.stringify({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    assert.equal(await rejectionMessage(getJSON("/api/auth/login")), "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  it("maps unavailable server responses without exposing status text", async () => {
    mockFetch(new Response("Internal Server Error", { status: 500, statusText: "Internal Server Error" }));

    const message = await rejectionMessage(getJSON("/api/events"));

    assert.equal(
      message,
      "ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง หากยังไม่หายให้แจ้ง TRK ตรวจสอบเซิร์ฟเวอร์",
    );
    assert.doesNotMatch(message, /Internal Server Error|500/i);
  });

  it("turns network failures into an actionable connection message", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;

    const message = await rejectionMessage(getJSON("/api/events"));

    assert.equal(message, "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
    assert.doesNotMatch(message, /Failed to fetch/i);
  });
});

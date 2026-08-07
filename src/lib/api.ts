/**
 * Small typed fetch helpers used by the TanStack Query hooks. All throw on a
 * non-2xx response with polished, actionable messages suitable for direct UI display.
 */
const NETWORK_ERROR_MESSAGE = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";

const STATUS_MESSAGES: Record<number, string> = {
  400: "ข้อมูลไม่ถูกต้อง กรุณาตรวจข้อมูลที่กรอกแล้วลองใหม่อีกครั้ง",
  401: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
  403: "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้",
  404: "ไม่พบข้อมูลที่ต้องการ อาจถูกลบหรือย้ายไปแล้ว",
  409: "ข้อมูลมีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่อีกครั้ง",
  422: "ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง กรุณาตรวจแล้วลองใหม่อีกครั้ง",
  429: "มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
};

const FALLBACK_ERROR_MESSAGE = "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
const SERVER_ERROR_MESSAGE =
  "ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง หากยังไม่หายให้แจ้ง TRK ตรวจสอบเซิร์ฟเวอร์";

function isIntentionalThaiMessage(message: string): boolean {
  return /[\u0E00-\u0E7F]/.test(message);
}

function isGenericServerMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    !normalized ||
    normalized === "invalid request" ||
    normalized === "bad request" ||
    normalized === "unauthorized" ||
    normalized === "forbidden" ||
    normalized === "not found" ||
    normalized === "internal server error" ||
    normalized === "network error" ||
    /^https?\s+\d{3}/i.test(message) ||
    /^\d{3}\b/.test(normalized)
  );
}

function mapStatusToMessage(status: number): string {
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  return STATUS_MESSAGES[status] ?? FALLBACK_ERROR_MESSAGE;
}

async function parseServerError(res: Response): Promise<string | null> {
  try {
    const data = (await res.clone().json()) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
    ) {
      const message = (data as { error: string }).error.trim();
      if (message && isIntentionalThaiMessage(message) && !isGenericServerMessage(message)) {
        return message;
      }
    }
  } catch {
    /* body wasn't JSON */
  }

  return null;
}

async function parseErrorMessage(res: Response): Promise<string> {
  return (await parseServerError(res)) ?? mapStatusToMessage(res.status);
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  return handle<T>(res);
}

export async function getJSON<T>(url: string): Promise<T> {
  return request<T>(url);
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function del<T>(url: string): Promise<T> {
  return request<T>(url, { method: "DELETE" });
}

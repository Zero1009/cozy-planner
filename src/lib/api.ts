/**
 * Small typed fetch helpers used by the TanStack Query hooks. All throw on a
 * non-2xx response, preferring the server's `{ error }` message when present.
 */

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.clone().json()) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
  } catch {
    /* body wasn't JSON */
  }
  return `Request failed with status ${res.status}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return handle<T>(res);
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  return handle<T>(res);
}

import type { ApiResult } from "@/types";

/** Client-side JSON fetch helpers with the standard API envelope. */

async function request<T>(
  url: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (body && typeof body === "object" && "ok" in body) return body;
    return { ok: false, error: `Request failed (${res.status}).` };
  } catch {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

export function getJson<T>(url: string): Promise<ApiResult<T>> {
  return request<T>(url);
}

export function postJson<T>(url: string, data?: unknown): Promise<ApiResult<T>> {
  return request<T>(url, { method: "POST", body: JSON.stringify(data ?? {}) });
}

export function putJson<T>(url: string, data?: unknown): Promise<ApiResult<T>> {
  return request<T>(url, { method: "PUT", body: JSON.stringify(data ?? {}) });
}

export function deleteJson<T>(url: string, data?: unknown): Promise<ApiResult<T>> {
  return request<T>(url, { method: "DELETE", body: JSON.stringify(data ?? {}) });
}

/** Unwrap an ApiResult, throwing the server's message on failure. */
export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

const API_PREFIX = "/api";

export type ApiErrorBody = { detail?: string | unknown };

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("km_access_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("km_access_token", token);
  else localStorage.removeItem("km_access_token");
}

export function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("km_workspace_id");
}

export function setStoredWorkspaceId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem("km_workspace_id", id);
  else localStorage.removeItem("km_workspace_id");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_PREFIX}/${path.replace(/^\//, "")}`;
  const headers = new Headers(init.headers);
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    ...init,
    headers,
    body:
      init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as ApiErrorBody).detail === "string"
        ? ((data as ApiErrorBody).detail as string)
        : res.statusText;
    throw new ApiError(res.ok ? 0 : res.status, msg || "Request failed", data);
  }
  return data as T;
}

export const API_BASE = import.meta.env["VITE_API_URL"] ?? "";

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const baseHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const extraHeaders = opts?.headers;
  const mergedHeaders: HeadersInit = extraHeaders
    ? new Headers({ ...baseHeaders, ...Object.fromEntries(new Headers(extraHeaders)) })
    : baseHeaders;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as Record<string, string>).error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

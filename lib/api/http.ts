// Credentialed fetch to the FastAPI backend. Every call sends the HttpOnly
// `ja_session` cookie (credentials: "include"), so the SPA never touches the JWT.
// The base URL comes from NEXT_PUBLIC_API_URL and falls back to the local dev
// server, so the app runs with zero config against a locally-running backend.
//
// localhost:3000 → localhost:8000 is cross-origin but SAME-SITE (registrable
// domain "localhost"), so the SameSite=lax cookie is sent and CORS
// (allow_credentials + explicit origins) lets the browser store/replay it.

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

/** A non-2xx response. `status` lets callers special-case 401/403/404. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Options {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

export async function apiFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const hasBody = opts.body !== undefined;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      // non-JSON error body — keep the status text
    }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content (e.g. logout) has no body to parse.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Browser-side client for the /api/admin CMS routes. Every call is
 * same-origin and carries the session cookie; the routes re-check it.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public errors: Record<string, string> = {},
    public extra: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      cache: "no-store",
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const { error, errors, ...extra } = body;
    throw new ApiError(res.status, String(error ?? "error"), (errors as Record<string, string>) ?? {}, extra);
  }
  return body as T;
}

/** A sentence an editor can act on, for any failure. */
export function explain(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Try again.";
  switch (error.code) {
    case "network":
      return "Could not reach the server. Check your connection and try again.";
    case "unauthorised":
      return "Your session has ended. Sign in again.";
    case "storage_not_configured":
      return "Supabase is not connected to this deployment.";
    case "tables_missing":
      return "The CMS tables do not exist yet. Run supabase/cms.sql in Supabase first.";
    case "not_initialised":
      return "Load the current website content from the Dashboard first.";
    case "invalid":
      return "Some fields need attention.";
    case "conflict":
      return Object.values(error.errors)[0] ?? "That clashes with an existing item.";
    case "stale":
      return "Someone else changed this after you opened it. Nothing was overwritten.";
    case "content_not_loaded":
      return "Load the remaining content from the Dashboard first.";
    case "forbidden":
      return "Your account is not allowed to do that.";
    case "cross_site_request":
      return "The request was blocked because it did not come from this site. Reload the page.";
    case "v3_missing":
      return "Run supabase/v3.sql in Supabase first.";
    case "not_found":
      return "That item no longer exists. It may have been deleted in another tab.";
    default:
      return "The save did not go through. Try again in a moment.";
  }
}

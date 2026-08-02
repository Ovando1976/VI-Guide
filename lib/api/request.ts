export type JsonBodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "invalid-content-type" | "invalid-json" };

/** Parse an API request body without leaking SyntaxError exceptions into routes. */
export async function parseJsonBody<T>(request: Request): Promise<JsonBodyResult<T>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType && !contentType.includes("application/json")) {
    return { ok: false, reason: "invalid-content-type" };
  }

  try {
    return { ok: true, value: (await request.json()) as T };
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
}

export function jsonBodyErrorMessage(result: Extract<JsonBodyResult<never>, { ok: false }>) {
  return result.reason === "invalid-content-type"
    ? "Content-Type must be application/json."
    : "Request body must contain valid JSON.";
}

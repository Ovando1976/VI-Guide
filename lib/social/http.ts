import { NextResponse } from "next/server";

import { SocialAuthenticationError } from "@/lib/social/server-auth";

export function socialJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });
}

export function socialErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Social request failed.";
  if (error instanceof SocialAuthenticationError) {
    return socialJson({ error: message }, { status: 401 });
  }
  if (/not found|unavailable/i.test(message)) return socialJson({ error: message }, { status: 404 });
  if (/required|invalid|cannot|must|unsupported|already|choose|join|empty|unavailable|blocked|authorization|administration/i.test(message)) {
    return socialJson({ error: message }, { status: 400 });
  }
  if (/too many requests/i.test(message)) return socialJson({ error: message }, { status: 429 });
  console.error("Social API error", error);
  return socialJson({ error: "Social request failed." }, { status: 500 });
}

export async function readJsonObject(request: Request) {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A JSON object is required.");
  return value as Record<string, unknown>;
}

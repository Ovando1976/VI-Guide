import { NextResponse } from "next/server";

const CATALOG_CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

/** Build a consistent, cacheable response when an optional live provider is unavailable. */
export function catalogFallbackResponse<T extends Record<string, unknown>>(
  payload: T,
  fallbackReason: string,
  generatedAt = new Date().toISOString(),
) {
  return NextResponse.json(
    { ...payload, partial: false, liveData: false, fallbackReason, generatedAt },
    { headers: { "Cache-Control": CATALOG_CACHE_CONTROL } },
  );
}

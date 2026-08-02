import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });

  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || !name.startsWith("places/") || !name.includes("/photos/")) {
    return NextResponse.json({ error: "A valid Google Places photo name is required." }, { status: 400 });
  }

  const maxWidth = clampDimension(request.nextUrl.searchParams.get("maxWidth"), 1200);
  const maxHeight = clampDimension(request.nextUrl.searchParams.get("maxHeight"), 900);
  const url = new URL(`https://places.googleapis.com/v1/${name}/media`);
  url.searchParams.set("maxWidthPx", String(maxWidth));
  url.searchParams.set("maxHeightPx", String(maxHeight));
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) {
    return NextResponse.json({ error: `Google photo request failed (${response.status}).` }, { status: response.status });
  }

  const payload = (await response.json()) as { photoUri?: string };
  if (!payload.photoUri) {
    return NextResponse.json({ error: "Google did not return a photo URL." }, { status: 404 });
  }

  const image = await fetch(payload.photoUri, { next: { revalidate: 86400 } });
  if (!image.ok || !image.body) {
    return NextResponse.json({ error: "The source photo could not be loaded." }, { status: image.status || 502 });
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

function clampDimension(raw: string | null, fallback: number) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1600, Math.max(200, Math.round(value)));
}

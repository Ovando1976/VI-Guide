import { NextRequest, NextResponse } from "next/server";

type RouteRequestBody = {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as RouteRequestBody | null;

    if (
      !body?.from ||
      !body?.to ||
      typeof body.from.lat !== "number" ||
      typeof body.from.lng !== "number" ||
      typeof body.to.lat !== "number" ||
      typeof body.to.lng !== "number"
    ) {
      return NextResponse.json(
        { error: "Valid from/to coordinates are required." },
        { status: 400 }
      );
    }

    const coordinates = `${body.from.lng},${body.from.lat};${body.to.lng},${body.to.lat}`;

    const url =
      `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
      `?overview=full&geometries=geojson&steps=false`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Routing provider failed." },
        { status: 502 }
      );
    }

    const json = await response.json();

    const route = json?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      return NextResponse.json(
        { error: "No drivable route found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      distanceMeters: route.distance ?? 0,
      durationSeconds: route.duration ?? 0,
      geometry: route.geometry, // GeoJSON LineString
    });
  } catch (error) {
    console.error("route api error", error);
    return NextResponse.json(
      { error: "Failed to build route." },
      { status: 500 }
    );
  }
}

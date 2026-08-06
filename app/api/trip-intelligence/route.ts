import { NextRequest, NextResponse } from "next/server";

import type { TripWeatherAlert } from "@/lib/intelligence/trip-risk";
import type { IntelligenceIsland } from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NWS_ALERTS_URL = "https://api.weather.gov/alerts/active?area=VI&status=actual";
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
};

type NwsFeature = {
  id?: unknown;
  properties?: Record<string, unknown>;
};

type NwsPayload = {
  features?: unknown;
};

export async function GET(request: NextRequest) {
  const island = normalizeIsland(request.nextUrl.searchParams.get("island"));
  if (!island) {
    return NextResponse.json(
      { error: "A valid island is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(NWS_ALERTS_URL, {
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "VI-Guide/1.0 (https://vi-guide.vercel.app)",
      },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`NWS returned ${response.status}`);

    const payload = (await response.json()) as NwsPayload;
    const features = Array.isArray(payload.features)
      ? (payload.features as NwsFeature[])
      : [];
    const alerts = features
      .map(normalizeAlert)
      .filter((alert): alert is TripWeatherAlert => Boolean(alert))
      .slice(0, 8);

    return NextResponse.json(
      {
        status: "available",
        island,
        checkedAt: new Date().toISOString(),
        source: "National Weather Service",
        alerts,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.warn("VI Guide official weather alert signal is unavailable.", error);
    return NextResponse.json(
      {
        status: "unavailable",
        island,
        checkedAt: new Date().toISOString(),
        source: "National Weather Service",
        alerts: [],
      },
      { headers: CACHE_HEADERS },
    );
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAlert(feature: NwsFeature): TripWeatherAlert | null {
  const properties = feature.properties;
  if (!properties) return null;
  const event = text(properties.event, 160);
  const headline = text(properties.headline, 500);
  if (!event && !headline) return null;

  const id =
    text(feature.id, 500) ||
    text(properties.id, 500) ||
    `${event || "alert"}_${text(properties.sent, 80)}`;
  return {
    id,
    event: event || "Official weather alert",
    headline: headline || event,
    severity: normalizeSeverity(properties.severity),
    ...(text(properties.onset, 80) ? { onset: text(properties.onset, 80) } : {}),
    ...(text(properties.expires, 80)
      ? { expires: text(properties.expires, 80) }
      : {}),
    ...(text(properties.areaDesc, 500)
      ? { areaDesc: text(properties.areaDesc, 500) }
      : {}),
    ...(text(properties.instruction, 1_200)
      ? { instruction: text(properties.instruction, 1_200) }
      : {}),
    ...(id.startsWith("https://") ? { sourceUrl: id } : {}),
  };
}

function normalizeSeverity(value: unknown): TripWeatherAlert["severity"] {
  const severity = typeof value === "string" ? value.toLowerCase() : "";
  if (severity === "extreme") return "extreme";
  if (severity === "severe") return "severe";
  if (severity === "moderate") return "moderate";
  if (severity === "minor") return "minor";
  return "unknown";
}

function normalizeIsland(value: unknown): IntelligenceIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

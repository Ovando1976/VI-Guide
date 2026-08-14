import type { TripWeatherAlert } from "@/lib/intelligence/trip-risk";

const NWS_ALERTS_URL =
  "https://api.weather.gov/alerts/active?area=VI&status=actual";

export type OfficialWeatherAlertResult = {
  status: "available" | "unavailable";
  checkedAt: string;
  source: "National Weather Service";
  alerts: TripWeatherAlert[];
};

type NwsFeature = {
  id?: unknown;
  properties?: Record<string, unknown>;
};

type NwsPayload = {
  features?: unknown;
};

export async function fetchOfficialViWeatherAlerts(
  options: { timeoutMs?: number; limit?: number } = {},
): Promise<OfficialWeatherAlertResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(1_000, Math.min(10_000, options.timeoutMs ?? 5_000)),
  );

  try {
    const response = await fetch(NWS_ALERTS_URL, {
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "USVI-Explorer/1.0 (https://usvi-explorer.com)",
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
      .slice(0, Math.max(1, Math.min(20, options.limit ?? 8)));

    return {
      status: "available",
      checkedAt: new Date().toISOString(),
      source: "National Weather Service",
      alerts,
    };
  } catch (error) {
    console.warn("USVI Explorer official weather alert signal is unavailable.", error);
    return {
      status: "unavailable",
      checkedAt: new Date().toISOString(),
      source: "National Weather Service",
      alerts: [],
    };
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
    ...(text(properties.onset, 80)
      ? { onset: text(properties.onset, 80) }
      : {}),
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

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

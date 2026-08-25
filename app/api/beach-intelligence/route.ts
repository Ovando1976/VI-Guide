import { NextRequest, NextResponse } from "next/server";

import {
  ISLAND_CONDITION_POINTS,
  NDBC_STATIONS,
  maxWindMph,
  normalizeIslandConditionCode,
  observationFreshnessMinutes,
  parseNdbcRealtime,
  unavailableNdbcObservation,
  type IslandConditionCode,
} from "@/lib/island-conditions";

type JsonRecord = Record<string, unknown>;
type NwsPeriod = {
  startTime?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
  detailedForecast?: string;
  probabilityOfPrecipitation?: { value?: number | null };
};

const NWS_HEADERS = {
  Accept: "application/geo+json",
  "User-Agent": "USVI Explorer island intelligence (https://www.usvi-explorer.com)",
};

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: NWS_HEADERS,
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`${url} failed with ${response.status}.`);
  return (await response.json()) as JsonRecord;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": NWS_HEADERS["User-Agent"] },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`${url} failed with ${response.status}.`);
  return response.text();
}

async function buildNwsWeather(island: IslandConditionCode) {
  const point = ISLAND_CONDITION_POINTS[island];
  const pointUrl = `https://api.weather.gov/points/${point.latitude},${point.longitude}`;
  const pointJson = await fetchJson(pointUrl);
  const pointProperties = asRecord(pointJson.properties);
  const forecastUrl = String(pointProperties?.forecastHourly ?? "");
  if (!forecastUrl) throw new Error("NWS hourly forecast URL is unavailable.");

  const forecastJson = await fetchJson(forecastUrl);
  const forecastProperties = asRecord(forecastJson.properties);
  const periods =
    forecastProperties && Array.isArray(forecastProperties.periods)
      ? forecastProperties.periods
      : [];
  const period = periods[0] as NwsPeriod | undefined;
  if (!period) throw new Error("NWS did not return a current forecast period.");

  return {
    temperatureF:
      typeof period.temperature === "number" ? period.temperature : null,
    temperatureUnit: period.temperatureUnit ?? "F",
    windMph: maxWindMph(period.windSpeed),
    windSpeed: period.windSpeed ?? null,
    windDirection: period.windDirection ?? null,
    precipitationChance:
      typeof period.probabilityOfPrecipitation?.value === "number"
        ? period.probabilityOfPrecipitation.value
        : null,
    shortForecast: period.shortForecast ?? null,
    detailedForecast: period.detailedForecast ?? null,
    periodStartTime: period.startTime ?? null,
    updatedAt:
      typeof forecastProperties?.updateTime === "string"
        ? forecastProperties.updateTime
        : period.startTime ?? null,
    sourceAuthority: "National Weather Service",
    sourceUrl: forecastUrl,
    forecastZoneUrl:
      typeof pointProperties?.forecastZone === "string"
        ? pointProperties.forecastZone
        : null,
  };
}

async function buildNwsAlerts(island: IslandConditionCode) {
  const point = ISLAND_CONDITION_POINTS[island];
  const sourceUrl = `https://api.weather.gov/alerts/active?point=${point.latitude},${point.longitude}`;
  try {
    const payload = await fetchJson(sourceUrl);
    const features = Array.isArray(payload.features) ? payload.features : [];
    const alerts = features.slice(0, 8).flatMap((feature) => {
      const record = asRecord(feature);
      const properties = asRecord(record?.properties);
      if (!properties) return [];
      return [
        {
          id: String(record?.id ?? properties.id ?? ""),
          event: String(properties.event ?? "Weather alert"),
          severity: String(properties.severity ?? "Unknown"),
          urgency: String(properties.urgency ?? "Unknown"),
          certainty: String(properties.certainty ?? "Unknown"),
          headline: String(properties.headline ?? ""),
          effective: stringOrNull(properties.effective),
          expires: stringOrNull(properties.expires),
          sourceUrl: String(record?.id ?? sourceUrl),
        },
      ];
    });
    return {
      status: "available" as const,
      activeCount: alerts.length,
      checkedAt: new Date().toISOString(),
      sourceAuthority: "National Weather Service",
      sourceUrl,
      alerts,
    };
  } catch (error) {
    console.error("NWS active alert lookup failed", error);
    return {
      status: "unavailable" as const,
      activeCount: null,
      checkedAt: new Date().toISOString(),
      sourceAuthority: "National Weather Service",
      sourceUrl,
      alerts: [],
    };
  }
}

async function buildNoaaWaterLevel(island: IslandConditionCode) {
  const point = ISLAND_CONDITION_POINTS[island];
  const station = point.tideStation;
  const requestUrl =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?date=latest&station=${station}&product=water_level&datum=MLLW` +
    `&time_zone=gmt&units=english&format=json&application=usvi_explorer`;
  const sourceUrl = `https://tidesandcurrents.noaa.gov/stationhome.html?id=${station}`;

  try {
    const payload = await fetchJson(requestUrl);
    const data = Array.isArray(payload.data) ? payload.data : [];
    const latest = asRecord(data[0]);
    const observedAt = latest ? stringOrNull(latest.t) : null;
    const observedWaterLevelFt = latest ? finiteNumber(latest.v) : null;
    const freshnessMinutes = observationFreshnessMinutes(observedAt);
    const fresh =
      freshnessMinutes !== null &&
      freshnessMinutes <= 120 &&
      observedWaterLevelFt !== null;

    return {
      status: fresh ? ("fresh" as const) : ("unavailable" as const),
      station,
      stationName: point.tideStationName,
      observedWaterLevelFt: fresh ? observedWaterLevelFt : null,
      observedAt,
      freshnessMinutes,
      datum: "MLLW",
      sourceAuthority: "NOAA CO-OPS",
      sourceUrl,
      reason: fresh
        ? "Fresh NOAA coastal water-level observation."
        : "No sufficiently fresh NOAA water-level observation is available for this island reference station.",
    };
  } catch (error) {
    console.error("NOAA water-level lookup failed", error);
    return {
      status: "unavailable" as const,
      station,
      stationName: point.tideStationName,
      observedWaterLevelFt: null,
      observedAt: null,
      freshnessMinutes: null,
      datum: "MLLW",
      sourceAuthority: "NOAA CO-OPS",
      sourceUrl,
      reason: "NOAA water-level observation is temporarily unavailable.",
    };
  }
}

async function buildNdbcMarineObservation(island: IslandConditionCode) {
  const station = NDBC_STATIONS[island];
  if (!station) return unavailableNdbcObservation(island);
  try {
    const text = await fetchText(station.realtimeUrl);
    return parseNdbcRealtime(island, text);
  } catch (error) {
    console.error("NDBC marine observation lookup failed", error);
    return unavailableNdbcObservation(
      island,
      "NDBC does not currently provide a usable recent observation for this station.",
    );
  }
}

export async function GET(request: NextRequest) {
  const islandCode = normalizeIslandConditionCode(
    request.nextUrl.searchParams.get("island")?.toLowerCase(),
  );
  const island = ISLAND_CONDITION_POINTS[islandCode];

  const [weatherResult, alerts, tides, marineObservation] = await Promise.all([
    buildNwsWeather(islandCode).catch((error) => {
      console.error("NWS forecast lookup failed", error);
      return null;
    }),
    buildNwsAlerts(islandCode),
    buildNoaaWaterLevel(islandCode),
    buildNdbcMarineObservation(islandCode),
  ]);

  return NextResponse.json(
    {
      ok: Boolean(weatherResult),
      island: islandCode,
      islandName: island.name,
      referencePoint: island.reference,
      generatedAt: new Date().toISOString(),
      disclaimer:
        "NWS forecast and alert data are authoritative forecast products, not a guarantee of local conditions. NOAA CO-OPS and NDBC values are shown as current observations only when their timestamps pass USVI Explorer freshness checks. No data is converted into a beach-safety, calm-water, or on-time claim.",
      // Backward-compatible forecast fields used by existing clients.
      temperatureF: weatherResult?.temperatureF ?? null,
      windMph: weatherResult?.windMph ?? null,
      windDirection: weatherResult?.windDirection ?? null,
      precipitationChance: weatherResult?.precipitationChance ?? null,
      shortForecast: weatherResult?.shortForecast ?? null,
      updatedAt: weatherResult?.updatedAt ?? null,
      sourceUrl:
        weatherResult?.sourceUrl ?? "https://www.weather.gov/sju/",
      forecastZoneUrl: weatherResult?.forecastZoneUrl ?? null,
      marineSourceUrl: "https://www.weather.gov/sju/marine",
      weather: weatherResult,
      alerts,
      tides,
      marineObservation,
      officialSources: {
        nws: "https://www.weather.gov/sju/",
        marineForecast: "https://www.weather.gov/sju/marine",
        noaaTides: tides.sourceUrl,
        ndbc: marineObservation.sourceUrl,
        beachAdvisory: "https://dpnr.vi.gov/beach-advisory/",
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    },
  );
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function finiteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

import { NextRequest, NextResponse } from "next/server";

const ISLANDS = {
  stt: { latitude: 18.3419, longitude: -64.9307, name: "St. Thomas" },
  stj: { latitude: 18.3358, longitude: -64.7281, name: "St. John" },
  stx: { latitude: 17.7246, longitude: -64.8348, name: "St. Croix" },
} as const;

type IslandCode = keyof typeof ISLANDS;

type NwsPeriod = {
  startTime?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
  probabilityOfPrecipitation?: { value?: number | null };
};

function maxWindMph(value: string | undefined) {
  const speeds = (value ?? "").match(/\d+/g)?.map(Number) ?? [];
  return speeds.length ? Math.max(...speeds) : 0;
}

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("island")?.toLowerCase();
  const islandCode: IslandCode =
    requested === "stj" || requested === "stx" ? requested : "stt";
  const island = ISLANDS[islandCode];
  const headers = {
    Accept: "application/geo+json",
    "User-Agent": "USVI Explorer beach intelligence (https://www.usvi-explorer.com)",
  };

  try {
    const pointResponse = await fetch(
      `https://api.weather.gov/points/${island.latitude},${island.longitude}`,
      { headers, next: { revalidate: 900 } },
    );
    if (!pointResponse.ok) {
      throw new Error(`NWS point lookup failed with ${pointResponse.status}.`);
    }

    const point = (await pointResponse.json()) as {
      properties?: { forecastHourly?: string; forecastZone?: string };
    };
    const forecastUrl = point.properties?.forecastHourly;
    if (!forecastUrl) throw new Error("NWS hourly forecast URL is unavailable.");

    const forecastResponse = await fetch(forecastUrl, {
      headers,
      next: { revalidate: 900 },
    });
    if (!forecastResponse.ok) {
      throw new Error(`NWS hourly forecast failed with ${forecastResponse.status}.`);
    }

    const forecast = (await forecastResponse.json()) as {
      properties?: { updateTime?: string; periods?: NwsPeriod[] };
    };
    const period = forecast.properties?.periods?.[0];
    if (!period) throw new Error("NWS did not return a current forecast period.");

    return NextResponse.json({
      ok: true,
      island: islandCode,
      islandName: island.name,
      temperatureF: Number(period.temperature ?? 0),
      windMph: maxWindMph(period.windSpeed),
      windDirection: period.windDirection ?? "",
      precipitationChance: Number(
        period.probabilityOfPrecipitation?.value ?? 0,
      ),
      shortForecast: period.shortForecast ?? "Forecast available",
      updatedAt: forecast.properties?.updateTime ?? period.startTime ?? null,
      sourceUrl: forecastUrl,
      forecastZoneUrl: point.properties?.forecastZone ?? null,
      marineSourceUrl: "https://www.weather.gov/sju/marine",
    });
  } catch (error) {
    console.error("beach intelligence forecast error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Live NOAA/NWS forecast is temporarily unavailable.",
        officialSources: {
          beachAdvisory: "https://dpnr.vi.gov/beach-advisory/",
          marine: "https://www.weather.gov/sju/marine",
          cruise: "https://www.viport.com/schedule-cruise-ports",
        },
      },
      { status: 502 },
    );
  }
}

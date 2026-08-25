export type IslandConditionCode = "stt" | "stj" | "stx";

export type MarineObservationStatus = "fresh" | "stale" | "unavailable";

export const ISLAND_CONDITION_POINTS = {
  stt: {
    latitude: 18.3419,
    longitude: -64.9307,
    name: "St. Thomas",
    reference: "Charlotte Amalie",
    tideStation: "9751639",
    tideStationName: "Charlotte Amalie",
  },
  stj: {
    latitude: 18.3311,
    longitude: -64.7955,
    name: "St. John",
    reference: "Cruz Bay",
    tideStation: "9751381",
    tideStationName: "Lameshur Bay",
  },
  stx: {
    latitude: 17.7466,
    longitude: -64.7032,
    name: "St. Croix",
    reference: "Christiansted",
    tideStation: "9751401",
    tideStationName: "Limetree Bay",
  },
} as const satisfies Record<
  IslandConditionCode,
  {
    latitude: number;
    longitude: number;
    name: string;
    reference: string;
    tideStation: string;
    tideStationName: string;
  }
>;

export const NDBC_FRESHNESS_MINUTES = 120;

export const NDBC_STATIONS: Partial<
  Record<
    IslandConditionCode,
    { id: string; name: string; sourceUrl: string; realtimeUrl: string }
  >
> = {
  stj: {
    id: "41052",
    name: "South of St. John",
    sourceUrl: "https://www.ndbc.noaa.gov/station_page.php?station=41052",
    realtimeUrl: "https://www.ndbc.noaa.gov/data/realtime2/41052.txt",
  },
};

export function normalizeIslandConditionCode(value: unknown): IslandConditionCode {
  return value === "stj" || value === "stx" ? value : "stt";
}

export function maxWindMph(value: string | undefined): number | null {
  const speeds = value?.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return speeds.length ? Math.max(...speeds) : null;
}

export type ParsedNdbcObservation = {
  status: MarineObservationStatus;
  station: string;
  stationName: string;
  observedAt: string | null;
  freshnessMinutes: number | null;
  waveHeightFt: number | null;
  dominantPeriodSeconds: number | null;
  waterTemperatureF: number | null;
  sourceUrl: string;
  reason: string;
};

export function unavailableNdbcObservation(
  island: IslandConditionCode,
  reason = "No governed nearby NDBC wave station is configured for this island.",
): ParsedNdbcObservation {
  const station = NDBC_STATIONS[island];
  return {
    status: "unavailable",
    station: station?.id ?? "",
    stationName: station?.name ?? "",
    observedAt: null,
    freshnessMinutes: null,
    waveHeightFt: null,
    dominantPeriodSeconds: null,
    waterTemperatureF: null,
    sourceUrl: station?.sourceUrl ?? "https://www.ndbc.noaa.gov/",
    reason,
  };
}

export function parseNdbcRealtime(
  island: IslandConditionCode,
  text: string,
  now = new Date(),
): ParsedNdbcObservation {
  const station = NDBC_STATIONS[island];
  if (!station) return unavailableNdbcObservation(island);

  const row = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
  if (!row) {
    return unavailableNdbcObservation(
      island,
      "NDBC does not currently provide a recent observation row for this station.",
    );
  }

  const values = row.split(/\s+/);
  if (values.length < 15) {
    return unavailableNdbcObservation(
      island,
      "NDBC observation data is incomplete, so USVI Explorer will not infer marine conditions.",
    );
  }

  const year = Number(values[0]);
  const month = Number(values[1]);
  const day = Number(values[2]);
  const hour = Number(values[3]);
  const minute = Number(values[4]);
  const observedMs = Date.UTC(year, month - 1, day, hour, minute);
  if (!Number.isFinite(observedMs)) {
    return unavailableNdbcObservation(island, "NDBC observation timestamp is invalid.");
  }

  const freshnessMinutes = Math.max(
    0,
    Math.floor((now.getTime() - observedMs) / 60_000),
  );
  const fresh = freshnessMinutes <= NDBC_FRESHNESS_MINUTES;
  const waveMeters = finiteMeasurement(values[8]);
  const dominantPeriod = finiteMeasurement(values[9]);
  const waterTempC = finiteMeasurement(values[14]);

  return {
    status: fresh ? "fresh" : "stale",
    station: station.id,
    stationName: station.name,
    observedAt: new Date(observedMs).toISOString(),
    freshnessMinutes,
    waveHeightFt:
      fresh && waveMeters !== null ? roundOne(waveMeters * 3.28084) : null,
    dominantPeriodSeconds: fresh ? dominantPeriod : null,
    waterTemperatureF:
      fresh && waterTempC !== null ? roundOne((waterTempC * 9) / 5 + 32) : null,
    sourceUrl: station.sourceUrl,
    reason: fresh
      ? "Fresh NDBC observation. This is measured offshore data, not a beach-safety rating."
      : `Latest NDBC row is older than ${NDBC_FRESHNESS_MINUTES} minutes, so its wave values are withheld as current conditions.`,
  };
}

export function observationFreshnessMinutes(
  observedAt: string | null | undefined,
  now = new Date(),
): number | null {
  if (!observedAt) return null;
  const normalized = observedAt.includes("T")
    ? observedAt
    : `${observedAt.replace(" ", "T")}Z`;
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 60_000));
}

function finiteMeasurement(value: string | undefined) {
  if (!value || value === "MM") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) >= 99) return null;
  return parsed;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

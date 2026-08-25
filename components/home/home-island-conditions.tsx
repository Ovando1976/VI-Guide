"use client";

import {
  CloudSun,
  ExternalLink,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  ACTIVE_ISLAND_UPDATED_EVENT,
  readActiveIsland,
  writeActiveIsland,
  type ActiveIsland,
} from "@/lib/active-island";

type ConditionsPayload = {
  ok: boolean;
  island: ActiveIsland;
  islandName: string;
  referencePoint: string;
  generatedAt: string;
  weather: null | {
    temperatureF: number | null;
    windSpeed: string | null;
    windDirection: string | null;
    precipitationChance: number | null;
    shortForecast: string | null;
    updatedAt: string | null;
    sourceAuthority: string;
    sourceUrl: string;
  };
  alerts: {
    status: "available" | "unavailable";
    activeCount: number | null;
    checkedAt: string;
    sourceAuthority: string;
    sourceUrl: string;
    alerts: Array<{
      id: string;
      event: string;
      severity: string;
      headline: string;
      effective: string | null;
      expires: string | null;
      sourceUrl: string;
    }>;
  };
  tides: {
    status: "fresh" | "unavailable";
    station: string;
    stationName: string;
    observedWaterLevelFt: number | null;
    observedAt: string | null;
    freshnessMinutes: number | null;
    datum: string;
    sourceAuthority: string;
    sourceUrl: string;
    reason: string;
  };
  marineObservation: {
    status: "fresh" | "stale" | "unavailable";
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
};

const ISLAND_LABELS: Record<ActiveIsland, string> = {
  stt: "STT",
  stj: "STJ",
  stx: "STX",
};

export function HomeIslandConditions() {
  const [island, setIsland] = useState<ActiveIsland>("stt");
  const [data, setData] = useState<ConditionsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsland(readActiveIsland());

    function syncIsland(event: Event) {
      const nextIsland = (event as CustomEvent<ActiveIsland>).detail;
      if (nextIsland) setIsland(nextIsland);
    }

    function syncStorage() {
      setIsland(readActiveIsland());
    }

    window.addEventListener(ACTIVE_ISLAND_UPDATED_EVENT, syncIsland);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(ACTIVE_ISLAND_UPDATED_EVENT, syncIsland);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/beach-intelligence?island=${island}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Conditions request failed: ${response.status}`);
        return response.json() as Promise<ConditionsPayload>;
      })
      .then((payload) => setData(payload))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [island]);

  function selectIsland(nextIsland: ActiveIsland) {
    setIsland(nextIsland);
    writeActiveIsland(nextIsland);
  }

  const alert = data?.alerts.alerts[0] ?? null;
  const wave = data?.marineObservation;
  const tide = data?.tides;

  return (
    <div className="border-b border-[#dce8e4] bg-[#f7faf8] p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[8px] font-black uppercase tracking-[.18em] text-[#b16a18]">NOAA · NWS · NDBC</div>
          <h3 className="vi-display mt-1.5 text-xl font-bold text-[#073b39] sm:text-2xl">Weather and marine source board</h3>
          <p className="mt-1.5 max-w-3xl text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs sm:leading-5">
            Forecasts, alerts, and measured observations stay separate. Missing or stale observations remain visibly unavailable rather than being turned into a safety rating.
          </p>
        </div>
        <div className="flex w-fit gap-1 rounded-full border border-[#d7e4df] bg-white p-1" aria-label="Select island conditions">
          {(Object.keys(ISLAND_LABELS) as ActiveIsland[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => selectIsland(code)}
              aria-pressed={island === code}
              className={`rounded-full px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] transition ${
                island === code
                  ? "bg-[#073b39] text-white"
                  : "text-slate-500 hover:bg-[#edf5f2] hover:text-[#073b39]"
              }`}
            >
              {ISLAND_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <ConditionCard
          icon={CloudSun}
          eyebrow="NWS forecast"
          title={
            loading
              ? "Checking forecast…"
              : data?.weather?.shortForecast ?? "Forecast temporarily unavailable"
          }
          value={
            data?.weather?.temperatureF != null
              ? `${Math.round(data.weather.temperatureF)}°F`
              : "—"
          }
          detail={
            data?.weather
              ? [
                  data.weather.windSpeed && data.weather.windDirection
                    ? `Wind ${data.weather.windDirection} ${data.weather.windSpeed}`
                    : null,
                  data.weather.precipitationChance != null
                    ? `Rain ${Math.round(data.weather.precipitationChance)}%`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "NWS forecast period"
              : "No forecast claim is shown while the source is unavailable."
          }
          freshness={data?.weather?.updatedAt ? `Updated ${formatTimestamp(data.weather.updatedAt)}` : null}
          sourceLabel={data?.weather?.sourceAuthority ?? "National Weather Service"}
          sourceUrl={data?.weather?.sourceUrl ?? "https://www.weather.gov/sju/"}
        />

        <ConditionCard
          icon={ShieldAlert}
          eyebrow="NWS active alerts"
          title={
            loading
              ? "Checking alerts…"
              : alert
                ? alert.event
                : data?.alerts.status === "available"
                  ? "No active NWS alert returned"
                  : "Alert feed temporarily unavailable"
          }
          value={alert ? alert.severity : data?.alerts.status === "available" ? "0 active" : "—"}
          detail={
            alert?.headline ||
            (data?.alerts.status === "available"
              ? "This means the point query returned no active alert; it is not a general safety guarantee."
              : "USVI Explorer will not infer an all-clear when the alert source is unavailable.")
          }
          freshness={data?.alerts.checkedAt ? `Checked ${formatTimestamp(data.alerts.checkedAt)}` : null}
          sourceLabel="National Weather Service"
          sourceUrl={alert?.sourceUrl || data?.alerts.sourceUrl || "https://www.weather.gov/sju/"}
          emphasis={Boolean(alert)}
        />

        <ConditionCard
          icon={Waves}
          eyebrow="NOAA / NDBC observations"
          title={
            loading
              ? "Checking marine observations…"
              : wave?.status === "fresh" && wave.waveHeightFt != null
                ? `${wave.waveHeightFt.toFixed(1)} ft offshore wave height`
                : wave?.status === "stale"
                  ? "NDBC wave observation is stale"
                  : "Wave observation unavailable"
          }
          value={
            tide?.status === "fresh" && tide.observedWaterLevelFt != null
              ? `${tide.observedWaterLevelFt.toFixed(2)} ft MLLW`
              : "No fresh tide value"
          }
          detail={marineDetail(data)}
          freshness={marineFreshness(data)}
          sourceLabel={
            wave?.station
              ? `NDBC ${wave.station} · NOAA CO-OPS ${tide?.station ?? ""}`.trim()
              : `NOAA CO-OPS ${tide?.station ?? ""}`.trim()
          }
          sourceUrl={wave?.station ? wave.sourceUrl : tide?.sourceUrl ?? "https://www.ndbc.noaa.gov/"}
        />
      </div>

      <div className="mt-3 flex flex-col gap-1 text-[8px] font-bold leading-3.5 text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-[9px]">
        <span>{data ? `${data.islandName} · reference point near ${data.referencePoint}` : "Authoritative island reference points"}</span>
        <span>Forecast ≠ observation · Observation ≠ beach-safety rating</span>
      </div>
    </div>
  );
}

function ConditionCard({
  icon: Icon,
  eyebrow,
  title,
  value,
  detail,
  freshness,
  sourceLabel,
  sourceUrl,
  emphasis = false,
}: {
  icon: typeof CloudSun;
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  freshness: string | null;
  sourceLabel: string;
  sourceUrl: string;
  emphasis?: boolean;
}) {
  return (
    <article className={`rounded-[22px] border p-4 ${emphasis ? "border-amber-200 bg-amber-50" : "border-[#dce8e4] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e7f3f0] text-[#08746f]"><Icon size={17} aria-hidden="true" /></span>
        <span className="text-right text-[8px] font-black uppercase tracking-[.13em] text-slate-400">{eyebrow}</span>
      </div>
      <div className="vi-display mt-4 text-xl font-bold leading-tight text-[#073b39]">{value}</div>
      <h4 className="mt-1.5 text-xs font-black leading-4 text-[#073b39]">{title}</h4>
      <p className="mt-2 min-h-10 text-[9px] font-semibold leading-4 text-slate-500">{detail}</p>
      <div className="mt-3 border-t border-[#e8efec] pt-3">
        {freshness ? <div className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">{freshness}</div> : null}
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-[#0b6d67] hover:underline">
          {sourceLabel || "Official source"} <ExternalLink size={10} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function marineDetail(data: ConditionsPayload | null) {
  if (!data) return "Marine observations are loading from official sources.";
  const wave = data.marineObservation;
  const tide = data.tides;
  const pieces = [
    wave.status === "fresh"
      ? `NDBC ${wave.stationName}: measured offshore observation.`
      : wave.reason,
    tide.status === "fresh"
      ? `NOAA ${tide.stationName}: fresh water-level observation.`
      : tide.reason,
  ];
  return pieces.join(" ");
}

function marineFreshness(data: ConditionsPayload | null) {
  if (!data) return null;
  const values = [
    data.marineObservation.freshnessMinutes != null
      ? `NDBC ${formatAge(data.marineObservation.freshnessMinutes)}`
      : null,
    data.tides.freshnessMinutes != null
      ? `NOAA ${formatAge(data.tides.freshnessMinutes)}`
      : null,
  ].filter(Boolean);
  return values.length ? values.join(" · ") : "No fresh observation timestamp available";
}

function formatAge(minutes: number) {
  if (minutes < 60) return `${minutes}m old`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m old` : `${hours}h old`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

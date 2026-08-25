"use client";

import { CloudSun, ExternalLink, ShieldAlert, Waves } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type { ActiveIsland } from "@/lib/active-island";

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
    sourceUrl: string;
    alerts: Array<{
      id: string;
      event: string;
      severity: string;
      headline: string;
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

export function IslandConditionsBrief({ island }: { island: ActiveIsland }) {
  const [data, setData] = useState<ConditionsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/beach-intelligence?island=${island}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
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

  const alert = data?.alerts.alerts[0] ?? null;
  const weather = data?.weather;
  const tide = data?.tides;
  const wave = data?.marineObservation;

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-8" aria-live="polite">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[30px] border border-[#d8e7e2] bg-white shadow-[0_14px_45px_rgba(4,51,49,.08)]">
        <div className="flex flex-col gap-3 border-b border-[#e2ebe8] bg-[#f7faf8] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#a65d13]">Official conditions now</p>
            <h2 className="vi-display mt-2 text-2xl font-bold tracking-[-.035em] text-[#073b39]">
              {loading ? "Checking current island context…" : data ? `${data.islandName} conditions before you plan` : "Current island conditions temporarily unavailable"}
            </h2>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-500">
              NWS forecasts and alerts stay separate from NOAA/NDBC observations. USVI Explorer does not turn missing or stale marine data into a beach-safety rating.
            </p>
          </div>
          {data ? (
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
              Reference point · {data.referencePoint}
            </div>
          ) : null}
        </div>

        <div className="grid gap-px bg-[#e2ebe8] md:grid-cols-3">
          <BriefCard
            icon={<CloudSun size={18} aria-hidden="true" />}
            eyebrow="NWS forecast"
            title={weather?.shortForecast ?? (loading ? "Loading forecast…" : "Forecast unavailable")}
            value={weather?.temperatureF != null ? `${Math.round(weather.temperatureF)}°F` : "—"}
            detail={
              weather
                ? [
                    weather.windDirection && weather.windSpeed
                      ? `Wind ${weather.windDirection} ${weather.windSpeed}`
                      : null,
                    weather.precipitationChance != null
                      ? `Rain ${Math.round(weather.precipitationChance)}%`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Current NWS forecast period"
                : "No forecast claim is shown while the official source is unavailable."
            }
            freshness={weather?.updatedAt ? `Updated ${formatTimestamp(weather.updatedAt)}` : null}
            sourceUrl={weather?.sourceUrl ?? "https://www.weather.gov/sju/"}
            sourceLabel={weather?.sourceAuthority ?? "National Weather Service"}
          />

          <BriefCard
            icon={<ShieldAlert size={18} aria-hidden="true" />}
            eyebrow="NWS alerts"
            title={
              alert
                ? alert.event
                : loading
                  ? "Checking active alerts…"
                  : data?.alerts.status === "available"
                    ? "No active NWS alert returned"
                    : "Alert source unavailable"
            }
            value={alert ? alert.severity : data?.alerts.status === "available" ? "0 active" : "—"}
            detail={
              alert?.headline ||
              (data?.alerts.status === "available"
                ? "The point query returned no active alert; this is not a general all-clear or safety guarantee."
                : "USVI Explorer will not infer an all-clear when the official alert source cannot be read.")
            }
            freshness={data?.alerts.checkedAt ? `Checked ${formatTimestamp(data.alerts.checkedAt)}` : null}
            sourceUrl={alert?.sourceUrl ?? data?.alerts.sourceUrl ?? "https://www.weather.gov/sju/"}
            sourceLabel="National Weather Service"
            emphasis={Boolean(alert)}
          />

          <BriefCard
            icon={<Waves size={18} aria-hidden="true" />}
            eyebrow="NOAA / NDBC coast"
            title={
              wave?.status === "fresh" && wave.waveHeightFt != null
                ? `${wave.waveHeightFt.toFixed(1)} ft measured offshore wave`
                : "No fresh governed wave reading"
            }
            value={
              tide?.status === "fresh" && tide.observedWaterLevelFt != null
                ? `${tide.observedWaterLevelFt.toFixed(2)} ft MLLW`
                : "—"
            }
            detail={coastalDetail(data)}
            freshness={coastalFreshness(data)}
            sourceUrl={wave?.station ? wave.sourceUrl : tide?.sourceUrl ?? "https://www.ndbc.noaa.gov/"}
            sourceLabel={
              wave?.station
                ? `NDBC ${wave.station}${tide?.station ? ` · NOAA ${tide.station}` : ""}`
                : tide?.station
                  ? `NOAA CO-OPS ${tide.station}`
                  : "NOAA / NDBC"
            }
          />
        </div>

        <div className="flex flex-col gap-1 border-t border-[#e2ebe8] bg-[#fbfcfb] px-5 py-3 text-[9px] font-bold leading-4 text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Use these source facts as trip context, not as a beach-safety or ferry-status guarantee.</span>
          <span>Forecast ≠ observation · Observation ≠ safety rating</span>
        </div>
      </div>
    </section>
  );
}

function BriefCard({
  icon,
  eyebrow,
  title,
  value,
  detail,
  freshness,
  sourceUrl,
  sourceLabel,
  emphasis = false,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  freshness: string | null;
  sourceUrl: string;
  sourceLabel: string;
  emphasis?: boolean;
}) {
  return (
    <article className={`min-w-0 p-5 sm:p-6 ${emphasis ? "bg-amber-50" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e7f3f0] text-[#08746f]">{icon}</span>
        <span className="text-right text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{eyebrow}</span>
      </div>
      <div className="vi-display mt-4 text-2xl font-bold leading-tight text-[#073b39]">{value}</div>
      <h3 className="mt-1.5 text-sm font-black leading-5 text-[#073b39]">{title}</h3>
      <p className="mt-2 min-h-12 text-[10px] font-semibold leading-4 text-slate-500">{detail}</p>
      <div className="mt-4 border-t border-[#e8efec] pt-3">
        {freshness ? <div className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">{freshness}</div> : null}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-[#0b6d67] hover:underline"
        >
          {sourceLabel} <ExternalLink size={10} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function coastalDetail(data: ConditionsPayload | null) {
  if (!data) return "Checking current coastal observations from official sources.";
  const wave = data.marineObservation;
  const tide = data.tides;
  const pieces = [
    wave.status === "fresh"
      ? `NDBC ${wave.stationName}: fresh measured offshore observation.`
      : wave.reason,
    tide.status === "fresh"
      ? `NOAA ${tide.stationName}: fresh measured water level.`
      : tide.reason,
  ];
  return pieces.join(" ");
}

function coastalFreshness(data: ConditionsPayload | null) {
  if (!data) return null;
  const pieces = [
    data.marineObservation.freshnessMinutes != null
      ? `NDBC ${formatAge(data.marineObservation.freshnessMinutes)}`
      : null,
    data.tides.freshnessMinutes != null
      ? `NOAA ${formatAge(data.tides.freshnessMinutes)}`
      : null,
  ].filter(Boolean);
  return pieces.length ? pieces.join(" · ") : "No fresh observation timestamp available";
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

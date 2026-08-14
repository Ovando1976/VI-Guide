"use client";

import Link from "next/link";
import {
  ArrowRight,
  CloudSun,
  Compass,
  ExternalLink,
  Gauge,
  LifeBuoy,
  LoaderCircle,
  MapPinned,
  Navigation,
  Ship,
  Sparkles,
  Waves,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type IslandCode = "stt" | "stj" | "stx";

type LiveConditions = {
  temperatureF: number;
  windMph: number;
  windDirection: string;
  precipitationChance: number;
  shortForecast: string;
  updatedAt: string | null;
  sourceUrl: string;
};

type IslandProfile = {
  code: IslandCode;
  short: string;
  name: string;
  latitude: number;
  longitude: number;
  calmChoice: { name: string; slug: string; reason: string };
  shelteredChoice: { name: string; slug: string; reason: string };
};

const ISLANDS: IslandProfile[] = [
  {
    code: "stt",
    short: "STT",
    name: "St. Thomas",
    latitude: 18.3419,
    longitude: -64.9307,
    calmChoice: {
      name: "Coki Point",
      slug: "coki-point",
      reason: "A strong match for an easy snorkel-focused beach stop when regional conditions are favorable.",
    },
    shelteredChoice: {
      name: "Magens Bay",
      slug: "magens-bay",
      reason: "A practical first comparison when offshore wind or wave energy increases.",
    },
  },
  {
    code: "stj",
    short: "STJ",
    name: "St. John",
    latitude: 18.3358,
    longitude: -64.7281,
    calmChoice: {
      name: "Maho Bay",
      slug: "maho-bay",
      reason: "A convenient North Shore choice for a slower beach day when regional conditions cooperate.",
    },
    shelteredChoice: {
      name: "Hawksnest Beach",
      slug: "hawksnest-beach",
      reason: "A useful close-to-Cruz-Bay alternative to compare before committing to a longer North Shore run.",
    },
  },
  {
    code: "stx",
    short: "STX",
    name: "St. Croix",
    latitude: 17.7246,
    longitude: -64.8348,
    calmChoice: {
      name: "Cane Bay",
      slug: "cane-bay",
      reason: "A strong north-shore option for snorkeling and a full coast-day plan in favorable conditions.",
    },
    shelteredChoice: {
      name: "Rainbow Beach",
      slug: "rainbow-beach",
      reason: "A useful west-end comparison when you want easier access, food nearby, and a flexible beach stop.",
    },
  },
];


function regionalLabel(conditions: LiveConditions) {
  if (conditions.windMph <= 15 && conditions.precipitationChance <= 30) {
    return { label: "Favorable planning signal", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
  if (conditions.windMph <= 22 && conditions.precipitationChance <= 50) {
    return { label: "Compare sheltered shores", tone: "text-amber-800 bg-amber-50 border-amber-200" };
  }
  return { label: "Check advisories closely", tone: "text-rose-800 bg-rose-50 border-rose-200" };
}

export function BeachIntelligencePanel() {
  const [islandCode, setIslandCode] = useState<IslandCode>("stt");
  const [conditions, setConditions] = useState<LiveConditions | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const island = useMemo(
    () => ISLANDS.find((candidate) => candidate.code === islandCode) ?? ISLANDS[0],
    [islandCode],
  );

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    async function loadConditions() {
      try {
        const response = await fetch(
          `/api/beach-intelligence?island=${island.code}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Official forecast is unavailable.");
        const payload = await response.json();
        setConditions({
          temperatureF: Number(payload.temperatureF ?? 0),
          windMph: Number(payload.windMph ?? 0),
          windDirection: String(payload.windDirection ?? ""),
          precipitationChance: Number(payload.precipitationChance ?? 0),
          shortForecast: String(payload.shortForecast ?? "Forecast available"),
          updatedAt: payload.updatedAt ? String(payload.updatedAt) : null,
          sourceUrl: String(payload.sourceUrl ?? "https://www.weather.gov/sju/"),
        });
        setStatus("ready");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setConditions(null);
          setStatus("error");
        }
      }
    }

    void loadConditions();
    return () => controller.abort();
  }, [island]);

  const signal = conditions ? regionalLabel(conditions) : null;
  const recommendation =
    conditions &&
    (conditions.windMph > 18 || conditions.precipitationChance > 40)
      ? island.shelteredChoice
      : island.calmChoice;
  const destination = encodeURIComponent(recommendation.name);

  return (
    <section className="overflow-hidden rounded-[34px] border border-[#cfe0dc] bg-[#fffdf8] shadow-[0_24px_70px_rgba(4,51,49,.12)]">
      <div className="relative overflow-hidden bg-[#043331] px-6 py-7 text-white sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(115,227,217,.24),transparent_38%),radial-gradient(circle_at_5%_100%,rgba(245,196,81,.16),transparent_34%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#73e3d9]">
              <Gauge className="h-4 w-4" /> Beach Intelligence
            </div>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.045em] sm:text-5xl">
              Don’t just find a beach. Choose the right beach now.
            </h2>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/68 sm:text-base">
              Live NOAA/NWS weather signals—connected to official marine and water-quality advisories, port schedules, maps, trip planning, and your ride.
            </p>
          </div>
          <div className="flex rounded-full border border-white/15 bg-black/15 p-1.5 backdrop-blur" aria-label="Beach intelligence island">
            {ISLANDS.map((candidate) => (
              <button
                key={candidate.code}
                type="button"
                onClick={() => setIslandCode(candidate.code)}
                aria-pressed={candidate.code === islandCode}
                className={`rounded-full px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] transition ${
                  candidate.code === islandCode
                    ? "bg-[#f5c451] text-[#043331]"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {candidate.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
        <div className="border-b border-[#dce8e4] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-700">Live regional snapshot</div>
              <h3 className="mt-1 text-2xl font-black tracking-[-.035em]">{island.name}</h3>
            </div>
            {status === "loading" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-slate-500">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Updating
              </span>
            ) : signal ? (
              <span className={`rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] ${signal.tone}`}>
                {signal.label}
              </span>
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-amber-800">
                Official checks available
              </span>
            )}
          </div>

          {conditions ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SignalCard icon={CloudSun} label="Temperature" value={`${Math.round(conditions.temperatureF)}°F`} detail={conditions.shortForecast} />
              <SignalCard icon={Wind} label="Wind" value={`${Math.round(conditions.windMph)} mph`} detail={conditions.windDirection || "Regional forecast"} />
              <SignalCard icon={CloudSun} label="Rain chance" value={`${Math.round(conditions.precipitationChance)}%`} detail="Current forecast period" />
              <SignalCard icon={Waves} label="Marine outlook" value="Official" detail="Open NWS marine forecast below" />
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#bfd4cf] bg-[#f5faf8] p-6 text-sm font-semibold leading-6 text-slate-600">
              {status === "error"
                ? "Live regional data is temporarily unavailable. Use the official DPNR, NOAA, and port checks below before departure."
                : "Loading the latest regional planning signals…"}
            </div>
          )}

          <div className="mt-5 rounded-[26px] border border-[#d9e7e3] bg-[#f4faf8] p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0f766e] text-white">
                <Compass className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-800">Best comparison to start with</div>
                <h4 className="mt-1 text-2xl font-black tracking-[-.035em]">{recommendation.name}</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{recommendation.reason}</p>
                <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">
                  This is a planning recommendation—not a lifeguard, water-quality, rip-current, or beach-specific safety determination.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Link href={`/beaches/${recommendation.slug}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white">
                Explore beach <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/map?island=${island.code}&q=${destination}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#c8dad5] bg-white px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]">
                <MapPinned className="h-4 w-4" /> View map
              </Link>
              <Link href={`/mobility?destinationName=${destination}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]">
                <Navigation className="h-4 w-4" /> Plan ride
              </Link>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-700">Verify before you go</div>
          <h3 className="mt-1 text-2xl font-black tracking-[-.035em]">Official checks, not mystery scores</h3>
          <div className="mt-5 space-y-3">
            <SourceLink
              icon={LifeBuoy}
              title="DPNR beach advisory"
              description="Latest territory sampling notices and beach-water advisories."
              href="https://dpnr.vi.gov/beach-advisory/"
            />
            <SourceLink
              icon={Waves}
              title="NOAA/NWS marine conditions"
              description="Official coastal-waters forecasts, hazards, wind, seas, and rip-current context."
              href="https://www.weather.gov/sju/marine"
            />
            <SourceLink
              icon={Ship}
              title="Official cruise schedule"
              description="Check Crown Bay, Havensight, St. John, and Frederiksted port calls."
              href="https://www.viport.com/schedule-cruise-ports"
            />
          </div>

          <Link
            href={`/concierge?open=true&prompt=${encodeURIComponent(
              `Choose the best ${island.name} beach for me today. Compare live conditions, official advisories, cruise pressure, travel time, and taxi cost.`,
            )}`}
            className="mt-5 flex items-center justify-between rounded-[24px] bg-[#0f766e] px-5 py-4 text-white shadow-[0_14px_30px_rgba(15,118,110,.2)]"
          >
            <span>
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#b8fff8]">
                <Sparkles className="h-4 w-4" /> Ask VI Concierge
              </span>
              <span className="mt-1 block text-sm font-black">Compare the whole decision</span>
            </span>
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="mt-4 text-[10px] font-semibold leading-5 text-slate-500">
            Forecast from NOAA/National Weather Service San Juan. Advisory links remain the controlling safety sources.
            {conditions?.updatedAt ? ` Updated ${new Date(conditions.updatedAt).toLocaleString("en-US", { timeZone: "America/St_Thomas", hour: "numeric", minute: "2-digit" })} AST.` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Waves;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#dce8e4] bg-white p-4">
      <Icon className="h-4 w-4 text-[#0f766e]" />
      <span className="mt-3 block text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span>
      <strong className="mt-1 block text-xl text-[#043331]">{value}</strong>
      <span className="mt-1 block text-[10px] font-semibold text-slate-500">{detail}</span>
    </div>
  );
}

function SourceLink({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Waves;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-[22px] border border-[#dce8e4] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0f766e]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#edf7f4] text-[#0f766e]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#043331]">{title}</span>
        <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-500">{description}</span>
      </span>
      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#0f766e]" />
    </a>
  );
}

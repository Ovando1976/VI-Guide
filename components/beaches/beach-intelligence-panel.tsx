"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudSun, ExternalLink, LoaderCircle, MapPinned, Navigation, Sparkles, Waves, Wind } from "lucide-react";

type IslandCode = "stt" | "stj" | "stx";
type Conditions = { temperatureF: number | null; windMph: number | null; windDirection: string | null; precipitationChance: number | null; shortForecast: string | null; updatedAt: string | null; sourceUrl: string };

const ISLANDS: Record<IslandCode, { name: string; beach: string; slug: string }> = {
  stt: { name: "St. Thomas", beach: "Magens Bay", slug: "magens-bay" },
  stj: { name: "St. John", beach: "Maho Bay", slug: "maho-bay" },
  stx: { name: "St. Croix", beach: "Rainbow Beach", slug: "rainbow-beach" },
};

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function BeachIntelligencePanel() {
  const [island, setIsland] = useState<IslandCode>("stt");
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [loading, setLoading] = useState(true);
  const profile = ISLANDS[island];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setConditions(null);
    fetch(`/api/beach-intelligence?island=${island}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("forecast unavailable");
        return response.json();
      })
      .then((data) => setConditions({
        temperatureF: nullableNumber(data.temperatureF),
        windMph: nullableNumber(data.windMph),
        windDirection: typeof data.windDirection === "string" && data.windDirection.trim() ? data.windDirection : null,
        precipitationChance: nullableNumber(data.precipitationChance),
        shortForecast: typeof data.shortForecast === "string" && data.shortForecast.trim() ? data.shortForecast : null,
        updatedAt: data.updatedAt ? String(data.updatedAt) : null,
        sourceUrl: String(data.sourceUrl ?? "https://www.weather.gov/sju/"),
      }))
      .catch((error) => { if (error.name !== "AbortError") setConditions(null); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [island]);

  const destination = encodeURIComponent(profile.beach);
  const rideHref = `/mobility?island=${island}&destinationName=${destination}&source=beach-intelligence&destinationType=beach`;
  const mapHref = `/map?island=${island}&q=${destination}&destinationName=${destination}&source=beach-intelligence&destinationType=beach&rideHref=${encodeURIComponent(rideHref)}`;

  return (
    <section className="overflow-hidden rounded-[34px] border border-[#cfe0dc] bg-[#fffdf8] shadow-[0_24px_70px_rgba(4,51,49,.12)]">
      <div className="bg-[#043331] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#73e3d9]">Beach Intelligence</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-5xl">Choose the right beach for today.</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/70">Live NOAA/NWS regional signals paired with direct official water-quality and marine checks. This is planning guidance, not a beach-specific safety determination.</p>
          </div>
          <div className="flex rounded-full border border-white/15 bg-black/15 p-1.5">
            {(["stt", "stj", "stx"] as IslandCode[]).map((code) => (
              <button key={code} type="button" onClick={() => setIsland(code)} className={`rounded-full px-4 py-2 text-[9px] font-black uppercase ${code === island ? "bg-[#f5c451] text-[#043331]" : "text-white/70"}`}>{code}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="flex items-center justify-between gap-3"><h3 className="text-2xl font-black">{profile.name}</h3>{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}</div>
          {conditions ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Signal icon={CloudSun} label="Temperature" value={conditions.temperatureF === null ? "Unavailable" : `${Math.round(conditions.temperatureF)}°F`} />
              <Signal icon={Wind} label="Wind" value={conditions.windMph === null ? "Unavailable" : `${Math.round(conditions.windMph)} mph${conditions.windDirection ? ` ${conditions.windDirection}` : ""}`} />
              <Signal icon={CloudSun} label="Rain chance" value={conditions.precipitationChance === null ? "Unavailable" : `${Math.round(conditions.precipitationChance)}%`} />
            </div>
          ) : !loading ? <div className="mt-4 rounded-2xl border border-dashed p-5 text-sm font-semibold text-slate-600">Live regional conditions are temporarily unavailable. Use the official checks before departure.</div> : null}
          {conditions?.shortForecast ? <p className="mt-3 text-xs font-semibold text-slate-500">{conditions.shortForecast}</p> : null}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Link href={`/beaches/${profile.slug}`} className="flex min-h-11 items-center justify-center rounded-2xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white">Explore {profile.beach}</Link>
            <Link href={mapHref} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border bg-white px-4 text-[9px] font-black uppercase"><MapPinned className="h-4 w-4" /> Map</Link>
            <Link href={rideHref} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-4 text-[9px] font-black uppercase"><Navigation className="h-4 w-4" /> Plan ride</Link>
          </div>
        </div>
        <div className="rounded-[26px] bg-[#f4faf8] p-5">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-700">Verify before you go</div>
          <h3 className="mt-1 text-xl font-black">Official checks, not mystery scores</h3>
          <div className="mt-4 space-y-2">
            <Official href="https://dpnr.vi.gov/beach-advisory/" label="DPNR beach advisory" />
            <Official href="https://www.weather.gov/sju/marine" label="NOAA/NWS marine conditions" />
            <Official href="https://www.viport.com/schedule-cruise-ports" label="VIPA cruise schedule" />
          </div>
          <Link href={`/concierge?open=true&prompt=${encodeURIComponent(`Help me choose a ${profile.name} beach today using official conditions, travel time, and taxi cost.`)}`} className="mt-4 flex items-center justify-between rounded-2xl bg-[#0f766e] px-4 py-4 text-sm font-black text-white"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Ask VI Concierge</span><Waves className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}

function Signal({ icon: Icon, label, value }: { icon: typeof Waves; label: string; value: string }) { return <div className="rounded-2xl border bg-white p-4"><Icon className="h-4 w-4 text-[#0f766e]" /><span className="mt-2 block text-[8px] font-black uppercase tracking-[.15em] text-slate-500">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>; }
function Official({ href, label }: { href: string; label: string }) { return <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm font-bold">{label}<ExternalLink className="h-4 w-4" /></a>; }

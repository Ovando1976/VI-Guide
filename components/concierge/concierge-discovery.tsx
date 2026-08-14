"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BedDouble,
  Compass,
  Landmark,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  Waves,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyStopInput,
} from "@/lib/journey-planner";
import type { IslandCode } from "@/types/usvi";

type EvidenceType = "place" | "beach" | "stay" | "historic";

type EvidenceItem = {
  id: string;
  type: EvidenceType;
  name: string;
  description: string;
  category: string;
  island: IslandCode;
  islandName: string;
  estateGeoid: string | null;
  href: string;
  mapHref: string;
  rideHref: string;
  lat: number | null;
  lng: number | null;
  score: number;
  tags: string[];
};

type EvidenceResponse = {
  query: string;
  island: IslandCode;
  count: number;
  evidence: EvidenceItem[];
};

type Props = {
  initialIsland?: IslandCode;
};

const ISLANDS: Array<{ code: IslandCode; label: string }> = [
  { code: "stt", label: "St. Thomas" },
  { code: "stj", label: "St. John" },
  { code: "stx", label: "St. Croix" },
];

const STARTERS = [
  "A relaxed beach day with lunch nearby",
  "A historic afternoon with a scenic stop",
  "A hotel near restaurants and transportation",
  "A family-friendly day with a rain backup",
] as const;

export function ConciergeDiscovery({ initialIsland = "stt" }: Props) {
  const [island, setIsland] = useState<IslandCode>(initialIsland);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<EvidenceItem[]>([]);
  const [tripStops, setTripStops] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setIsland(initialIsland), [initialIsland]);

  useEffect(() => {
    function refreshTripCount() {
      setTripStops(
        readJourneyPlans().reduce((total, plan) => total + plan.plan.length, 0),
      );
    }

    refreshTripCount();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshTripCount);
    window.addEventListener("storage", refreshTripCount);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshTripCount);
      window.removeEventListener("storage", refreshTripCount);
    };
  }, []);

  const islandLabel = useMemo(
    () => ISLANDS.find((item) => item.code === island)?.label ?? island,
    [island],
  );

  async function search(textOverride?: string) {
    const text = (textOverride ?? query).trim();
    if (!text || loading) return;

    setQuery(text);
    setSubmittedQuery(text);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: text, island, limit: "18" });
      const response = await fetch(`/api/concierge/evidence?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | EvidenceResponse
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("evidence" in payload)) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "USVI Explorer could not search the live catalog.",
        );
      }

      setResults(payload.evidence);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "USVI Explorer could not search the live catalog.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search();
  }

  const conciergeHref = `/concierge?open=true&prompt=${encodeURIComponent(
    submittedQuery || query || `Plan a day on ${islandLabel}`,
  )}&island=${island}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.11),transparent_32%),linear-gradient(180deg,#f3f7f5_0%,#fff_55%,#f8f4ea_100%)] text-slate-950">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#041f29_0%,#073b45_58%,#0d766e_100%)] text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_310px] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/75">
                <Sparkles size={13} /> USVI Explorer Concierge
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                Describe the island day you want.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/65 sm:text-lg">
                Discover reviewed places, compare practical options, save real stops to My Trip, and ask Concierge to connect timing, maps, and transportation.
              </p>
            </div>

            <Link
              href="/planner"
              className="rounded-[26px] border border-white/15 bg-white/[.08] p-5 backdrop-blur transition hover:bg-white/[.12]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5c451] text-[#043331]">
                  <Route className="h-5 w-5" />
                </span>
                <span className="text-3xl font-black">{tripStops}</span>
              </div>
              <div className="mt-4 text-[9px] font-black uppercase tracking-[.18em] text-cyan-100/55">
                My Trip
              </div>
              <div className="mt-1 text-sm font-black">
                {tripStops
                  ? `${tripStops} saved stop${tripStops === 1 ? "" : "s"} · Open planner →`
                  : "Save your first stop from the results below →"}
              </div>
            </Link>
          </div>

          <form
            onSubmit={submit}
            className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.07] p-3 shadow-2xl backdrop-blur"
          >
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex shrink-0 gap-2 overflow-x-auto">
                {ISLANDS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setIsland(item.code)}
                    className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-extrabold transition ${
                      island === item.code
                        ? "bg-cyan-300 text-[#05272f]"
                        : "bg-white/[0.07] text-white/60 hover:bg-white/[0.12] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white px-4 text-slate-950">
                <Search size={19} className="shrink-0 text-slate-400" />
                <span className="sr-only">Describe your ideal island experience</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Quiet beach, local lunch, easy taxi route…"
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                />
              </label>

              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 text-sm font-black text-[#05272f] transition hover:bg-cyan-200 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Compass size={17} />
                )}
                Find my fit
              </button>
            </div>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                disabled={loading}
                onClick={() => void search(starter)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-bold text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}

        {!submittedQuery && !loading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                  Search by experience
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Start with the feeling, timing, or practical need.
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Concierge Discovery searches beaches, dining, stays, and heritage together. Every match can move directly into maps, transportation, and your saved journey.
                </p>
              </div>
              <Link
                href={conciergeHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073542] px-6 py-4 text-[10px] font-black uppercase tracking-[.17em] text-white"
              >
                <Sparkles size={16} /> Ask Concierge directly
              </Link>
            </div>
          </div>
        ) : null}

        {submittedQuery ? (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-teal-700">
                {results.length} grounded matches · {islandLabel}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                “{submittedQuery}”
              </h2>
            </div>
            <Link
              href={conciergeHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073542] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white shadow-sm"
            >
              <Sparkles size={16} /> Build the full plan
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className="grid min-h-72 place-items-center rounded-[32px] border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-teal-700" />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Ranking the USVI Explorer catalog…
              </p>
            </div>
          </div>
        ) : null}

        {!loading && submittedQuery && !results.length && !error ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center">
            <h3 className="text-xl font-black">No strong catalog match yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Broaden the description or ask Concierge to build a plan from nearby options.
            </p>
          </div>
        ) : null}

        {!loading && results.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((item) => {
              const Icon = iconForType(item.type);
              const journeyStop: JourneyStopInput = {
                id: item.id,
                title: item.name,
                island: item.island,
                kind: item.type,
                summary: item.description,
                ...(item.lat !== null ? { lat: item.lat } : {}),
                ...(item.lng !== null ? { lng: item.lng } : {}),
                href: item.href,
                mapHref: item.mapHref,
                bookingHref: item.rideHref,
              };

              return (
                <article
                  key={`${item.type}:${item.id}`}
                  className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-800">
                      <Icon size={19} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {typeLabel(item.type)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-black tracking-[-0.025em]">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs font-black uppercase tracking-[.12em] text-teal-700">
                    {item.islandName}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                    {item.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-5">
                    <ResultAction href={item.href} icon={MapPin} label="Details" />
                    <ResultAction href={item.mapHref} icon={Map} label="Map" />
                    <ResultAction
                      href={item.rideHref}
                      icon={Navigation}
                      label="Ride"
                      accent
                    />
                    <AddToJourneyButton
                      stop={journeyStop}
                      className="w-full px-3 text-center"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ResultAction({
  href,
  icon: Icon,
  label,
  accent = false,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[.13em] transition hover:-translate-y-0.5 ${
        accent
          ? "bg-[#f5c451] text-[#043331] hover:bg-[#ffca55]"
          : "border border-slate-200 bg-[#f8f4ea] text-[#043331] hover:border-teal-700"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function iconForType(type: EvidenceType) {
  if (type === "beach") return Waves;
  if (type === "stay") return BedDouble;
  if (type === "historic") return Landmark;
  return MapPin;
}

function typeLabel(type: EvidenceType) {
  if (type === "beach") return "Beach";
  if (type === "stay") return "Stay";
  if (type === "historic") return "Heritage";
  return "Place";
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BedDouble,
  Bookmark,
  BookmarkCheck,
  Compass,
  Landmark,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Trash2,
  Waves,
} from "lucide-react";

type IslandCode = "stt" | "stj" | "stx";
type EvidenceType = "place" | "beach" | "stay" | "historic";

type EvidenceItem = {
  type: EvidenceType;
  name: string;
  description: string;
  category: string;
  island: string;
  estateGeoid: string | null;
  href: string;
  score: number;
  tags: string[];
};

type EvidenceResponse = {
  query: string;
  island: IslandCode;
  count: number;
  evidence: EvidenceItem[];
};

const STORAGE_KEY = "vi-guide-concierge-saved-v1";

const ISLANDS: Array<{ code: IslandCode; label: string }> = [
  { code: "stt", label: "St. Thomas" },
  { code: "stj", label: "St. John" },
  { code: "stx", label: "St. Croix" },
];

const STARTERS = [
  "A relaxed beach day with lunch nearby",
  "A historic afternoon with a scenic stop",
  "A hotel near restaurants and transportation",
  "A family-friendly day with a backup plan",
] as const;

export function ConciergeDiscovery() {
  const [island, setIsland] = useState<IslandCode>("stt");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<EvidenceItem[]>([]);
  const [saved, setSaved] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as EvidenceItem[]) : [];
      if (Array.isArray(parsed)) setSaved(parsed.slice(0, 24));
    } catch {
      setSaved([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 24)));
    } catch {
      // Saved picks still work for the current session.
    }
  }, [saved]);

  const islandLabel = useMemo(
    () => ISLANDS.find((item) => item.code === island)?.label ?? island,
    [island],
  );

  const savedKeys = useMemo(
    () => new Set(saved.map((item) => `${item.type}:${item.href}`)),
    [saved],
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
            : "VI Guide could not search the live catalog.",
        );
      }

      setResults(payload.evidence);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "VI Guide could not search the live catalog.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search();
  }

  function toggleSaved(item: EvidenceItem) {
    const key = `${item.type}:${item.href}`;
    setSaved((current) => {
      const exists = current.some((entry) => `${entry.type}:${entry.href}` === key);
      return exists
        ? current.filter((entry) => `${entry.type}:${entry.href}` !== key)
        : [item, ...current].slice(0, 24);
    });
  }

  const conciergeHref = `/map?concierge=open&prompt=${encodeURIComponent(
    submittedQuery || query || `Plan a day on ${islandLabel}`,
  )}&island=${island}`;

  const savedPlanHref = `/map?concierge=open&prompt=${encodeURIComponent(
    `Build a practical island plan around these saved places: ${saved
      .map((item) => item.name)
      .join(", ")}. Include timing, transportation, nearby food, and a backup option.`,
  )}&island=${island}`;

  return (
    <main className="min-h-screen bg-[#f3f7f5] text-slate-950">
      <section className="border-b border-slate-200 bg-[#062b35] text-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/75">
              <Sparkles size={13} /> Concierge Discovery
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
              Describe the island day you want.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Search beaches, places, stays, and heritage. Save the destinations that
              fit, then hand the complete shortlist to the Concierge for a practical plan.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.07] p-3 shadow-2xl backdrop-blur">
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
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Compass size={17} />}
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

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {saved.length ? (
          <section className="mb-8 rounded-[30px] border border-teal-200 bg-teal-50/80 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
                  Saved for this trip · {saved.length}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                  Your island shortlist
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSaved([])}
                  className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-white px-4 py-3 text-xs font-extrabold text-teal-900"
                >
                  <Trash2 size={14} /> Clear
                </button>
                <Link
                  href={savedPlanHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#073542] px-4 py-3 text-xs font-extrabold text-white"
                >
                  <Sparkles size={14} /> Plan saved picks
                </Link>
              </div>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {saved.map((item) => (
                <div key={`${item.type}:${item.href}`} className="min-w-[230px] rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{item.name}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-teal-700">
                        {typeLabel(item.type)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSaved(item)}
                      aria-label={`Remove ${item.name} from saved picks`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Link href={item.href} className="mt-3 inline-flex text-xs font-extrabold text-teal-800">
                    View details →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}

        {!submittedQuery && !loading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">One territory-wide discovery layer</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em]">Search by the experience, not just the business name.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  Try atmosphere, accessibility, interests, timing, or the kind of day you want.
                </p>
              </div>
              <Link href={conciergeHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073542] px-5 py-3 text-sm font-extrabold text-white">
                <Sparkles size={16} /> Open Concierge
              </Link>
            </div>
          </div>
        ) : null}

        {submittedQuery ? (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-teal-700">{results.length} grounded matches · {islandLabel}</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">“{submittedQuery}”</h2>
            </div>
            <Link href={conciergeHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073542] px-5 py-3 text-sm font-extrabold text-white shadow-sm">
              <Sparkles size={16} /> Build the full plan
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className="grid min-h-72 place-items-center rounded-[32px] border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-teal-700" />
              <p className="mt-3 text-sm font-bold text-slate-500">Ranking the live VI Guide catalog…</p>
            </div>
          </div>
        ) : null}

        {!loading && submittedQuery && !results.length && !error ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center">
            <h3 className="text-xl font-black">No strong catalog match yet</h3>
            <p className="mt-2 text-sm text-slate-500">Broaden the description or ask the Concierge to build a plan from nearby options.</p>
          </div>
        ) : null}

        {!loading && results.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((item) => {
              const Icon = iconForType(item.type);
              const isSaved = savedKeys.has(`${item.type}:${item.href}`);
              return (
                <article key={`${item.type}:${item.href}`} className="flex flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-800"><Icon size={19} /></span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{typeLabel(item.type)}</span>
                      <button
                        type="button"
                        onClick={() => toggleSaved(item)}
                        aria-label={`${isSaved ? "Remove" : "Save"} ${item.name}`}
                        className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isSaved ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                      >
                        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-4 text-xl font-black tracking-[-0.025em]">{item.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <Link href={item.href} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#073542] px-4 py-3 text-xs font-extrabold text-white">View details</Link>
                    <Link
                      href={`/map?concierge=open&prompt=${encodeURIComponent(`Plan a complete island experience around ${item.name} on ${islandLabel}, including transportation, nearby places, timing, and a backup option.`)}&island=${island}`}
                      aria-label={`Plan around ${item.name}`}
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 text-teal-800 hover:bg-teal-50"
                    >
                      <Sparkles size={16} />
                    </Link>
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

function iconForType(type: EvidenceType) {
  if (type === "beach") return Waves;
  if (type === "stay") return BedDouble;
  if (type === "historic") return Landmark;
  return MapPin;
}

function typeLabel(type: EvidenceType) {
  if (type === "historic") return "Heritage";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

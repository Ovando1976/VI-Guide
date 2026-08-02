import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Crown,
  Landmark,
  Map as MapIcon,
  MapPin,
  Search,
  Sparkles,
  Waves,
} from "lucide-react";

import { TERRITORY_TIMELINE_EVENTS } from "@/data/heritage/territory-timeline";
import { USVI_GOVERNORS } from "@/data/heritage/usvi-governors";
import { buildDirectoryMapHref } from "@/lib/discovery/map-links";
import { getTravelKnowledge, type TravelKnowledgeKind } from "@/lib/travel-knowledge";
import type { DirectoryItem } from "@/types/directory";
import type { TerritoryMapPlaceType } from "@/types/territory-map";

type SearchKind = "all" | TravelKnowledgeKind | "timeline" | "governors";

type DirectoryResult = {
  type: "directory";
  item: DirectoryItem;
  kind: TravelKnowledgeKind;
  score: number;
};

type HeritageResult = {
  type: "heritage";
  id: string;
  title: string;
  summary: string;
  label: string;
  href: string;
  island: string;
  kind: "timeline" | "governors";
  tags: string[];
  score: number;
};

type Result = DirectoryResult | HeritageResult;

const KINDS: Array<{ value: SearchKind; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "places", label: "Places" },
  { value: "beaches", label: "Beaches" },
  { value: "stays", label: "Stays" },
  { value: "historic", label: "Historic places" },
  { value: "timeline", label: "Timeline" },
  { value: "governors", label: "Governors" },
];

const KIND_CONFIG: Record<
  TravelKnowledgeKind,
  {
    label: string;
    href: (slug: string) => string;
    icon: typeof MapPin;
    mapType: TerritoryMapPlaceType;
    lens: string;
  }
> = {
  places: {
    label: "Place",
    href: (slug) => `/places/${slug}`,
    icon: MapPin,
    mapType: "place",
    lens: "places",
  },
  beaches: {
    label: "Beach",
    href: (slug) => `/beaches/${slug}`,
    icon: Waves,
    mapType: "beach",
    lens: "beaches",
  },
  stays: {
    label: "Stay",
    href: (slug) => `/accommodations/${slug}`,
    icon: BedDouble,
    mapType: "stay",
    lens: "stays",
  },
  historic: {
    label: "Historic place",
    href: (slug) => `/historic/${slug}`,
    icon: Landmark,
    mapType: "historic",
    lens: "historic",
  },
};

type SearchParams = {
  q?: string;
  kind?: string;
  type?: string;
  island?: string;
};

export default function SearchPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const query = clean(searchParams.q);
  const requestedKind = searchParams.kind ?? searchParams.type;
  const selectedKind = isKind(requestedKind) ? requestedKind : "all";
  const island = normalizeIsland(searchParams.island);
  const results = searchEverything(query, selectedKind, island).slice(0, 80);
  const mapHref = buildSearchMapHref(query, selectedKind, island);

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <section className="border-b border-white/10 bg-[linear-gradient(145deg,#032f2d_0%,#075e58_62%,#0f8d83_100%)] px-4 py-8 text-white sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/70">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="mt-9 grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-[#f5c451]"><Search className="h-4 w-4" /> Territory search</div>
              <h1 className="mt-4 text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl">Search the whole territory,<br /><span className="font-serif font-medium italic text-[#8ce7db]">not separate modules.</span></h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/70">Search beaches, stays, local places, historic sites, timeline events, and governors together, then continue into maps, rides, and Concierge planning.</p>
            </div>

            <form action="/search" method="get" className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-[0_24px_60px_rgba(0,0,0,.2)] backdrop-blur">
              <label htmlFor="territory-search" className="sr-only">Search the Virgin Islands</label>
              <div className="flex min-h-14 items-center gap-3 rounded-full bg-white px-5 text-[#043331]">
                <Search className="h-5 w-5 shrink-0 text-teal-700" />
                <input id="territory-search" name="q" defaultValue={query} autoFocus placeholder="Beach, governor, hotel, event, landmark…" className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-slate-400" />
                {selectedKind !== "all" ? <input type="hidden" name="kind" value={selectedKind} /> : null}
                {island ? <input type="hidden" name="island" value={island} /> : null}
                <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5b942] text-[#043331]" aria-label="Search"><ArrowRight className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {KINDS.map((entry) => {
                  const params = new URLSearchParams();
                  if (query) params.set("q", query);
                  if (entry.value !== "all") params.set("kind", entry.value);
                  if (island) params.set("island", island);
                  return <Link key={entry.value} href={`/search?${params.toString()}`} className={`rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.16em] transition ${selectedKind === entry.value ? "bg-[#f5c451] text-[#043331]" : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"}`}>{entry.label}</Link>;
                })}
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">{query ? `Results for “${query}”` : "Explore the territory"}</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">{results.length} connected {results.length === 1 ? "result" : "results"}</h2>
          </div>
          <Link href={mapHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] shadow-sm"><MapIcon className="h-4 w-4" /> See on map <ArrowRight className="h-4 w-4" /></Link>
        </div>

        {results.length ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((result) => result.type === "directory" ? (
              <DirectoryResultCard key={`${result.kind}:${result.item.id}`} item={result.item} kind={result.kind} />
            ) : (
              <HeritageResultCard key={`${result.kind}:${result.id}`} result={result} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <Sparkles className="h-7 w-7 text-teal-700" />
            <h2 className="mt-4 text-2xl font-black">No exact match yet.</h2>
            <p className="mt-3 max-w-xl font-semibold leading-7 text-slate-600">Try a broader term, switch back to Everything, or ask the Concierge to build a recommendation around what you are trying to do.</p>
            <Link href={`/concierge?prompt=${encodeURIComponent(`Help me find ${query || "a place to visit"} in the U.S. Virgin Islands.`)}`} className="mt-6 inline-flex rounded-full bg-[#043331] px-6 py-3 text-[10px] font-black uppercase tracking-[.17em] text-white">Ask Concierge</Link>
          </div>
        )}
      </section>
    </main>
  );
}

function DirectoryResultCard({ item, kind }: { item: DirectoryItem; kind: TravelKnowledgeKind }) {
  const config = KIND_CONFIG[kind];
  const Icon = config.icon;
  const detailHref = config.href(item.slug);
  const mapHref = buildDirectoryMapHref(item, config.mapType);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl">
      <Link href={detailHref} className="block">
        <div className="relative h-52 bg-[#dce9e5] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,transparent 45%,rgba(3,47,45,.68)),url('${item.heroImage}')` }}>
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-[#043331] shadow-sm backdrop-blur"><Icon className="h-3.5 w-3.5" /> {config.label}</span>
          <span className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-[.18em] text-white">{formatIsland(item.island)}</span>
        </div>
      </Link>
      <div className="p-6">
        <Link href={detailHref} className="block">
          <h3 className="text-2xl font-black tracking-[-.035em]">{item.name}</h3>
          <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{item.description}</p>
        </Link>
        <div className="mt-5 flex flex-wrap gap-2">{[item.category, ...item.tags].filter(Boolean).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[#edf6f2] px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-[#075e58]">{tag}</span>)}</div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <Link href={detailHref} className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white">Open details <ArrowRight className="h-4 w-4" /></Link>
          <Link href={mapHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] text-teal-800"><MapIcon className="h-4 w-4" /> View on map</Link>
        </div>
      </div>
    </article>
  );
}

function HeritageResultCard({ result }: { result: HeritageResult }) {
  const Icon = result.kind === "governors" ? Crown : CalendarDays;
  return (
    <Link href={result.href} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl">
      <div className="flex h-40 items-center justify-center bg-[radial-gradient(circle_at_25%_20%,rgba(245,196,81,.28),transparent_35%),linear-gradient(145deg,#043331,#087069)] text-white">
        <div className="text-center">
          <Icon className="mx-auto h-8 w-8 text-[#f5c451]" />
          <p className="mt-3 text-[10px] font-black uppercase tracking-[.18em] text-white/65">{result.kind === "governors" ? "Governor record" : "Timeline event"}</p>
          <p className="mt-1 text-xl font-black">{result.label}</p>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-black tracking-[-.035em]">{result.title}</h3>
        <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-slate-600">{result.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2">{result.tags.filter(Boolean).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[#edf6f2] px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-[#075e58]">{tag}</span>)}</div>
        <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-teal-800">Open record <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

function searchEverything(query: string, selectedKind: SearchKind, island: string | null): Result[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: Result[] = [];
  const includeDirectory = selectedKind === "all" || ["places", "beaches", "stays", "historic"].includes(selectedKind);

  if (includeDirectory) {
    const kinds: TravelKnowledgeKind[] = selectedKind === "all" ? ["places", "beaches", "stays", "historic"] : [selectedKind as TravelKnowledgeKind];
    for (const kind of kinds) {
      for (const item of getTravelKnowledge(kind)) {
        if (island && item.island !== island) continue;
        const score = scoreText([item.name, item.category, item.description, item.address, ...item.tags], terms, Boolean(item.featured));
        if (query && score <= 0) continue;
        results.push({ type: "directory", item, kind, score });
      }
    }
  }

  if (selectedKind === "all" || selectedKind === "timeline") {
    for (const event of TERRITORY_TIMELINE_EVENTS) {
      if (island && event.island !== island && event.island !== "territory") continue;
      const score = scoreText([event.title, event.summary, event.dateLabel, String(event.year), ...event.tags], terms);
      if (query && score <= 0) continue;
      results.push({
        type: "heritage",
        id: event.id,
        title: event.title,
        summary: event.summary,
        label: event.dateLabel,
        href: `/heritage/timeline#${event.id}`,
        island: event.island,
        kind: "timeline",
        tags: event.tags,
        score,
      });
    }
  }

  if (selectedKind === "all" || selectedKind === "governors") {
    for (const governor of USVI_GOVERNORS) {
      const score = scoreText([governor.name, governor.title, governor.termLabel, governor.party, governor.appointedBy, governor.summary, ...governor.milestones], terms);
      if (query && score <= 0) continue;
      results.push({
        type: "heritage",
        id: governor.id,
        title: governor.name,
        summary: governor.summary,
        label: governor.termLabel,
        href: `/heritage/governors#${governor.id}`,
        island: "territory",
        kind: "governors",
        tags: [governor.title, governor.party ?? "", ...governor.milestones],
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || getResultTitle(a).localeCompare(getResultTitle(b)));
}

function buildSearchMapHref(query: string, selectedKind: SearchKind, island: string | null) {
  const params = new URLSearchParams();
  if (island) params.set("island", island);
  if (query) params.set("q", query);
  if (selectedKind in KIND_CONFIG) {
    params.set("lens", KIND_CONFIG[selectedKind as TravelKnowledgeKind].lens);
  } else if (selectedKind === "timeline" || selectedKind === "governors") {
    params.set("lens", "historic");
  }
  const suffix = params.toString();
  return suffix ? `/map?${suffix}` : "/map";
}

function scoreText(values: Array<string | null | undefined>, terms: string[], featured = false) {
  if (!terms.length) return featured ? 10 : 1;
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const title = (values[0] ?? "").toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title === term) score += 40;
    else if (title.includes(term)) score += 18;
    if (text.includes(term)) score += 6;
  }
  return score;
}

function getResultTitle(result: Result) {
  return result.type === "directory" ? result.item.name : result.title;
}

function isKind(value: string | undefined): value is SearchKind {
  return value === "all" || value === "places" || value === "beaches" || value === "stays" || value === "historic" || value === "timeline" || value === "governors";
}

function normalizeIsland(value: string | undefined) {
  const normalized = clean(value).toLowerCase();
  return normalized === "stt" || normalized === "stj" || normalized === "stx" ? normalized : null;
}

function formatIsland(island: string) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  return "St. Croix";
}

function clean(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

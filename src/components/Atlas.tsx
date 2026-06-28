import {
  Archive,
  BookOpen,
  Building2,
  Compass,
  Database,
  Filter,
  Landmark,
  MapPinned,
  Mountain,
  Route,
  Search,
  ShipWheel,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { atlasMetadata, atlasRecords } from "../data/atlas/masterAtlas";

type AtlasRouteKey = "overview" | "history" | "archives" | "knowledge" | "map";
type AtlasRoutes = Partial<Record<AtlasRouteKey, string>>;

type AtlasRecord = {
  id: string;
  name: string;
  type: string;
  island: string;
  sources?: readonly string[];
  source?: string;
  aliases: readonly string[];
  description?: string;
  routes: AtlasRoutes;
};

type AtlasCategory =
  | "all"
  | "places"
  | "estates"
  | "historic"
  | "dictionary"
  | "water"
  | "natural"
  | "routes";

const records = atlasRecords as unknown as readonly AtlasRecord[];

const OFFICIAL_ESTATE_COUNT = Number(atlasMetadata.bySource.estates ?? 420);

const ROUTE_LABELS: Record<AtlasRouteKey, string> = {
  overview: "Overview",
  history: "History",
  archives: "Archives",
  knowledge: "Knowledge",
  map: "Map",
};

const ROUTE_ORDER: AtlasRouteKey[] = [
  "overview",
  "history",
  "archives",
  "knowledge",
  "map",
];

const CATEGORIES: {
  value: AtlasCategory;
  label: string;
  icon: LucideIcon;
  types: readonly string[];
}[] = [
  {
    value: "all",
    label: "All",
    icon: Database,
    types: [],
  },
  {
    value: "places",
    label: "Places",
    icon: MapPinned,
    types: ["town", "island", "point", "port", "market", "government_office"],
  },
  {
    value: "estates",
    label: "Estates",
    icon: Building2,
    types: ["estate"],
  },
  {
    value: "historic",
    label: "Historic",
    icon: Landmark,
    types: [
      "historic",
      "historic-steps",
      "historic-building",
      "historic-park",
      "historic-house",
      "historic-district",
      "plantation-ruins",
      "plantation-site",
      "plantation-museum",
      "archaeological-site",
      "sugar-works",
      "sugar-mill",
      "fort",
      "church",
      "synagogue",
      "battery",
      "tower",
      "monument",
      "botanical-garden",
      "government-building",
      "civic-building",
      "school",
    ],
  },
  {
    value: "dictionary",
    label: "Dictionary",
    icon: BookOpen,
    types: ["dictionaryEntry", "Danish West Indies Archives"],
  },
  {
    value: "water",
    label: "Water",
    icon: ShipWheel,
    types: ["bay", "beach", "cay", "island"],
  },
  {
    value: "natural",
    label: "Natural",
    icon: Mountain,
    types: ["hill", "gut", "point", "island", "cay"],
  },
  {
    value: "routes",
    label: "Routes",
    icon: Route,
    types: ["road"],
  },
];

function label(value: unknown): string {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function titleCase(value: unknown): string {
  return label(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sourceLabel(item: AtlasRecord): string {
  const sources = item.sources?.length
    ? [...item.sources]
    : item.source
      ? [item.source]
      : [];

  return sources.length ? sources.join(", ") : "atlas";
}

function hasSource(item: AtlasRecord, source: string): boolean {
  return Boolean(item.sources?.includes(source) || item.source === source);
}

function searchableText(item: AtlasRecord): string {
  return [
    item.name,
    item.type,
    item.island,
    item.description,
    sourceLabel(item),
    ...item.aliases,
  ]
    .join(" ")
    .toLowerCase();
}

function typeCount(type: string): number {
  return Number((atlasMetadata.byType as Record<string, number>)[type] ?? 0);
}

function categoryCount(category: AtlasCategory): number {
  if (category === "all") return records.length;
  if (category === "estates") return OFFICIAL_ESTATE_COUNT;

  const found = CATEGORIES.find((item) => item.value === category);
  if (!found) return 0;

  return found.types.reduce((total, type) => total + typeCount(type), 0);
}

function matchesCategory(item: AtlasRecord, category: AtlasCategory): boolean {
  if (category === "all") return true;
  if (category === "estates") return hasSource(item, "estates");

  const found = CATEGORIES.find((entry) => entry.value === category);
  if (!found) return true;

  return found.types.includes(item.type);
}

function bestRoute(item: AtlasRecord): string | undefined {
  for (const key of ROUTE_ORDER) {
    const path = item.routes[key];
    if (path) return path;
  }

  return undefined;
}

function bySearchRelevance(query: string) {
  const q = query.trim().toLowerCase();

  return (a: AtlasRecord, b: AtlasRecord) => {
    if (!q) return a.name.localeCompare(b.name);

    const an = a.name.toLowerCase();
    const bn = b.name.toLowerCase();

    const aExact = an === q ? 1 : 0;
    const bExact = bn === q ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const aStarts = an.startsWith(q) ? 1 : 0;
    const bStarts = bn.startsWith(q) ? 1 : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;

    const aAlias = a.aliases.some((alias) => alias.toLowerCase() === q) ? 1 : 0;
    const bAlias = b.aliases.some((alias) => alias.toLowerCase() === q) ? 1 : 0;
    if (aAlias !== bAlias) return bAlias - aAlias;

    return a.name.localeCompare(b.name);
  };
}

function categoryLabel(category: AtlasCategory): string {
  if (category === "all") return "atlas";
  return category;
}

function routeButtonClass(routeKey: AtlasRouteKey): string {
  if (routeKey === "overview") return "bg-white/10 text-white hover:bg-white/20";
  if (routeKey === "history") return "bg-amber-100/15 text-amber-100 hover:bg-amber-100 hover:text-amber-950";
  if (routeKey === "archives") return "bg-orange-100/15 text-orange-100 hover:bg-orange-100 hover:text-orange-950";
  if (routeKey === "knowledge") return "bg-emerald-100/15 text-emerald-100 hover:bg-emerald-100 hover:text-emerald-950";
  return "bg-cyan-100/15 text-cyan-100 hover:bg-cyan-100 hover:text-cyan-950";
}

export default function Atlas() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialQuery = params.get("context") || params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<AtlasCategory>("all");

  const categoryTotal = categoryCount(activeCategory);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return records
      .filter((item) => {
        if (!matchesCategory(item, activeCategory)) return false;
        if (!q) return true;
        return searchableText(item).includes(q);
      })
      .sort(bySearchRelevance(query))
      .slice(0, 300);
  }, [activeCategory, query]);

  const canClear = Boolean(query.trim()) || activeCategory !== "all";

  function clearSearch() {
    setQuery("");
    setActiveCategory("all");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl overflow-x-hidden bg-[#020617] px-4 py-6 pb-[calc(170px+env(safe-area-inset-bottom))] text-white">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300">
          VI Guide Atlas
        </p>

        <h1 className="mt-3 font-serif text-5xl font-black tracking-tight">
          Historical Atlas
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          The master index for estates, historic sites, bays, cays, roads,
          dictionary entries, archive records, and geographic knowledge across
          the U.S. Virgin Islands.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Canonical records" value={atlasMetadata.totalRecords} />
          <Stat
            label="Merged duplicates"
            value={
              "mergedDuplicates" in atlasMetadata
                ? Number(atlasMetadata.mergedDuplicates)
                : 0
            }
          />
          <Stat
            label="Feature types"
            value={Object.keys(atlasMetadata.byType).length}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Official Estates" value={OFFICIAL_ESTATE_COUNT} />
          <MetricCard
            label="Dictionary"
            value={typeCount("dictionaryEntry")}
          />
          <MetricCard
            label="Water Features"
            value={typeCount("bay") + typeCount("beach") + typeCount("cay")}
          />
          <MetricCard
            label="Historic Records"
            value={categoryCount("historic")}
          />
        </div>
      </section>

      <section className="sticky top-0 z-20 mt-5 rounded-3xl border border-white/10 bg-[#020617]/90 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search estates, bays, cays, towns, roads..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />

          {canClear ? (
            <button
              type="button"
              onClick={clearSearch}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Clear atlas search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = activeCategory === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                  active
                    ? "bg-cyan-300 text-slate-950"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {category.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] ${
                    active ? "bg-slate-950/10" : "bg-white/10"
                  }`}
                >
                  {categoryCount(category.value).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-slate-400">
          <p>
            Showing <span className="text-cyan-300">{results.length}</span> of{" "}
            <span className="text-cyan-300">
              {categoryTotal.toLocaleString()}
            </span>{" "}
            {categoryLabel(activeCategory)} records
          </p>

          {query.trim() ? (
            <p>
              Search: <span className="text-white">{query.trim()}</span>
            </p>
          ) : null}
        </div>
      </section>

      {results.length > 0 ? (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const openPath = bestRoute(item);

            return (
              <article
                key={item.id}
                className="group rounded-[1.6rem] border border-white/10 bg-white/5 p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                      {titleCase(item.type)}
                    </p>

                    <h2 className="mt-2 font-serif text-2xl font-black leading-tight">
                      {item.name}
                    </h2>

                    <p className="mt-1 text-xs font-bold capitalize text-slate-400">
                      {titleCase(item.island)}
                    </p>
                  </div>

                  <span className="max-w-[9rem] shrink-0 truncate rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                    {sourceLabel(item)}
                  </span>
                </div>

                {item.aliases.length > 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    <span className="text-slate-500">Aliases:</span>{" "}
                    {item.aliases.slice(0, 4).join(", ")}
                  </p>
                ) : null}

                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-400">
                  {item.description ||
                    "Historical atlas record ready for enrichment."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {ROUTE_ORDER.map((routeKey) => {
                    const path = item.routes[routeKey];
                    if (!path) return null;

                    return (
                      <SmallButton
                        key={routeKey}
                        label={ROUTE_LABELS[routeKey]}
                        className={routeButtonClass(routeKey)}
                        onClick={() => navigate(path)}
                      />
                    );
                  })}
                </div>

                {openPath ? (
                  <button
                    type="button"
                    onClick={() => navigate(openPath)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-200"
                  >
                    <Compass className="h-4 w-4" />
                    Open Record
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
            <Filter className="h-5 w-5 text-cyan-300" />
          </div>

          <h2 className="mt-4 text-xl font-black text-white">
            No atlas records matched
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            Clear the search or switch back to All to continue exploring the
            master atlas.
          </p>

          <button
            type="button"
            onClick={clearSearch}
            className="mt-5 rounded-2xl bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950"
          >
            Clear Filters
          </button>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-black/30 p-4">
      <div className="text-3xl font-black">{value.toLocaleString()}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-2xl font-black">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function SmallButton({
  label,
  className,
  onClick,
}: {
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${className}`}
    >
      {label}
    </button>
  );
}
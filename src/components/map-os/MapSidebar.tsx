import { ChevronRight, Menu } from "lucide-react";

import type { IslandCode } from "../../types";
import IslandHeroCard from "./IslandHeroCard";
import MapSearchBar from "./MapSearchBar";
import type { SearchItem, SearchTab } from "./mapTypes";
import { getIcon, getTagTone } from "./mapUtils";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  currentIsland: string;
  selectedIsland: IslandCode;
  searchTab: SearchTab;
  setSearchTab: (tab: SearchTab) => void;
  counts: Record<SearchTab, number>;
  results: SearchItem[];
  onSelectItem: (item: SearchItem) => void;
};

export default function MapSidebar({
  search,
  setSearch,
  currentIsland,
  selectedIsland,
  searchTab,
  setSearchTab,
  counts,
  results,
  onSelectItem,
}: Props) {
  return (
    <aside className="absolute left-4 top-[86px] z-40 flex h-[calc(100dvh-7.8rem)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#050b18]/88 shadow-[0_30px_90px_rgba(0,0,0,0.58)] ring-1 ring-white/5 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.2),transparent_26%),radial-gradient(circle_at_0%_20%,rgba(34,211,238,0.12),transparent_24%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-white/75 shadow-xl transition hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>

          <MapSearchBar search={search} setSearch={setSearch} />
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <IslandHeroCard
            currentIsland={currentIsland}
            selectedIsland={selectedIsland}
            counts={counts}
          />

          <section className="mt-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
              Geographic Index
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black">
              {currentIsland}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/58">
              Search estates, beaches, businesses, parcels, ferries, historic
              sites, archive records, and dictionary entries.
            </p>
          </section>

          <SearchTabs
            searchTab={searchTab}
            setSearchTab={setSearchTab}
            counts={counts}
          />

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-white/45">
              Index Results
            </p>

            <button type="button" className="text-xs font-black text-emerald-300">
              View all
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {results.length ? (
              results.slice(0, 16).map((item) => (
                <SearchResultRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onClick={() => onSelectItem(item)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 text-sm text-white/55">
                No indexed results found yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SearchTabs({
  searchTab,
  setSearchTab,
  counts,
}: {
  searchTab: SearchTab;
  setSearchTab: (tab: SearchTab) => void;
  counts: Record<SearchTab, number>;
}) {
  const tabs: Array<[SearchTab, string]> = [
    ["all", "All"],
    ["estates", "Estates"],
    ["places", "Places"],
    ["parcels", "Parcels"],
  ];

  return (
    <div className="mt-4 grid grid-cols-4 gap-1 rounded-3xl border border-white/10 bg-slate-950/55 p-1">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setSearchTab(key)}
          className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition ${
            searchTab === key
              ? "bg-emerald-400 text-[#022c22] shadow-lg"
              : "text-white/55 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {label}
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px]">
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}

function SearchResultRow({
  item,
  onClick,
}: {
  item: SearchItem;
  onClick: () => void;
}) {
  const Icon = getIcon(item.type);
  const tone = getTagTone(item.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.055] p-3 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-white/[0.085]"
    >
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${tone}`}>
        <Icon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-black text-white">{item.name}</p>
        <p className="mt-1 truncate text-xs font-semibold text-white/42">
          {item.subtitle}
        </p>
      </div>

      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${tone}`}>
        {item.type}
      </span>

      <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
    </button>
  );
}
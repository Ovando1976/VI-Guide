"use client";

import {
  useMemo,
  useState } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Search,
  Sparkles,
  UtensilsCrossed,
  Waves,
  BedDouble,
  Landmark,
} from "lucide-react";

import { DirectoryCard } from "@/components/directory/directory-card";
import { EmptyState } from "@/components/directory/empty-state";
import { IslandFilterTabs } from "@/components/directory/island-filter-tabs";
import type { DirectoryIsland, DirectoryItem } from "@/types/directory";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  items: DirectoryItem[];
  basePath: string;
  iconName: "waves" | "utensils-crossed" | "bed-double" | "landmark";
  categoryLabel?: string;
};

const DESTINATIONS: Array<{
  island: DirectoryIsland;
  name: string;
  caption: string;
}> = [
  { island: "stt", name: "St. Thomas", caption: "Harbor life, beaches, dining, and island energy" },
  { island: "stj", name: "St. John", caption: "National park coastlines and ferry-first adventures" },
  { island: "stx", name: "St. Croix", caption: "Historic towns, broad beaches, and local culture" },
];

export function DiscoveryDirectoryPage({
  eyebrow,
  title,
  description,
  items,
  basePath,
  iconName,
  categoryLabel = "Experience",
}: Props) {
    const Icon =
    iconName === "waves"
      ? Waves
      : iconName === "bed-double"
        ? BedDouble
        : iconName === "landmark"
          ? Landmark
          : UtensilsCrossed;
const [island, setIsland] = useState<DirectoryIsland | "all">("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const islandMatch = island === "all" || item.island === island;
      const categoryMatch = category === "all" || item.category === category;
      const text = [item.name, item.description, item.category, ...item.tags]
        .join(" ")
        .toLowerCase();
      return islandMatch && categoryMatch && (!needle || text.includes(needle));
    });
  }, [category, island, items, query]);

  const featured = useMemo(
    () => items.filter((item) => item.featured).slice(0, 6),
    [items]
  );

  return (
    <main className="directory-page min-h-screen bg-[#f8f4ea] px-4 py-5 pb-32 text-[#043331] sm:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#043331_0%,#075b58_58%,#13a89e_100%)] text-white shadow-[0_28px_70px_rgba(4,51,49,.18)]">
          <div className="grid gap-8 px-6 py-9 sm:px-9 lg:grid-cols-[1.15fr_.85fr] lg:px-12 lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.3em] text-[#f5c451]">
                <Icon className="h-4 w-4" /> {eyebrow}
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/72">
                {description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em]">
                  Local guide built in
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em]">
                  Works without Firestore
                </span>
              </div>
            </div>

            <div className="self-end rounded-[28px] border border-white/15 bg-black/10 p-5 backdrop-blur">
              <label className="text-[10px] font-black uppercase tracking-[.2em] text-white/65" htmlFor="directory-search">
                What are you looking for?
              </label>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="directory-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${eyebrow.toLowerCase()}...`}
                  className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-base font-semibold text-[#043331] outline-none ring-2 ring-transparent transition focus:ring-[#f5c451]"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.25em] text-amber-600">Choose an island</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Start with a destination</h2>
            </div>
            <IslandFilterTabs value={island} onChange={setIsland} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {DESTINATIONS.map((destination) => {
              const active = island === destination.island;
              return (
                <button
                  type="button"
                  key={destination.island}
                  onClick={() => setIsland(active ? "all" : destination.island)}
                  className={`rounded-[26px] border p-5 text-left transition ${active ? "border-[#0f766e] bg-[#043331] text-white shadow-lg" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-700"}`}
                >
                  <MapPin className={`h-5 w-5 ${active ? "text-[#f5c451]" : "text-teal-700"}`} />
                  <strong className="mt-4 block text-xl">{destination.name}</strong>
                  <span className={`mt-2 block text-sm font-semibold leading-6 ${active ? "text-white/65" : "text-slate-500"}`}>{destination.caption}</span>
                </button>
              );
            })}
          </div>
        </section>

        {featured.length && island === "all" && !query ? (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]"><Sparkles className="h-5 w-5" /></span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">Recommended</div>
                <h2 className="text-3xl font-black tracking-[-.04em]">Island favorites to begin with</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((item) => <DirectoryCard key={item.id} item={item} href={`${basePath}/${item.slug}`} eyebrow="Recommended" />)}
            </div>
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">Browse the guide</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Find the right {categoryLabel.toLowerCase()}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Curated public travel knowledge loads instantly from the app.</p>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label={`${categoryLabel} type`}>
              {["all", ...categories].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[.15em] transition ${category === value ? "border-[#043331] bg-[#043331] text-white" : "border-slate-200 bg-white text-slate-500 hover:border-teal-700"}`}
                >
                  {value === "all" ? "All types" : value}
                </button>
              ))}
            </div>
          </div>

          {filtered.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => <DirectoryCard key={item.id} item={item} href={`${basePath}/${item.slug}`} eyebrow={item.category} />)}
            </div>
          ) : (
            <EmptyState title="Nothing matched that search" description="Try a broader term, another category, or another island." />
          )}
        </section>

        <section className="rounded-[30px] bg-[#043331] p-7 text-white sm:p-9">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]"><Compass className="h-4 w-4" /> Need a complete day?</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Let the concierge connect the pieces.</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">Combine beaches, dining, stays, history, and transportation into one practical island plan.</p>
            </div>
            <Link href="/?concierge=open" className="inline-flex items-center justify-center rounded-full bg-[#f5c451] px-6 py-4 text-[10px] font-black uppercase tracking-[.18em] text-[#043331]">Plan with concierge</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Compass,
  Landmark,
  MapPin,
  Route,
  Search,
  Sparkles,
  UtensilsCrossed,
  Waves,
  X,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { ViPublicFooter } from "@/components/brand/vi-public-footer";
import { DirectoryCard } from "@/components/directory/directory-card";
import { EmptyState } from "@/components/directory/empty-state";
import { IslandFilterTabs } from "@/components/directory/island-filter-tabs";
import {
  normalizeActiveIsland,
  readActiveIsland,
  writeActiveIsland,
} from "@/lib/active-island";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";
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
  {
    island: "stt",
    name: "St. Thomas",
    caption: "Harbor life, beaches, dining, and island energy",
  },
  {
    island: "stj",
    name: "St. John",
    caption: "National park coastlines and ferry-first adventures",
  },
  {
    island: "stx",
    name: "St. Croix",
    caption: "Historic towns, broad beaches, and local culture",
  },
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
  const [savedStopCount, setSavedStopCount] = useState(0);

  useEffect(() => {
    const requested = normalizeActiveIsland(
      new URLSearchParams(window.location.search).get("island"),
    );
    setIsland(requested ?? readActiveIsland());
  }, []);

  useEffect(() => {
    if (island !== "all") writeActiveIsland(island);
  }, [island]);

  useEffect(() => {
    function refreshTripCount() {
      setSavedStopCount(
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

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
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
    [items],
  );
  const heroItem = featured[0] ?? items[0];
  const destinationItems = useMemo(
    () =>
      Object.fromEntries(
        DESTINATIONS.map((destination) => [
          destination.island,
          items.find(
            (item) => item.island === destination.island && item.featured,
          ) ?? items.find((item) => item.island === destination.island),
        ]),
      ) as Partial<Record<DirectoryIsland, DirectoryItem>>,
    [items],
  );
  const islandCounts = useMemo(
    () =>
      items.reduce(
        (counts, item) => ({
          ...counts,
          [item.island]: counts[item.island] + 1,
        }),
        { stt: 0, stj: 0, stx: 0 } as Record<DirectoryIsland, number>,
      ),
    [items],
  );

  const hasFilters = island !== "all" || category !== "all" || Boolean(query.trim());

  function clearFilters() {
    setIsland("all");
    setCategory("all");
    setQuery("");
  }

  return (
    <main className="directory-page min-h-screen overflow-hidden bg-[#f8f4ea] px-4 pt-5 text-[#043331] sm:px-6 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 lg:space-y-10">
        <ViPublicHeader
          actionHref="/trips"
          actionLabel={`My Trip · ${savedStopCount}`}
          actionIcon={Route}
          secondaryHref="/"
          secondaryLabel="Home"
        />

        <section className="relative min-h-[34rem] overflow-hidden rounded-[34px] bg-[#043331] text-white shadow-[0_28px_70px_rgba(4,51,49,.22)]">
          {heroItem ? (
            <Image
              src={heroItem.heroImage}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,38,37,.97)_0%,rgba(3,51,49,.88)_43%,rgba(3,51,49,.44)_72%,rgba(3,51,49,.24)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,51,49,.7)_0%,transparent_52%)]" />
          <div className="relative grid min-h-[34rem] gap-8 px-6 py-9 sm:px-9 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-12 lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-2 text-[10px] font-black uppercase tracking-[.3em] text-[#f5c451] backdrop-blur">
                <Icon className="h-4 w-4" /> {eyebrow}
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.055em] drop-shadow-sm sm:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/80">
                {description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/20 bg-black/15 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur">
                  {items.length} verified guide entries
                </span>
                <span className="rounded-full border border-white/20 bg-black/15 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur">
                  Three islands · one connected trip
                </span>
                <Link
                  href={island === "all" ? "/concierge" : `/concierge?island=${island}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-[#043331] shadow-lg transition hover:bg-[#ffca55]"
                >
                  <Sparkles className="h-4 w-4" /> Ask VI Concierge
                </Link>
              </div>
            </div>

            <div className="self-end rounded-[28px] border border-white/20 bg-[#032f2d]/72 p-5 shadow-2xl backdrop-blur-md lg:self-center">
              <label
                className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]"
                htmlFor="directory-search"
              >
                What are you looking for?
              </label>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="directory-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${eyebrow.toLowerCase()}...`}
                  className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-12 text-base font-semibold text-[#043331] outline-none ring-2 ring-transparent transition focus:ring-[#f5c451]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#043331]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-center">
                  <strong className="block text-xl font-black">{filtered.length}</strong>
                  <span className="mt-1 block text-[8px] font-black uppercase tracking-[.13em] text-white/55">Matching now</span>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-center">
                  <strong className="block text-xl font-black">{featured.length}</strong>
                  <span className="mt-1 block text-[8px] font-black uppercase tracking-[.13em] text-white/55">Local favorites</span>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-center">
                  <strong className="block text-xl font-black">3</strong>
                  <span className="mt-1 block text-[8px] font-black uppercase tracking-[.13em] text-white/55">Islands</span>
                </div>
              </div>
              {heroItem ? (
                <Link href={`${basePath}/${heroItem.slug}`} className="mt-4 flex items-center justify-between rounded-2xl border border-white/12 bg-black/15 px-4 py-3 text-sm font-bold transition hover:bg-black/25">
                  <span className="line-clamp-1">Featured: {heroItem.name}</span>
                  <Compass className="h-4 w-4 text-[#f5c451]" />
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.25em] text-amber-600">
                Choose an island
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
                Start with a destination
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
                Compare the character and available choices on each island before narrowing the guide.
              </p>
            </div>
            <IslandFilterTabs value={island} onChange={setIsland} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {DESTINATIONS.map((destination) => {
              const active = island === destination.island;
              const imageItem = destinationItems[destination.island];
              return (
                <button
                  type="button"
                  key={destination.island}
                  onClick={() =>
                    setIsland(active ? "all" : destination.island)
                  }
                  className={`group relative min-h-[15rem] overflow-hidden rounded-[28px] border text-left text-white shadow-[0_14px_35px_rgba(4,51,49,.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(4,51,49,.2)] ${
                    active
                      ? "border-[#f5c451] ring-4 ring-[#f5c451]/30"
                      : "border-white/30"
                  }`}
                >
                  {imageItem ? (
                    <Image
                      src={imageItem.heroImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,38,37,.95)_0%,rgba(2,38,37,.2)_72%)]" />
                  <span className="relative flex min-h-[15rem] flex-col justify-end p-5">
                    <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] backdrop-blur">
                      {islandCounts[destination.island]} choices
                    </span>
                    <MapPin className={`h-5 w-5 ${active ? "text-[#f5c451]" : "text-white"}`} />
                    <strong className="mt-3 block text-2xl">{destination.name}</strong>
                    <span className="mt-2 block text-sm font-semibold leading-6 text-white/72">
                      {destination.caption}
                    </span>
                    <span className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-[#f5c451]">
                      {active ? "Showing this island" : "Explore this island"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {featured.length > 0 && island === "all" && !query ? (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">
                  Recommended
                </div>
                <h2 className="text-3xl font-black tracking-[-.04em]">
                  Island favorites to begin with
                </h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((item) => (
                <DirectoryCard
                  key={item.id}
                  item={item}
                  href={`${basePath}/${item.slug}`}
                  eyebrow="Recommended"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">
                Browse the guide
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
                Find the right {categoryLabel.toLowerCase()}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                <span>
                  {filtered.length} result{filtered.length === 1 ? "" : "s"} ready
                  to explore
                </span>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 font-black text-teal-800 hover:text-teal-950"
                  >
                    <X className="h-3.5 w-3.5" /> Clear filters
                  </button>
                ) : null}
              </div>
            </div>
            <div
              className="flex max-w-full gap-2 overflow-x-auto pb-1"
              aria-label={`${categoryLabel} type`}
            >
              {["all", ...categories].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[.15em] transition ${
                    category === value
                      ? "border-[#043331] bg-[#043331] text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-teal-700"
                  }`}
                >
                  {value === "all" ? "All types" : value}
                </button>
              ))}
            </div>
          </div>

          {filtered.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <DirectoryCard
                  key={item.id}
                  item={item}
                  href={`${basePath}/${item.slug}`}
                  eyebrow={item.category}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing matched that search"
              description="Try a broader term, another category, or another island."
            />
          )}
        </section>

        <section className="rounded-[30px] bg-[#043331] p-7 text-white sm:p-9">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                <Compass className="h-4 w-4" /> Need a complete day?
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
                Let the concierge connect the pieces.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Combine beaches, dining, stays, history, and transportation into one practical island plan.
              </p>
            </div>
            <Link
              href={island === "all" ? "/map?concierge=open" : `/map?island=${island}&concierge=open`}
              className="inline-flex items-center justify-center rounded-full bg-[#f5c451] px-6 py-4 text-[10px] font-black uppercase tracking-[.18em] text-[#043331]"
            >
              Plan with concierge
            </Link>
          </div>
        </section>
      </div>
      <div className="-mx-4 mt-12 sm:-mx-6 lg:mt-16">
        <ViPublicFooter />
      </div>
    </main>
  );
}

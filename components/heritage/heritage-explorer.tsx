"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Camera,
  Clock3,
  Landmark,
  Map,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import type { DirectoryItem } from "@/types/directory";

const ISLANDS = {
  all: "All islands",
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

type IslandFilter = keyof typeof ISLANDS;

const MODULES = [
  {
    title: "Historic places",
    text: "Forts, estates, churches, districts, ruins, and cultural landscapes.",
    icon: Landmark,
    state: "Available",
    href: "/historic",
  },
  {
    title: "Territory timeline",
    text: "Move through Indigenous history, Danish rule, resistance, emancipation, Transfer Day, and modern island life.",
    icon: Clock3,
    state: "39 events",
    href: "/heritage/timeline",
  },
  {
    title: "Governors & administrations",
    text: "Follow every recorded governor from Danish company rule through elected territorial government.",
    icon: Landmark,
    state: "115 records",
    href: "/heritage/governors",
  },
  {
    title: "Archives & sources",
    text: "Connect public narratives to records, scans, maps, and citations.",
    icon: Archive,
    state: "In integration",
    href: "/heritage#roadmap",
  },
  {
    title: "Historic maps",
    text: "Explore 136 maps, town plans, architectural drawings, and archive records collected from Rigsarkivet.",
    icon: Map,
    state: "136 records",
    href: "/heritage/maps",
  },
  {
    title: "Geographic dictionary",
    text: "Search 2,523 historic place names, estates, bays, hills, settlements, and geographic descriptions.",
    icon: BookOpen,
    state: "2,523 entries",
    href: "/heritage/dictionary",
  },
  {
    title: "Visual archive",
    text: "Historic photographs, documents, enhanced images, and collections.",
    icon: Camera,
    state: "In integration",
    href: "/heritage#roadmap",
  },
] as const;

export function HeritageExplorer({ items }: { items: DirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [island, setIsland] = useState<IslandFilter>("all");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesIsland = island === "all" || item.island === island;
      const haystack = [
        item.name,
        item.category,
        item.description,
        item.address,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesIsland && (!term || haystack.includes(term));
    });
  }, [island, items, query]);

  const featured = filtered.slice(0, 12);

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-32 text-[#082f2d]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(245,196,81,.25),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(45,212,191,.16),transparent_30%),linear-gradient(145deg,#032d2c,#074b4a_54%,#08282f)] text-white">
        <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-100/20 bg-amber-50/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-amber-100 backdrop-blur">
              <Landmark size={14} /> U.S. Virgin Islands Heritage
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/map?filter=history"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/15"
              >
                <Map size={15} /> Heritage map
              </Link>
              <Link
                href="/?concierge=open&prompt=Plan%20a%20USVI%20heritage%20experience"
                className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2 text-xs font-black text-[#043331] transition hover:brightness-105"
              >
                <Sparkles size={15} /> Ask concierge
              </Link>
            </div>
          </div>

          <div className="mt-12 grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#f5c451]">
                The territory remembers
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-7xl">
                Explore the Virgin Islands through place, people, and memory.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Heritage is not a separate archive inside VI Guide. It connects
                the places you visit with the stories, maps, records, and
                communities that give them meaning.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 shadow-2xl backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">
                Connected territory knowledge
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat value={String(items.length)} label="Sites" />
                <Stat value="3" label="Islands" />
                <Stat value="1" label="Guide" />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Each site connects to maps, transportation, nearby discovery,
                and the VI Concierge.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map(({ title, text, icon: Icon, state, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-[26px] border border-[#0b4b46]/10 bg-white p-5 shadow-[0_18px_50px_rgba(4,51,49,.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(4,51,49,.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f2ee] text-[#075e58]">
                  <Icon size={21} />
                </span>
                <span className="rounded-full bg-[#f6e7b5] px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-[#72520b]">
                  {state}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black tracking-[-.03em]">
                {title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {text}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#075e58]">
                Open <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 rounded-[30px] border border-[#0b4b46]/10 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search forts, estates, churches, districts, ruins…"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(ISLANDS) as IslandFilter[]).map((key) => (
              <button
                key={key}
                onClick={() => setIsland(key)}
                className={`whitespace-nowrap rounded-full px-4 py-3 text-xs font-black transition ${
                  island === key
                    ? "bg-[#043331] text-white"
                    : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:bg-slate-100"
                }`}
              >
                {ISLANDS[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-700">
              Historic places
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
              Start with the places around you
            </h2>
          </div>
          <Link
            href="/historic"
            className="hidden items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#075e58] sm:inline-flex"
          >
            View complete catalog <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((item) => (
            <Link
              key={item.id}
              href={`/historic/${item.slug}`}
              className="group overflow-hidden rounded-[28px] border border-[#0b4b46]/10 bg-white shadow-[0_20px_60px_rgba(4,51,49,.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(4,51,49,.14)]"
            >
              <div
                className="h-48 bg-[#0b4b46] bg-cover bg-center transition duration-500 group-hover:scale-[1.015]"
                style={{
                  backgroundImage: `linear-gradient(180deg,rgba(4,51,49,.02),rgba(4,51,49,.48)),url('${item.heroImage}')`,
                }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700">
                    {ISLANDS[item.island]}
                  </p>
                  <MapPin size={16} className="text-[#075e58]" />
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">
                  {item.name}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.17em] text-[#075e58]">
                  Explore this place <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!featured.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Landmark className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 text-xl font-black">
              No heritage places match that search
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Try a site name, island, estate, or category.
            </p>
          </div>
        ) : null}

        <section className="mt-12 overflow-hidden rounded-[30px] border border-[#0b4b46]/10 bg-[linear-gradient(135deg,#043331,#075e58)] p-6 text-white shadow-[0_24px_70px_rgba(4,51,49,.18)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Territory timeline
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-4xl">
                Travel through centuries of Virgin Islands history
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                Explore Indigenous life, European contact, Danish settlement,
                resistance, emancipation, Transfer Day, political change,
                hurricanes, recovery, and modern territory history. A dedicated
                governance track preserves every governor and acting administration.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/heritage/timeline"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 py-4 text-[10px] font-black uppercase tracking-[.18em] text-[#043331] transition hover:brightness-105"
              >
                Open the timeline <ArrowRight size={15} />
              </Link>
              <Link
                href="/heritage/governors"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-[.18em] text-white transition hover:bg-white/15"
              >
                View all governors <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <Link
          href="/historic"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-4 text-[10px] font-black uppercase tracking-[.18em] text-white sm:hidden"
        >
          View complete catalog <ArrowRight size={15} />
        </Link>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4">
      <strong className="block text-lg font-black text-[#f5c451]">{value}</strong>
      <span className="mt-1 block text-[9px] font-black uppercase tracking-[.16em] text-white/45">
        {label}
      </span>
    </div>
  );
}

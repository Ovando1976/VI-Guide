"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Compass,
  History,
  Landmark,
  Map,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import { DirectoryCard } from "@/components/directory/directory-card";
import type { DirectoryIsland, DirectoryItem } from "@/types/directory";

type ExploreKind = "places" | "beaches" | "historic" | "stays";
type ExploreRecord = DirectoryItem & { kind: ExploreKind };

type Props = {
  places: DirectoryItem[];
  beaches: DirectoryItem[];
  historic: DirectoryItem[];
  stays: DirectoryItem[];
};

const FILTERS: Array<{ value: "all" | ExploreKind; label: string; icon: typeof Compass }> = [
  { value: "all", label: "Everything", icon: Compass },
  { value: "places", label: "Places & food", icon: UtensilsCrossed },
  { value: "beaches", label: "Beaches", icon: Waves },
  { value: "historic", label: "History", icon: Landmark },
  { value: "stays", label: "Stays", icon: BedDouble },
];

const ISLANDS: Array<{ value: "all" | DirectoryIsland; label: string }> = [
  { value: "all", label: "All islands" },
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
];

export function ExploreExperiencePage({ places, beaches, historic, stays }: Props) {
  const [kind, setKind] = useState<"all" | ExploreKind>("all");
  const [island, setIsland] = useState<"all" | DirectoryIsland>("all");
  const [query, setQuery] = useState("");

  const records = useMemo<ExploreRecord[]>(() => [
    ...places.map((item) => ({ ...item, kind: "places" as const })),
    ...beaches.map((item) => ({ ...item, kind: "beaches" as const })),
    ...historic.map((item) => ({ ...item, kind: "historic" as const })),
    ...stays.map((item) => ({ ...item, kind: "stays" as const })),
  ], [beaches, historic, places, stays]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((item) => {
      const kindMatch = kind === "all" || item.kind === kind;
      const islandMatch = island === "all" || item.island === island;
      const haystack = [item.name, item.description, item.category, ...item.tags].join(" ").toLowerCase();
      return kindMatch && islandMatch && (!needle || haystack.includes(needle));
    });
  }, [island, kind, query, records]);

  const featured = records.filter((item) => item.featured).slice(0, 8);
  const categories = Array.from(new Set(places.map((item) => item.category))).sort();

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <section className="relative isolate overflow-hidden bg-[#043331] px-5 pb-16 pt-10 text-white sm:px-8 lg:px-12 lg:pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(20,184,166,.3),transparent_28%),linear-gradient(135deg,#032d2b,#075b58_62%,#0d8f86)]" />
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-[#f5c451]"><Sparkles size={15} /> Explore the USVI</div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.75fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-7xl">Find your next<br /><span className="font-serif font-medium italic text-[#83e4d8]">island moment.</span></h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/70 sm:text-lg">Search beaches, restaurants, attractions, historic places, and stays in one connected guide.</p>
            </div>
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
              <label htmlFor="explore-search" className="text-[10px] font-black uppercase tracking-[.2em] text-white/65">What sounds good?</label>
              <div className="relative mt-3">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input id="explore-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “sunset”, “local food”, or “family beach”" className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 font-semibold text-[#043331] outline-none ring-2 ring-transparent focus:ring-[#f5c451]" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {FILTERS.map(({ value, label, icon: Icon }) => <button key={value} type="button" onClick={() => setKind(value)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em] transition ${kind === value ? "bg-[#f5c451] text-[#043331]" : "border border-white/18 bg-white/8 text-white hover:bg-white/14"}`}><Icon size={15} />{label}</button>)}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-8 lg:px-12">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-600">Choose your island</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Start where your trip starts</h2></div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{ISLANDS.map((option) => <button key={option.value} type="button" onClick={() => setIsland(option.value)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] ${island === option.value ? "border-[#043331] bg-[#043331] text-white" : "border-slate-200 bg-white text-slate-500"}`}>{option.label}</button>)}</div>
          </div>
        </section>

        {kind === "all" && island === "all" && !query ? <section>
          <div className="mb-5 flex items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-600">Start here</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Featured island favorites</h2></div><Link href="/map?mode=discovery" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em]">See on map <Map size={15} /></Link></div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{featured.map((item) => <DirectoryCard key={`${item.kind}-${item.id}`} item={item} href={hrefFor(item)} eyebrow={labelFor(item.kind)} />)}</div>
        </section> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Beaches for every mood", href: "/beaches", icon: Waves, detail: `${beaches.length} shores to discover` },
            { label: "Eat, shop & explore", href: "/places", icon: UtensilsCrossed, detail: `${places.length} local places` },
            { label: "Stories in the landscape", href: "/historic", icon: History, detail: `${historic.length} historic places` },
            { label: "Find your island base", href: "/accommodations", icon: BedDouble, detail: `${stays.length} stays` },
          ].map(({ label, href, icon: Icon, detail }) => <Link key={label} href={href} className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><Icon size={22} /></span><strong className="mt-6 block text-xl">{label}</strong><span className="mt-2 block text-sm font-semibold text-slate-500">{detail}</span></Link>)}
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-600">Unified guide</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{filtered.length} matches worth exploring</h2></div>{kind === "places" ? <div className="text-xs font-bold text-slate-500">Popular categories: {categories.slice(0, 5).join(" · ")}</div> : null}</div>
          {filtered.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <DirectoryCard key={`${item.kind}-${item.id}`} item={item} href={hrefFor(item)} eyebrow={labelFor(item.kind)} />)}</div> : <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">Nothing matched. Try another island or a broader search.</div>}
        </section>

        <section className="overflow-hidden rounded-[34px] bg-[#043331] p-8 text-white sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div><div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]"><Sparkles size={15} /> Make it a complete day</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Let the concierge connect the beach, meal, route, and ride.</h2></div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0"><Link href="/map?concierge=open" className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-4 text-[10px] font-black uppercase tracking-[.16em] text-[#043331]"><Sparkles size={15} /> Ask concierge</Link><Link href="/mobility" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-4 text-[10px] font-black uppercase tracking-[.16em]"><Navigation size={15} /> Plan a ride</Link></div>
        </section>
      </div>
    </main>
  );
}

function hrefFor(item: ExploreRecord) {
  return item.kind === "stays" ? `/accommodations/${item.slug}` : `/${item.kind}/${item.slug}`;
}
function labelFor(kind: ExploreKind) {
  return kind === "historic" ? "History" : kind === "stays" ? "Stay" : kind === "beaches" ? "Beach" : "Explore";
}

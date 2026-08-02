"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Anchor,
  Compass,
  Fish,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

import {
  FISHING_DISCLAIMER,
  FISHING_SPECIES,
  type FishingStatus,
} from "@/lib/fishing-handbook";

const STATUS_LABEL: Record<FishingStatus, string> = {
  restricted: "Rules apply",
  protected: "Protected",
};

export function FishingExplorer() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");

  const groups = useMemo(
    () => ["all", ...Array.from(new Set(FISHING_SPECIES.map((item) => item.group)))],
    [],
  );

  const species = useMemo(() => {
    const term = query.trim().toLowerCase();
    return FISHING_SPECIES.filter((item) => {
      const matchesGroup = group === "all" || item.group === group;
      const haystack = [
        item.commonName,
        item.scientificName,
        item.group,
        item.summary,
        item.habitat,
        item.handling,
        ...item.searchTerms,
      ]
        .join(" ")
        .toLowerCase();
      return matchesGroup && (!term || haystack.includes(term));
    });
  }, [group, query]);

  return (
    <main className="min-h-screen bg-[#031f26] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,.2),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(251,191,36,.16),transparent_28%),linear-gradient(145deg,#043331_0%,#064b58_52%,#07222d_100%)]">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 lg:px-10 lg:pb-20 lg:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-50/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-100 backdrop-blur">
              <Anchor size={14} /> U.S. Virgin Islands Fisher Guide
            </div>
            <div className="flex gap-2">
              <Link href="/map" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/15">
                <Map size={15} /> Open map
              </Link>
              <Link href="/map?concierge=open" className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-4 py-2 text-xs font-black text-[#043331] transition hover:brightness-105">
                <Sparkles size={15} /> Ask concierge
              </Link>
            </div>
          </div>

          <div className="mt-12 grid items-end gap-10 lg:grid-cols-[1.3fr_.7fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#f5c85a]">Fish smarter. Respect the water.</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[.94] tracking-[-.05em] sm:text-6xl lg:text-7xl">
                The Virgin Islands fishing experience, built into VI Guide.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Identify common species, understand habitat, review conservation guidance, and move directly into the territory map or concierge for practical trip planning.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100"><Waves size={22} /></div>
                <div><p className="text-xs font-black uppercase tracking-[.18em] text-white/50">Territory coverage</p><p className="mt-1 font-bold">St. Thomas · St. John · St. Croix · Water Island</p></div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Stat value={String(FISHING_SPECIES.length)} label="Species" />
                <Stat value="2" label="Water zones" />
                <Stat value="Live" label="Map handoff" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="rounded-[26px] border border-amber-200/20 bg-amber-200/[.08] p-5 text-amber-50">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-[#f5b942]" size={20} /><div><p className="font-black">Check current regulations before every trip</p><p className="mt-1 text-sm leading-6 text-amber-50/75">{FISHING_DISCLAIMER}</p></div></div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/55" size={20} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search yellowtail, conch, lobster, grouper…" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[.07] pl-12 pr-4 text-sm font-semibold outline-none placeholder:text-white/35 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {groups.map((item) => (
              <button key={item} onClick={() => setGroup(item)} className={`whitespace-nowrap rounded-full px-4 py-3 text-xs font-black transition ${group === item ? "bg-[#f5b942] text-[#043331]" : "border border-white/10 bg-white/[.06] text-white/70 hover:bg-white/10"}`}>
                {item === "all" ? "All species" : item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {species.map((item) => (
            <article key={item.id} className="group overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,.09),rgba(255,255,255,.035))] shadow-[0_24px_70px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25">
              <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_35%_30%,rgba(103,232,249,.34),transparent_28%),linear-gradient(135deg,#07576a,#043331)]">
                <div className="absolute -right-7 -top-7 h-32 w-32 rounded-full border border-white/10" />
                <div className="absolute bottom-4 left-5 grid h-16 w-16 place-items-center rounded-[22px] border border-white/20 bg-white/10 text-cyan-50 shadow-xl backdrop-blur"><Fish size={34} strokeWidth={1.7} /></div>
                <span className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] ${item.status === "protected" ? "bg-rose-300 text-rose-950" : "bg-[#f5b942] text-[#043331]"}`}>{STATUS_LABEL[item.status]}</span>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/65">{item.group} · {item.waters}</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">{item.commonName}</h2>
                <p className="mt-1 text-sm italic text-white/45">{item.scientificName}</p>
                <p className="mt-4 text-sm leading-6 text-white/70">{item.summary}</p>
                <div className="mt-5 space-y-4 border-t border-white/10 pt-5 text-sm">
                  <Info icon={<Compass size={16} />} label="Habitat" value={item.habitat} />
                  <Info icon={<ShieldCheck size={16} />} label="Before keeping" value={item.regulationNote} />
                  <Info icon={<Fish size={16} />} label="Handle and release" value={item.handling} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {!species.length && <div className="mt-10 rounded-[28px] border border-dashed border-white/15 p-12 text-center"><Fish className="mx-auto text-white/30" size={36} /><h2 className="mt-4 text-xl font-black">No species match that search</h2><p className="mt-2 text-sm text-white/50">Try a common name, fish group, or habitat.</p></div>}
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4"><strong className="block text-lg font-black text-[#f5c85a]">{value}</strong><span className="mt-1 block text-[9px] font-black uppercase tracking-[.16em] text-white/45">{label}</span></div>;
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-cyan-200">{icon}</span><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/40">{label}</p><p className="mt-1 leading-5 text-white/65">{value}</p></div></div>;
}

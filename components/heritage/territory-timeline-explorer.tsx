"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Crown,
  Landmark,
  Map,
  Search,
  Sparkles,
} from "lucide-react";

import {
  TERRITORY_TIMELINE_EVENTS,
  TIMELINE_ERAS,
  type TimelineEra,
  type TimelineIsland,
} from "@/data/heritage/territory-timeline";
import { USVI_GOVERNORS } from "@/data/heritage/usvi-governors";

type EraFilter = TimelineEra | "all";
type IslandFilter = TimelineIsland | "all";

type TimelineRecord = {
  id: string;
  year: number;
  dateLabel: string;
  title: string;
  summary: string;
  era: TimelineEra;
  island: TimelineIsland;
  kind: "event" | "governor";
  tags: string[];
  mapHref?: string;
  detailHref?: string;
};

const ISLANDS: { id: IslandFilter; label: string }[] = [
  { id: "all", label: "All islands" },
  { id: "territory", label: "Territory-wide" },
  { id: "stt", label: "St. Thomas" },
  { id: "stj", label: "St. John" },
  { id: "stx", label: "St. Croix" },
];

const GOVERNOR_RECORDS: TimelineRecord[] = USVI_GOVERNORS.map((governor) => ({
  id: `governor-${governor.id}`,
  year: Number(governor.termStart.slice(0, 4)),
  dateLabel: governor.termLabel,
  title: `${governor.name} begins service`,
  summary: governor.summary,
  era: governor.era === "naval" ? "transfer" : "modern",
  island: "territory",
  kind: "governor",
  tags: [governor.title, governor.party ?? "", ...governor.milestones].filter(Boolean),
  detailHref: `/heritage/governors#${governor.id}`,
}));

const RECORDS: TimelineRecord[] = [
  ...TERRITORY_TIMELINE_EVENTS.map((event) => ({
    ...event,
    kind: "event" as const,
    detailHref: event.placeHref,
  })),
  ...GOVERNOR_RECORDS,
].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

export function TerritoryTimelineExplorer() {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState<EraFilter>("all");
  const [island, setIsland] = useState<IslandFilter>("all");
  const [governorsOnly, setGovernorsOnly] = useState(false);

  const records = useMemo(() => {
    const term = query.trim().toLowerCase();

    return RECORDS.filter((record) => {
      const matchesEra = era === "all" || record.era === era;
      const matchesIsland = island === "all" || record.island === island;
      const matchesKind = !governorsOnly || record.kind === "governor";
      const haystack = [record.title, record.summary, record.dateLabel, ...record.tags]
        .join(" ")
        .toLowerCase();

      return matchesEra && matchesIsland && matchesKind && (!term || haystack.includes(term));
    });
  }, [era, governorsOnly, island, query]);

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-36 text-[#082f2d]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(245,196,81,.24),transparent_28%),linear-gradient(145deg,#032d2c,#075e58)] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 lg:px-10 lg:pb-20">
          <Link
            href="/heritage"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-white/70 transition hover:text-white"
          >
            <ArrowLeft size={15} /> Back to Heritage
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.26em] text-[#f5c451]">
                Territory history engine
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[.96] tracking-[-.05em] sm:text-6xl">
                The Virgin Islands timeline
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/72">
                Explore defining events and every U.S.-period governor in one connected chronology,
                then move directly into maps, historic places, and the Heritage Guide.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 backdrop-blur-xl">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat value={String(TERRITORY_TIMELINE_EVENTS.length)} label="Events" />
                <Stat value={String(USVI_GOVERNORS.length)} label="Governor terms" />
                <Stat value={String(RECORDS.length)} label="Records" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#0b4b46]/10 bg-white p-4 shadow-[0_18px_45px_rgba(4,51,49,.08)] sm:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45" size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search an event, person, year, island, or theme…"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {TIMELINE_ERAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEra(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-3 text-xs font-black transition ${
                  era === item.id
                    ? "bg-[#043331] text-white"
                    : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {ISLANDS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIsland(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black transition ${
                  island === item.id
                    ? "bg-[#e4f2ee] text-[#075e58] ring-1 ring-[#075e58]/20"
                    : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGovernorsOnly((value) => !value)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black transition ${
                governorsOnly
                  ? "bg-[#f6e7b5] text-[#72520b] ring-1 ring-amber-700/20"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              <Crown size={14} /> Governors only
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {records.map((record, index) => (
            <article
              key={record.id}
              id={record.id}
              className="relative overflow-hidden rounded-[28px] border border-[#0b4b46]/10 bg-white shadow-[0_18px_55px_rgba(4,51,49,.08)]"
            >
              <div className="grid lg:grid-cols-[190px_1fr]">
                <div className={`relative flex min-h-44 items-center justify-center overflow-hidden p-6 text-white ${
                  record.kind === "governor"
                    ? "bg-[radial-gradient(circle_at_30%_25%,rgba(245,196,81,.35),transparent_35%),linear-gradient(145deg,#043331,#087069)]"
                    : "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.16),transparent_35%),linear-gradient(145deg,#123f46,#075e58)]"
                }`}>
                  <div className="text-center">
                    <p className="text-3xl font-black tracking-[-.05em]">{record.year}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[.18em] text-white/60">
                      {record.kind === "governor" ? "Administration" : "Historical event"}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f2ef] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-[#075e58]">
                          {record.kind === "governor" ? <Crown size={13} /> : <Landmark size={13} />}
                          {record.kind}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.13em] text-slate-600">
                          {record.island === "territory" ? "Territory-wide" : record.island.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black tracking-[-.035em] sm:text-3xl">
                        {record.title}
                      </h2>
                    </div>

                    <div className="rounded-2xl bg-[#fbf6e8] px-4 py-3 text-right">
                      <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-amber-800">
                        <CalendarDays size={13} /> Date
                      </p>
                      <p className="mt-1 text-sm font-black">{record.dateLabel}</p>
                    </div>
                  </div>

                  <p className="mt-5 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                    {record.summary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {record.tags.filter(Boolean).slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                    {record.detailHref ? (
                      <Link
                        href={record.detailHref}
                        className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
                      >
                        Open record <ArrowRight size={14} />
                      </Link>
                    ) : null}
                    {record.mapHref ? (
                      <Link
                        href={record.mapHref}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#075e58]"
                      >
                        <Map size={14} /> View on map
                      </Link>
                    ) : null}
                    <Link
                      href={`/concierge?context=heritage&prompt=${encodeURIComponent(`Tell me more about ${record.title}`)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#075e58]"
                    >
                      <Sparkles size={14} /> Ask the guide
                    </Link>
                  </div>
                </div>
              </div>

              <span className="absolute right-5 top-5 text-[10px] font-black text-[#075e58]/20">
                {String(index + 1).padStart(2, "0")}
              </span>
            </article>
          ))}
        </div>

        {!records.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Landmark className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 text-xl font-black">No timeline records match</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Try another era, island, person, year, or theme.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-black/15 px-3 py-4">
      <p className="text-xl font-black tracking-[-.03em] sm:text-2xl">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-white/45">
        {label}
      </p>
    </div>
  );
}

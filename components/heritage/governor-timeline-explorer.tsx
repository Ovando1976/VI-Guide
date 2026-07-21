"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Crown,
  Landmark,
  Search,
  Shield,
  Vote,
} from "lucide-react";

import {
  GOVERNOR_ERAS,
  USVI_GOVERNORS,
  type GovernorEra,
} from "@/data/heritage/usvi-governors";

type Filter = GovernorEra | "all";

const ERA_ICONS = {
  naval: Shield,
  appointed: Crown,
  elected: Vote,
} as const;

export function GovernorTimelineExplorer() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const governors = useMemo(() => {
    const term = query.trim().toLowerCase();

    return USVI_GOVERNORS.filter((governor) => {
      const matchesEra = filter === "all" || governor.era === filter;
      const haystack = [
        governor.name,
        governor.title,
        governor.termLabel,
        governor.party,
        governor.appointedBy,
        governor.summary,
        ...governor.milestones,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesEra && (!term || haystack.includes(term));
    });
  }, [filter, query]);

  const current = USVI_GOVERNORS.at(-1);
  const electedCount = USVI_GOVERNORS.filter(
    (governor) => governor.era === "elected",
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f1e8] pb-40 text-[#082f2d]">
      <section className="bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,.22),transparent_28%),linear-gradient(145deg,#032d2c,#075e58)] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-16">
          <Link
            href="/heritage/timeline"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-white/70 transition hover:text-white"
          >
            <ArrowLeft size={15} /> Back to territory timeline
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.26em] text-[#f5c451]">
                Government and political history
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[.96] tracking-[-.05em] sm:text-6xl">
                Governors of the U.S. Virgin Islands
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/72">
                Follow every governor of the United States period—from naval
                administration after Transfer Day, through appointed civilian
                government, to the elected administrations of today.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 backdrop-blur-xl">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat value={String(USVI_GOVERNORS.length)} label="Terms" />
                <Stat value={String(electedCount)} label="Elected" />
                <Stat value={current?.termLabel ?? "—"} label="Current era" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#0b4b46]/10 bg-white p-4 shadow-[0_18px_45px_rgba(4,51,49,.08)] sm:p-5">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45"
              size={19}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search governor, year, party, president, or milestone…"
              className="h-13 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {GOVERNOR_ERAS.map((era) => (
              <button
                key={era.id}
                type="button"
                onClick={() => setFilter(era.id)}
                className={`whitespace-nowrap rounded-full px-4 py-3 text-xs font-black transition ${
                  filter === era.id
                    ? "bg-[#043331] text-white"
                    : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:bg-slate-100"
                }`}
              >
                {era.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {governors.map((governor, index) => {
            const Icon = ERA_ICONS[governor.era];
            const isCurrent = governor.termEnd === null;

            return (
              <article
                key={governor.id}
                id={governor.id}
                className={`relative overflow-hidden rounded-[30px] border bg-white shadow-[0_18px_55px_rgba(4,51,49,.08)] ${
                  isCurrent
                    ? "border-[#f5c451] ring-4 ring-[#f5c451]/20"
                    : "border-[#0b4b46]/10"
                }`}
              >
                <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
                  <div className="relative flex min-h-52 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_25%,rgba(245,196,81,.35),transparent_35%),linear-gradient(145deg,#043331,#087069)] text-white">
                    <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
                    <div className="relative text-center">
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white/10 text-3xl font-black backdrop-blur">
                        {initials(governor.name)}
                      </div>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-white/60">
                        {governor.era} administration
                      </p>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f2ef] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-[#075e58]">
                            <Icon size={13} /> {governor.title}
                          </span>
                          {governor.acting ? (
                            <Badge>Acting</Badge>
                          ) : null}
                          {governor.diedInOffice ? (
                            <Badge>Died in office</Badge>
                          ) : null}
                          {isCurrent ? <Badge>Current</Badge> : null}
                        </div>

                        <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#082f2d]">
                          {governor.name}
                        </h2>
                      </div>

                      <div className="rounded-2xl bg-[#fbf6e8] px-4 py-3 text-right">
                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-amber-800">
                          <CalendarDays size={13} /> Term
                        </p>
                        <p className="mt-1 text-sm font-black text-[#082f2d]">
                          {governor.termLabel}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                      {governor.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {governor.party ? <Meta label="Party" value={governor.party} /> : null}
                      {governor.appointedBy ? (
                        <Meta label="Appointed by" value={governor.appointedBy} />
                      ) : null}
                      {governor.sequence ? (
                        <Meta label="Elected sequence" value={`#${governor.sequence}`} />
                      ) : null}
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="text-[10px] font-black uppercase tracking-[.17em] text-slate-400">
                        Historical markers
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {governor.milestones.map((milestone) => (
                          <span
                            key={milestone}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-slate-600"
                          >
                            {milestone}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <span className="absolute right-5 top-5 text-[10px] font-black text-[#075e58]/20">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </article>
            );
          })}
        </div>

        {!governors.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Landmark className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 text-xl font-black">No governors match that search</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Try a name, year, party, president, or historical milestone.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f6e7b5] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.13em] text-[#72520b]">
      {children}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-2xl border border-slate-200 bg-[#fbfaf6] px-3 py-2 text-xs font-bold text-slate-600">
      <span className="text-slate-400">{label}:</span> {value}
    </span>
  );
}

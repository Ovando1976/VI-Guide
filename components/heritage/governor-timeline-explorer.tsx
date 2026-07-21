"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Crown,
  Landmark,
  Search,
  Shield,
  Star,
} from "lucide-react";

import {
  GOVERNOR_AUTHORITIES,
  VIRGIN_ISLANDS_GOVERNORS,
  type GovernorAuthority,
} from "@/data/heritage/virgin-islands-governors";

type AuthorityFilter = GovernorAuthority | "all";

const AUTHORITY_LABELS: Record<GovernorAuthority, string> = {
  "danish-company": "Danish company administration",
  "danish-crown": "Danish Crown administration",
  "british-occupation": "British occupation",
  "united-states-navy": "United States naval administration",
  "united-states-appointed": "United States appointed civilian administration",
  "usvi-elected": "Elected territorial government",
};

function formatTerm(value: string | null) {
  if (!value) return "Present";
  return value;
}

function authorityIcon(authority: GovernorAuthority) {
  if (authority === "danish-company" || authority === "danish-crown") {
    return Crown;
  }
  if (authority === "british-occupation") return Shield;
  if (authority === "united-states-navy") return Star;
  if (authority === "united-states-appointed") return Building2;
  return Landmark;
}

export default function GovernorTimelineExplorer() {
  const [authority, setAuthority] = useState<AuthorityFilter>("all");
  const [query, setQuery] = useState("");
  const [includeActing, setIncludeActing] = useState(true);

  const governors = useMemo(() => {
    const term = query.trim().toLowerCase();

    return VIRGIN_ISLANDS_GOVERNORS.filter((governor) => {
      if (authority !== "all" && governor.authority !== authority) return false;
      if (!includeActing && governor.acting) return false;
      if (!term) return true;

      return [
        governor.name,
        governor.office,
        governor.termStart,
        governor.termEnd ?? "present",
        governor.note ?? "",
        governor.scope,
        AUTHORITY_LABELS[governor.authority],
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [authority, includeActing, query]);

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-36 text-[#082f2d]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(245,196,81,.24),transparent_28%),linear-gradient(145deg,#032d2c,#074b4a_58%,#08282f)] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
          <Link
            href="/heritage"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-white/70 transition hover:text-white"
          >
            <ArrowLeft size={15} /> Heritage
          </Link>

          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#f5c451]">
                Virgin Islands governance timeline
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">
                Every recorded governor, from company rule to elected government.
              </h1>
              <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                This chronology preserves separate early island administrations,
                acting appointments, British occupations, Danish Crown rule,
                United States naval government, appointed civilian governors,
                and every elected governor of the U.S. Virgin Islands.
              </p>
            </div>

            <div className="grid min-w-64 grid-cols-2 gap-3 rounded-[26px] border border-white/12 bg-white/[.08] p-4 backdrop-blur">
              <Stat value={VIRGIN_ISLANDS_GOVERNORS.length} label="Records" />
              <Stat value="1665–now" label="Coverage" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#0b4b46]/10 bg-white p-4 shadow-[0_18px_50px_rgba(4,51,49,.08)] sm:p-6">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45"
              size={19}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a governor, year, office, or administration…"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {GOVERNOR_AUTHORITIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAuthority(item.id)}
                className={`shrink-0 rounded-full px-4 py-3 text-[10px] font-black uppercase tracking-[.14em] transition ${
                  authority === item.id
                    ? "bg-[#043331] text-white"
                    : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="mt-3 inline-flex cursor-pointer items-center gap-3 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={includeActing}
              onChange={(event) => setIncludeActing(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#075e58]"
            />
            Include acting and interim governors
          </label>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-700">
              Complete chronology
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
              {governors.length} administration records
            </h2>
          </div>
          <Link
            href="/heritage/timeline"
            className="hidden rounded-full border border-[#075e58]/20 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#075e58] sm:inline-flex"
          >
            Main historical timeline
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {governors.map((governor, index) => {
            const Icon = authorityIcon(governor.authority);
            const initials = governor.name
              .split(/\s+/)
              .map((part) => part[0])
              .filter(Boolean)
              .slice(0, 3)
              .join("");

            return (
              <article
                key={governor.id}
                id={`governor-${governor.id}`}
                className="scroll-mt-24 overflow-hidden rounded-[28px] border border-[#0b4b46]/10 bg-white shadow-[0_18px_50px_rgba(4,51,49,.07)]"
              >
                <div className="grid md:grid-cols-[190px_1fr]">
                  <div className="relative grid min-h-44 place-items-center overflow-hidden bg-[radial-gradient(circle_at_32%_25%,rgba(245,196,81,.45),transparent_28%),linear-gradient(145deg,#043331,#087068)] p-5 text-white">
                    <div className="absolute inset-0 opacity-[.14] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:28px_28px]" />
                    <div className="relative text-center">
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl font-black shadow-xl backdrop-blur">
                        {initials}
                      </div>
                      <p className="mt-3 text-[9px] font-black uppercase tracking-[.2em] text-white/65">
                        Portrait review pending
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f2ee] px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-[#075e58]">
                            <Icon size={12} /> {AUTHORITY_LABELS[governor.authority]}
                          </span>
                          {governor.acting ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-amber-800">
                              Acting / interim
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-2xl font-black tracking-[-.035em] sm:text-3xl">
                          {governor.name}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-slate-600">
                          {governor.office}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#fbf4df] px-4 py-3 text-right">
                        <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-amber-800">
                          <CalendarDays size={13} /> Term
                        </p>
                        <p className="mt-1 text-sm font-black text-[#082f2d]">
                          {formatTerm(governor.termStart)} – {formatTerm(governor.termEnd)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">
                      <span>#{index + 1}</span>
                      <span>•</span>
                      <span>{governor.scope.replaceAll("_", " ")}</span>
                    </div>

                    {governor.note ? (
                      <p className="mt-4 rounded-2xl border border-amber-700/10 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
                        {governor.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-white/55">
        {label}
      </p>
    </div>
  );
}

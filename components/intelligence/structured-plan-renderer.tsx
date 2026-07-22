"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Clock3,
  Map,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { IntelligenceResponse } from "@/types/intelligence";

export function StructuredPlanRenderer({
  response,
  compact = false,
}: {
  response: IntelligenceResponse;
  compact?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-white/40">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1.5">
          <ShieldCheck size={11} /> {response.confidence} confidence
        </span>
        <span>{response.intent.replaceAll("_", " ")}</span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={11} /> VI Guide data
        </span>
      </div>

      {response.recommendations.length ? (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/45">
            Best matches from VI Guide
          </div>
          {response.recommendations
            .slice(0, compact ? 3 : 6)
            .map((item, index) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[.045] p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-[11px] font-black text-cyan-100">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-white/90">
                        {item.title}
                      </h3>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-white/40">
                        {item.kind.replaceAll("_", " ")}
                      </span>
                    </div>
                    {!compact ? (
                      <p className="mt-1.5 text-xs font-semibold leading-5 text-white/50">
                        {item.summary}
                      </p>
                    ) : null}
                    {item.reasons.length ? (
                      <p className="mt-2 text-[10px] font-bold leading-4 text-cyan-100/45">
                        {item.reasons.join(" · ")}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-[#05242b]"
                        >
                          Open place <ArrowRight size={11} />
                        </Link>
                      ) : null}
                      {item.mapHref ? (
                        <Link
                          href={item.mapHref}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/70"
                        >
                          <MapPin size={11} /> Show on map
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
        </div>
      ) : null}

      {response.plan.length ? (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/45">
            Connected itinerary
          </div>
          {response.plan.map((stop, index) => (
            <article
              key={stop.id}
              className="rounded-2xl border border-white/10 bg-white/[.045] p-3"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300 text-[11px] font-black text-[#05242b]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-white/90">
                      {stop.title}
                    </h3>
                    {stop.startTime ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-100/60">
                        <Clock3 size={11} /> {stop.startTime}
                      </span>
                    ) : null}
                  </div>
                  {!compact ? (
                    <p className="mt-1.5 text-xs font-semibold leading-5 text-white/50">
                      {stop.summary}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stop.href ? (
                      <Link
                        href={stop.href}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-white/75"
                      >
                        Open <ArrowRight size={11} />
                      </Link>
                    ) : null}
                    {stop.mapHref ? (
                      <Link
                        href={stop.mapHref}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/70"
                      >
                        <Map size={11} /> Map
                      </Link>
                    ) : null}
                    {stop.bookingHref ? (
                      <Link
                        href={stop.bookingHref}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-amber-200/[.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-amber-50/80"
                      >
                        <CalendarCheck size={11} /> Booking
                      </Link>
                    ) : null}
                    {stop.mobility ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-white/45">
                        <Route size={11} /> {stop.mobility.mode}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {response.warnings.length ? (
        <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[.06] p-3 text-[11px] font-semibold leading-5 text-amber-50/70">
          {response.warnings.map((warning) => (
            <p key={warning} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

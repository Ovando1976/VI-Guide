"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Route, Sparkles } from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import {
  ACTIVITY_CATEGORY_LABELS,
  BOOKABLE_EXPERIENCES,
  ISLAND_NAMES,
} from "@/lib/bookable-experiences-restored";

type ActivityJourneyPickerProps = {
  query?: string;
  island?: string;
  category?: string;
};

export function ActivityJourneyPicker({
  query = "",
  island = "all",
  category = "all",
}: ActivityJourneyPickerProps) {
  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return BOOKABLE_EXPERIENCES.filter((item) => {
      const matchesIsland = island === "all" || item.island === island;
      const matchesCategory = category === "all" || item.category === category;
      const searchable = [
        item.name,
        item.operator,
        item.location,
        item.summary,
        ACTIVITY_CATEGORY_LABELS[item.category],
        ...item.highlights,
      ]
        .join(" ")
        .toLowerCase();
      return (
        matchesIsland &&
        matchesCategory &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [category, island, query]);

  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");

  useEffect(() => {
    if (!options.some((item) => item.id === selectedId)) {
      setSelectedId(options[0]?.id ?? "");
    }
  }, [options, selectedId]);

  const selected = options.find((item) => item.id === selectedId) ?? options[0];
  if (!selected) return null;

  const bookingParams = new URLSearchParams({
    kind: selected.kind,
    island: selected.island,
    listingId: selected.id,
    listingName: selected.name,
    listingHref: "/activities",
    adults: "2",
  });
  const bookingHref = `/book?${bookingParams.toString()}`;
  const activityHref = `/activities?island=${selected.island}&category=${selected.category}#activity-search-title`;

  return (
    <section className="border-b border-[#d8e4e0] bg-[#eaf8f5] px-4 py-7 sm:px-7 lg:px-10" aria-labelledby="activity-trip-shortlist-title">
      <div className="mx-auto grid max-w-7xl gap-5 rounded-[28px] border border-[#b8ddd6] bg-[#fffdf8] p-5 shadow-[0_16px_45px_rgba(4,51,49,.07)] sm:p-7 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#0f766e]">
            <Route className="h-4 w-4" /> Connected trip planning
          </div>
          <h2 id="activity-trip-shortlist-title" className="vi-display mt-2 text-3xl font-bold leading-none sm:text-4xl">
            Carry an experience into My Trip.
          </h2>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Choose from the experiences matching your current filters, save it to the Journey Planner, then keep the real booking request attached to that stop.
          </p>
        </div>

        <div className="rounded-[24px] border border-[#d9e6e2] bg-white p-4 sm:p-5">
          <label className="block">
            <span className="text-[9px] font-black uppercase tracking-[.15em] text-[#607370]">
              Add from {options.length} matching {options.length === 1 ? "experience" : "experiences"}
            </span>
            <select
              value={selected.id}
              onChange={(event) => setSelectedId(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-[#cfe0dc] bg-[#fffdf8] px-4 text-sm font-bold text-[#032f2d] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#73e3d9]/40"
            >
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {ISLAND_NAMES[item.island]}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-2xl bg-[#f5f0e6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.14em] text-[#9b5d12]">
                  {ACTIVITY_CATEGORY_LABELS[selected.category]} · {selected.operator}
                </div>
                <strong className="mt-1 block text-base font-black text-[#032f2d]">{selected.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{selected.location}</span>
              </div>
              <CalendarPlus className="h-5 w-5 shrink-0 text-[#0f766e]" />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <AddToJourneyButton
              className="w-full"
              stop={{
                id: `activity-${selected.id}`,
                title: selected.name,
                island: selected.island,
                kind: selected.kind,
                summary: `${selected.summary} Operator: ${selected.operator}. Final schedule, pricing, availability, and confirmation remain operator-controlled.`,
                href: activityHref,
                bookingHref,
              }}
            />
            <a
              href={bookingHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white"
            >
              Request <Sparkles className="h-4 w-4 text-[#f5c451]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

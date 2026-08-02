"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Map,
  MapPin,
  Navigation,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { TRIP_STORAGE_KEY, type TripItem } from "./trip-types";

const ISLAND_NAMES = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

const DAYPARTS = ["morning", "afternoon", "evening", "flexible"] as const;

type JourneyStatus = "planned" | "next" | "visited";
type JourneyItem = TripItem & { status?: JourneyStatus };

export function TripPlannerScreen() {
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [days, setDays] = useState(3);
  const [selectedDay, setSelectedDay] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readTrip();
    const highestStoredDay = stored.reduce(
      (highest, item) => Math.max(highest, item.day || 1),
      1,
    );

    setItems(stored);
    setDays(Math.max(3, Math.min(7, highestStoredDay)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    setSelectedDay((current) => Math.min(current, days));
  }, [days]);

  const islands = useMemo(
    () => Array.from(new Set(items.map((item) => ISLAND_NAMES[item.island]))),
    [items],
  );

  const visitedCount = useMemo(
    () => items.filter((item) => item.status === "visited").length,
    [items],
  );

  const progress = items.length
    ? Math.round((visitedCount / items.length) * 100)
    : 0;

  const daySummaries = useMemo(
    () =>
      Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const dayItems = items.filter((item) => item.day === day);
        const completed = dayItems.filter(
          (item) => item.status === "visited",
        ).length;
        return { day, count: dayItems.length, completed };
      }),
    [days, items],
  );

  const selectedItems = useMemo(
    () => items.filter((item) => item.day === selectedDay),
    [items, selectedDay],
  );

  const nextStop = useMemo(
    () =>
      selectedItems.find((item) => item.status === "next") ??
      selectedItems.find((item) => item.status !== "visited") ??
      null,
    [selectedItems],
  );

  const readiness = useMemo(() => {
    const warnings: string[] = [];

    for (let day = 1; day <= days; day += 1) {
      const dayIslands = new Set(
        items.filter((item) => item.day === day).map((item) => item.island),
      );
      if (dayIslands.size > 1) {
        warnings.push(`Day ${day} crosses islands and needs transfer planning.`);
      }
    }

    const flexibleStops = items.filter(
      (item) => item.timeOfDay === "flexible" && item.status !== "visited",
    ).length;
    if (flexibleStops) {
      warnings.push(
        `${flexibleStops} stop${flexibleStops === 1 ? "" : "s"} still need timing.`,
      );
    }

    return warnings;
  }, [days, items]);

  const conciergePrompt = useMemo(() => {
    const stops = items
      .map(
        (item) =>
          `${item.name} (${ISLAND_NAMES[item.island]}, day ${item.day}, ${item.timeOfDay})`,
      )
      .join(", ");

    return `/map?concierge=open&prompt=${encodeURIComponent(
      `Turn these saved ideas into a practical ${days}-day USVI itinerary: ${
        stops || "I have not chosen stops yet"
      }. Group nearby stops, include realistic travel time, meals, licensed transportation, and backup options.`,
    )}`;
  }, [days, items]);

  function update(id: string, patch: Partial<JourneyItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function changeDays(nextDays: number) {
    setDays(nextDays);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        day: Math.max(1, Math.min(nextDays, item.day || 1)),
      })),
    );
  }

  function markNext(id: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id === id) return { ...item, status: "next" };
        if (item.status === "next") return { ...item, status: "planned" };
        return item;
      }),
    );
  }

  function toggleVisited(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "visited" ? "planned" : "visited",
            }
          : item,
      ),
    );
  }

  function moveWithinDay(id: string, direction: -1 | 1) {
    setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === id);
      if (sourceIndex < 0) return current;

      const source = current[sourceIndex];
      const sameDayIndexes = current
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.day === source.day)
        .map(({ index }) => index);
      const localIndex = sameDayIndexes.indexOf(sourceIndex);
      const targetIndex = sameDayIndexes[localIndex + direction];
      if (targetIndex === undefined) return current;

      const next = [...current];
      [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.12),transparent_30%),linear-gradient(180deg,#f8f4ea_0%,#fff_48%,#f4f7f5_100%)] px-4 py-6 pb-36 text-[#043331] sm:px-6 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#032d2b_0%,#075b57_52%,#16a69b_100%)] p-6 text-white shadow-[0_28px_80px_rgba(4,51,49,.24)] sm:p-9 lg:p-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#f5c451]/10 blur-3xl" />

          <div className="relative">
            <div className="text-[10px] font-black uppercase tracking-[.26em] text-[#f5d273]">
              Journey Dashboard
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-6xl">
                  Run the trip, not just the list.
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                  Organize each day, choose the next stop, track what you have completed, and hand transportation or itinerary decisions to VI Concierge.
                </p>
              </div>

              <label className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur">
                Trip length
                <select
                  value={days}
                  onChange={(event) => changeDays(Number(event.target.value))}
                  className="ml-3 bg-transparent text-white outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <option key={day} value={day} className="text-[#043331]">
                      {day} day{day === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[.16em] text-white/70">
                  <span>{visitedCount} of {items.length} stops completed</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-[#f5c451] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={conciergePrompt}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.17em] text-[#043331] shadow-lg"
                >
                  <Sparkles className="h-4 w-4" /> Build with Concierge
                </Link>
                <Link
                  href="/map"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-[10px] font-black uppercase tracking-[.17em] backdrop-blur"
                >
                  <Map className="h-4 w-4" /> Territory map
                </Link>
              </div>
            </div>
          </div>
        </section>

        <nav
          className="mt-6 flex gap-2 overflow-x-auto rounded-[24px] border border-[#0b5d5b]/10 bg-white/92 p-2 shadow-sm backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Trip days"
        >
          {daySummaries.map((summary) => {
            const active = selectedDay === summary.day;
            return (
              <button
                key={summary.day}
                type="button"
                onClick={() => setSelectedDay(summary.day)}
                aria-pressed={active}
                className={`min-w-[118px] flex-1 rounded-[18px] px-4 py-3 text-left transition ${
                  active
                    ? "bg-[#043331] text-white shadow-lg"
                    : "bg-[#f8f4ea] text-[#043331] hover:bg-[#edf7f4]"
                }`}
              >
                <div className="text-[9px] font-black uppercase tracking-[.17em] opacity-60">
                  Day {summary.day}
                </div>
                <div className="mt-1 text-sm font-black">
                  {summary.count} stop{summary.count === 1 ? "" : "s"}
                </div>
                <div className="mt-1 text-[10px] font-bold opacity-60">
                  {summary.completed} completed
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_350px]">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4 px-1">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-700">
                  Day {selectedDay}
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-[-.045em]">
                  Today&apos;s island flow
                </h2>
              </div>
              <div className="text-sm font-bold text-slate-500">
                {selectedItems.length
                  ? `${selectedItems.length} planned stop${selectedItems.length === 1 ? "" : "s"}`
                  : "No stops scheduled"}
              </div>
            </div>

            {selectedItems.length ? (
              selectedItems.map((item, index) => {
                const status = item.status ?? "planned";
                const isNext = status === "next";
                const isVisited = status === "visited";

                return (
                  <article
                    key={`${item.kind}-${item.id}`}
                    className={`overflow-hidden rounded-[28px] border bg-white shadow-sm transition ${
                      isNext
                        ? "border-[#f0ba42] ring-4 ring-amber-100"
                        : isVisited
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-slate-200"
                    }`}
                  >
                    <div className="grid gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:p-5">
                      <div
                        className="h-28 overflow-hidden rounded-[22px] bg-[#dceee9] bg-cover bg-center"
                        style={
                          item.image
                            ? { backgroundImage: `url('${item.image}')` }
                            : undefined
                        }
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-amber-700">
                              <span>Stop {index + 1}</span>
                              <span className="text-slate-300">·</span>
                              <span>{item.kind}</span>
                              {isNext ? (
                                <span className="rounded-full bg-[#043331] px-2 py-1 text-[7px] text-white">
                                  Up next
                                </span>
                              ) : null}
                              {isVisited ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[7px] text-emerald-800">
                                  <Check className="h-3 w-3" /> Visited
                                </span>
                              ) : null}
                            </div>
                            <Link
                              href={item.href}
                              className={`mt-2 block truncate text-2xl font-black tracking-[-.035em] hover:text-teal-700 ${
                                isVisited ? "text-slate-500 line-through" : ""
                              }`}
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 text-sm font-semibold text-slate-500">
                              {ISLAND_NAMES[item.island]}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveWithinDay(item.id, -1)}
                              disabled={index === 0}
                              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-800 disabled:opacity-25"
                              aria-label={`Move ${item.name} earlier`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveWithinDay(item.id, 1)}
                              disabled={index === selectedItems.length - 1}
                              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-800 disabled:opacity-25"
                              aria-label={`Move ${item.name} later`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(item.id)}
                              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:text-rose-600"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <label className="relative">
                            <select
                              value={item.day}
                              onChange={(event) =>
                                update(item.id, {
                                  day: Number(event.target.value),
                                })
                              }
                              className="appearance-none rounded-full border border-slate-200 bg-[#f8f4ea] py-2 pl-3 pr-8 text-[9px] font-black uppercase tracking-[.13em] outline-none focus:border-teal-500"
                            >
                              {Array.from({ length: days }, (_, i) => i + 1).map(
                                (day) => (
                                  <option key={day} value={day}>
                                    Day {day}
                                  </option>
                                ),
                              )}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5" />
                          </label>

                          <select
                            value={item.timeOfDay}
                            onChange={(event) =>
                              update(item.id, {
                                timeOfDay: event.target
                                  .value as JourneyItem["timeOfDay"],
                              })
                            }
                            className="rounded-full border border-slate-200 bg-[#f8f4ea] px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] outline-none focus:border-teal-500"
                          >
                            {DAYPARTS.map((part) => (
                              <option key={part} value={part}>
                                {part}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => markNext(item.id)}
                            disabled={isVisited}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] transition disabled:opacity-40 ${
                              isNext
                                ? "bg-[#043331] text-white"
                                : "border border-slate-200 bg-white text-[#043331] hover:border-teal-300"
                            }`}
                          >
                            <Play className="h-3.5 w-3.5" />
                            {isNext ? "Next stop" : "Set as next"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleVisited(item.id)}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] transition ${
                              isVisited
                                ? "border border-slate-200 bg-white text-slate-600"
                                : "bg-emerald-700 text-white hover:bg-emerald-800"
                            }`}
                          >
                            {isVisited ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            {isVisited ? "Reopen stop" : "Mark visited"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-teal-700" />
                <h2 className="mt-4 text-2xl font-black">
                  Day {selectedDay} is ready for a stop.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">
                  Open Explore and add a beach, restaurant, attraction, historic site, or stay to this trip.
                </p>
                <Link
                  href="/places"
                  className="mt-6 inline-flex rounded-full bg-[#043331] px-6 py-3 text-[10px] font-black uppercase tracking-[.17em] text-white"
                >
                  Explore the islands
                </Link>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="overflow-hidden rounded-[28px] border border-[#0b5d5b]/10 bg-white shadow-sm">
              <div className="bg-[#043331] p-5 text-white">
                <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
                  Day {selectedDay} · Journey control
                </div>
                <div className="mt-3 text-2xl font-black tracking-[-.04em]">
                  {nextStop ? nextStop.name : "Choose the next stop"}
                </div>
                <div className="mt-2 text-sm font-semibold text-white/60">
                  {nextStop
                    ? `${ISLAND_NAMES[nextStop.island]} · ${nextStop.timeOfDay}`
                    : "Set a planned stop as next to start the day."}
                </div>
              </div>

              <div className="p-5">
                {nextStop ? (
                  <div className="space-y-3">
                    <Link
                      href={nextStop.href}
                      className="flex items-center justify-between rounded-[18px] bg-[#f8f4ea] px-4 py-3 text-sm font-black transition hover:bg-[#edf7f4]"
                    >
                      View stop details <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/map?island=${nextStop.island}`}
                      className="flex items-center justify-between rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-black transition hover:border-teal-300"
                    >
                      Open island map <MapPin className="h-4 w-4 text-teal-700" />
                    </Link>
                    <Link
                      href={`/mobility?island=${nextStop.island}`}
                      className="flex items-center justify-between rounded-[18px] bg-[#f5c451] px-4 py-3 text-sm font-black text-[#043331] transition hover:bg-[#f0ba42]"
                    >
                      Plan transportation <Navigation className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-[20px] bg-[#f8f4ea] p-5 text-center">
                    <Circle className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                      Your next-stop actions will appear here.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">
                Trip readiness
              </div>
              {readiness.length ? (
                <div className="mt-4 space-y-3">
                  {readiness.map((warning) => (
                    <div
                      key={warning}
                      className="flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      {warning}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  {items.length
                    ? "The current day structure has no obvious island-transfer or timing conflicts."
                    : "Add stops to begin the readiness check."}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">
                Trip snapshot
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-black">{items.length}</div>
                  <div className="text-sm font-bold text-slate-500">
                    saved stop{items.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="rounded-full bg-[#edf7f4] px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-800">
                  {progress}% complete
                </div>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-5 text-sm font-semibold leading-6 text-slate-600">
                {islands.length ? islands.join(" · ") : "No island selected yet"}
              </div>
            </section>

            {items.length ? (
              <button
                type="button"
                onClick={() => setItems([])}
                className="w-full rounded-full border border-rose-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-rose-700 transition hover:bg-rose-50"
              >
                Clear trip
              </button>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function readTrip(): JourneyItem[] {
  try {
    const raw = localStorage.getItem(TRIP_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as JourneyItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      day: Number.isFinite(item.day) ? Math.max(1, Math.round(item.day)) : 1,
      timeOfDay: DAYPARTS.includes(item.timeOfDay)
        ? item.timeOfDay
        : "flexible",
      status:
        item.status === "next" || item.status === "visited"
          ? item.status
          : "planned",
    }));
  } catch {
    return [];
  }
}

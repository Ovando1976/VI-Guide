import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { BUSINESS_COVERAGE_SUBMISSION_HREF } from "@/lib/market-coverage";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_ISLAND_LABELS,
  formatEventDate,
  getUpcomingEvents,
  type EventCategory,
  type EventIsland,
  type UsviEvent,
} from "@/lib/events";

export const metadata: Metadata = {
  title: "Events | VI Guide",
  description:
    "Discover source-backed upcoming events across St. Thomas, St. John, and St. Croix, then connect them to maps, transportation, Concierge, and My Trip.",
};

type SearchParams = {
  island?: string;
  category?: string;
};

const ISLAND_FILTERS: Array<{ value: "all" | EventIsland; label: string }> = [
  { value: "all", label: "All islands" },
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
];

const CATEGORY_FILTERS: Array<{ value: "all" | EventCategory; label: string }> = [
  { value: "all", label: "All events" },
  ...Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as EventCategory,
    label,
  })),
];

export default function EventsPage({
  searchParams = {},
}: {
  searchParams?: SearchParams;
}) {
  const island = normalizeIsland(searchParams.island);
  const category = normalizeCategory(searchParams.category);
  const upcoming = getUpcomingEvents();
  const events = upcoming.filter(
    (event) =>
      (!island || event.island === island) &&
      (!category || event.category === category),
  );
  const featured = events.find((event) => event.featured) ?? events[0] ?? upcoming[0];

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/concierge?prompt=Help%20me%20choose%20an%20upcoming%20Virgin%20Islands%20event%20and%20build%20a%20realistic%20day%20around%20it%20with%20transportation%20and%20timing."
          actionLabel="Plan with Concierge"
          actionIcon={Sparkles}
          secondaryHref="/trips"
          secondaryLabel="My Trip"
        />
      </div>

      <section className="mx-auto mt-5 max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.34),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,.18),transparent_30%),linear-gradient(145deg,#032f2d,#075e58)] px-6 py-9 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:px-9 sm:py-12 lg:px-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                <CalendarDays className="h-4 w-4" /> Events · verified sources
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
                Know what&apos;s happening, then build the island day around it.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/70">
                VI Guide now connects upcoming cultural, culinary, sports, heritage,
                and festival listings with the Living Map, transportation planning,
                Concierge, and your trip workspace.
              </p>
            </div>

            {featured ? (
              <Link
                href={`/events/${featured.slug}`}
                className="group rounded-[30px] border border-white/12 bg-white/[.08] p-6 backdrop-blur transition hover:bg-white/[.12]"
              >
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                  Coming up
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
                  {featured.name}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
                  {formatEventDate(featured)} · {EVENT_ISLAND_LABELS[featured.island]}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-white">
                  Open event <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-9">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <FilterGroup
              label="Island"
              entries={ISLAND_FILTERS}
              active={island ?? "all"}
              buildHref={(value) => buildFilterHref(value === "all" ? null : value, category)}
            />
            <FilterGroup
              label="Type"
              entries={CATEGORY_FILTERS}
              active={category ?? "all"}
              buildHref={(value) => buildFilterHref(island, value === "all" ? null : value)}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-600">
              Upcoming calendar
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">
              {events.length} source-backed {events.length === 1 ? "event" : "events"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
          <Link href={BUSINESS_COVERAGE_SUBMISSION_HREF} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 text-[9px] font-black uppercase tracking-[.14em] text-teal-800">Submit a missing event</Link>
          <a
            href="https://www.visitusvi.com/carnivals-festivals/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] shadow-sm"
          >
            Official Visit USVI calendar <ArrowRight className="h-4 w-4" />
          </a>
          </div>
        </div>

        {events.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-4 text-2xl font-black">No event matches this filter yet.</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Clear one of the filters or ask Concierge for another date, island, or kind of activity.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex rounded-full bg-[#043331] px-6 py-3 text-[9px] font-black uppercase tracking-[.15em] text-white"
            >
              Show all events
            </Link>
          </div>
        )}

        <section className="mt-10 rounded-[30px] border border-teal-200 bg-teal-50 p-6 sm:p-8">
          <div className="flex gap-4">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                Source discipline
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                Event dates can change. VI Guide shows when each record was verified.
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-teal-950/65">
                Each listing links back to its official tourism source. Check the official
                event page before paying, traveling across islands, or relying on a start time.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function EventCard({ event }: { event: UsviEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex min-h-[360px] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl"
    >
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_34%),linear-gradient(145deg,#043331,#0b7770)] p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.15em] text-[#f5c451]">
            {EVENT_CATEGORY_LABELS[event.category]}
          </span>
          <CalendarDays className="h-5 w-5 text-[#7ce0d4]" />
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[.18em] text-white/55">
          {EVENT_ISLAND_LABELS[event.island]}
        </p>
        <h3 className="mt-2 text-3xl font-black leading-[.95] tracking-[-.045em]">
          {event.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="space-y-3 text-xs font-bold text-slate-500">
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            {formatEventDate(event)}
          </p>
          {event.timeLabel ? (
            <p className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              {event.timeLabel}
            </p>
          ) : null}
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            {event.location}
          </p>
        </div>
        <p className="mt-5 line-clamp-4 text-sm font-semibold leading-6 text-slate-600">
          {event.description}
        </p>
        <div className="mt-auto pt-6">
          <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-teal-800">
            Plan around this event <Route className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterGroup<T extends string>({
  label,
  entries,
  active,
  buildHref,
}: {
  label: string;
  entries: Array<{ value: T; label: string }>;
  active: T;
  buildHref: (value: T) => string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[.17em] text-slate-400">{label}</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {entries.map((entry) => (
          <Link
            key={entry.value}
            href={buildHref(entry.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-[9px] font-black uppercase tracking-[.13em] transition ${
              active === entry.value
                ? "bg-[#043331] text-white"
                : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:border-teal-300"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildFilterHref(
  island: EventIsland | null,
  category: EventCategory | null,
) {
  const params = new URLSearchParams();
  if (island) params.set("island", island);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/events?${query}` : "/events";
}

function normalizeIsland(value: string | undefined): EventIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

function normalizeCategory(value: string | undefined): EventCategory | null {
  return value && value in EVENT_CATEGORY_LABELS ? (value as EventCategory) : null;
}

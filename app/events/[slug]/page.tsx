import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_ISLAND_LABELS,
  formatEventDate,
  getEventBySlug,
  USVI_EVENTS,
} from "@/lib/events";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return USVI_EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return { title: "Event | VI Guide" };

  return {
    title: `${event.name} | VI Guide Events`,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const islandName = EVENT_ISLAND_LABELS[event.island];
  const mapParams = new URLSearchParams({
    island: event.island,
    q: event.location,
  });
  const mapHref = `/map?${mapParams.toString()}`;
  const conciergePrompt = [
    `Help me plan around ${event.name} on ${formatEventDate(event)}.`,
    `It is listed for ${event.location} on ${islandName}.`,
    "Build a realistic plan with transportation, arrival timing, food nearby, what to do before or after, and a backup if details change.",
  ].join(" ");

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref={`/concierge?island=${event.island}&prompt=${encodeURIComponent(conciergePrompt)}`}
          actionLabel="Plan with Concierge"
          actionIcon={Sparkles}
          secondaryHref="/trips"
          secondaryLabel="My Trip"
        />
      </div>

      <section className="mx-auto mt-5 max-w-6xl px-4 sm:px-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>

        <div className="mt-5 overflow-hidden rounded-[38px] border border-white/50 bg-[#043331] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)]">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.34),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,.2),transparent_30%),linear-gradient(145deg,#032f2d,#075e58)] px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.16em] text-[#f5c451]">
                {EVENT_CATEGORY_LABELS[event.category]}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.16em] text-white/70">
                {islandName}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.16em] text-white/70">
                Verified {event.verifiedAt}
              </span>
            </div>

            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
              {event.name}
            </h1>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-white/72">
              {event.description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <EventFact
                icon={CalendarDays}
                label="Date"
                value={formatEventDate(event)}
              />
              <EventFact
                icon={MapPin}
                label="Location"
                value={event.location}
              />
              <EventFact
                icon={Clock3}
                label="Time"
                value={event.timeLabel ?? "Check official schedule"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-9">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">
              Plan the whole event day
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">
              The event is one stop. VI Guide connects everything around it.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
              Use Concierge to work backward from the event time, choose a realistic
              arrival window, connect the nearest transportation option, and add food,
              beaches, heritage, or another activity without risking the main event.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/concierge?island=${event.island}&prompt=${encodeURIComponent(conciergePrompt)}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
              >
                <Sparkles className="h-4 w-4 text-[#f5c451]" /> Build my event day
              </Link>
              <Link
                href={mapHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
              >
                <MapPin className="h-4 w-4 text-teal-700" /> Open Living Map
              </Link>
              <Link
                href="/trips"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
              >
                <Route className="h-4 w-4 text-teal-700" /> My Trip
              </Link>
            </div>
          </section>

          <section className="rounded-[30px] border border-teal-200 bg-teal-50 p-6 sm:p-8">
            <div className="flex gap-4">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                  Verify before you go
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                  Official event details can change after VI Guide verifies a listing.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-teal-950/65">
                  Confirm the official source before purchasing tickets, making an
                  inter-island transfer, or depending on a specific start or end time.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
            Source record
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
            {event.sourceLabel}
          </h2>
          <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-700" /> Verified {event.verifiedAt}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-teal-700" /> {formatEventDate(event)}
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" /> {event.location}
            </p>
          </div>
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f5b942] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
          >
            Open official listing <ExternalLink className="h-4 w-4" />
          </a>
        </aside>
      </section>
    </main>
  );
}

function EventFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.08] p-5 backdrop-blur">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[8px] font-black uppercase tracking-[.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-6">{value}</p>
    </div>
  );
}

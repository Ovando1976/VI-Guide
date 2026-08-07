import Link from "next/link";
import type { Metadata } from "next";
import {
  Anchor,
  ArrowRight,
  CalendarSearch,
  CheckCircle2,
  Compass,
  LifeBuoy,
  Route,
  ShipWheel,
  TicketCheck,
} from "lucide-react";

import { CruiseHubNav } from "@/components/cruise/cruise-hub-nav";
import { CruiseInventoryGateway } from "@/components/cruise/cruise-inventory-gateway";

export const metadata: Metadata = {
  title: "Cruise Hub | VI Guide",
  description:
    "Plan the cruise, verify USVI port calls, match capacity-aware shore excursions, request advisor help, and keep the trip connected inside one VI Guide cruise hub.",
};

export default function CruisesPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-28 text-[#043331]">
      <section className="px-4 pt-8 sm:px-6 lg:pt-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[42px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.42),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,164,.18),transparent_30%),linear-gradient(145deg,#022e3b,#075e59)] p-8 text-white shadow-[0_34px_100px_rgba(4,51,49,.24)] sm:p-12 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.23em] text-[#f5c451]">
                <ShipWheel className="h-4 w-4" /> VI Guide Cruise Hub
              </p>
              <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[.9] tracking-[-.065em] sm:text-7xl">
                One cruise plan, from sailing search to the last port day.
              </h1>
              <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-white/72">
                Start with a sailing, resolve the Virgin Islands port call against
                official schedules, match local options to the ship clock and operator
                capacity, and keep every booking inside one connected trip.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#sailings"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
                >
                  Find a sailing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/cruises/port-calls"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
                >
                  Official port calls <Anchor className="h-4 w-4 text-[#f5c451]" />
                </Link>
                <Link
                  href="/shore-excursions"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
                >
                  Plan my port day <Compass className="h-4 w-4 text-[#f5c451]" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroSignal
                icon={CalendarSearch}
                title="Find the cruise"
                text="Search connected inventory when available or hand the brief to an advisor."
              />
              <HeroSignal
                icon={Anchor}
                title="Resolve the port call"
                text="Use official VIPA and WICO schedule context before treating a local option as a ship-day fit."
              />
              <HeroSignal
                icon={Compass}
                title="Build the port days"
                text="Match local excursions to the terminal, operator capacity, and protected return window."
              />
              <HeroSignal
                icon={TicketCheck}
                title="Keep it together"
                text="Bookings and trip planning stay inside the same VI Guide journey."
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <CruiseHubNav />
      </div>

      <section className="px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PathCard
              number="01"
              icon={CalendarSearch}
              title="Find a sailing"
              text="Use connected inventory when it is available. If supplier access is still limited, move directly into the advisor workflow without losing the planning context."
              href="#sailings"
              cta="Search sailings"
            />
            <PathCard
              number="02"
              icon={Anchor}
              title="Check official calls"
              text="See upcoming USVI calls from the loaded VIPA and WICO schedules, including terminal and published arrival/departure windows."
              href="/cruises/port-calls"
              cta="See port calls"
            />
            <PathCard
              number="03"
              icon={Compass}
              title="Plan the port day"
              text="Use capacity-verified matches when available, with operator hours, active request demand, duration, and return-to-ship rules applied."
              href="/shore-excursions"
              cta="Browse port days"
            />
            <PathCard
              number="04"
              icon={LifeBuoy}
              title="Ask an advisor"
              text="Send one structured brief for ship, cabin, budget, accessibility, celebration, and Caribbean itinerary research."
              href="/cruises/plan"
              cta="Start advisor brief"
            />
          </div>
        </div>
      </section>

      <section id="sailings" className="scroll-mt-6 pb-4">
        <CruiseInventoryGateway />
      </section>

      <section className="px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl rounded-[36px] border border-teal-900/10 bg-white p-6 shadow-sm sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                The connected journey
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.05em]">
                The cruise is not a separate product from the Virgin Islands trip.
              </h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                VI Guide understands the voyage, the official port-call context, the
                traveler&apos;s local plans, operator capacity, and the bookings as one
                itinerary. That is the organizing principle of this hub.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/planner"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white"
                >
                  <Route className="h-4 w-4 text-[#f5c451]" /> Open My Trip
                </Link>
                <Link
                  href="/bookings"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.13em]"
                >
                  <TicketCheck className="h-4 w-4 text-teal-700" /> My bookings
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <JourneyStep
                title="Sailing context"
                text="Ship, dates, departure port, destinations, cabin and traveler preferences."
              />
              <JourneyStep
                title="Official port-call context"
                text="Island, terminal, published arrival/departure, source revision, and conservative planning all-aboard."
              />
              <JourneyStep
                title="Local fulfillment"
                text="Operator hours, current capacity, pickup, excursion duration, mobility needs and guest count."
              />
              <JourneyStep
                title="Trip continuity"
                text="Bookings, alerts, itinerary handoffs and concierge recommendations stay connected."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroSignal({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShipWheel;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[.07] p-5">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <h2 className="mt-4 text-lg font-black tracking-[-.03em]">{title}</h2>
      <p className="mt-2 text-xs font-semibold leading-5 text-white/60">{text}</p>
    </div>
  );
}

function PathCard({
  number,
  icon: Icon,
  title,
  text,
  href,
  cta,
}: {
  number: string;
  icon: typeof ShipWheel;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
          {number}
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <h2 className="mt-6 text-2xl font-black tracking-[-.04em]">{title}</h2>
      <p className="mt-3 flex-1 text-sm font-semibold leading-7 text-slate-600">{text}</p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-800"
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function JourneyStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] bg-[#f8f4ea] p-5">
      <CheckCircle2 className="h-5 w-5 text-teal-700" />
      <h3 className="mt-4 text-sm font-black">{title}</h3>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  );
}

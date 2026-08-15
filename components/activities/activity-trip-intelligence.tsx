import Link from "next/link";
import { ArrowRight, CalendarClock, CarFront, CloudSun, MapPinned, Sparkles } from "lucide-react";

const TRIP_ACTIONS = [
  {
    title: "Build the whole day",
    detail: "Let Concierge combine the activity with realistic timing, food, nearby stops, and a backup plan.",
    href: "/concierge?prompt=Build%20me%20a%20complete%20USVI%20activity%20day%20with%20realistic%20timing%2C%20food%2C%20transportation%2C%20nearby%20stops%2C%20and%20a%20backup%20plan",
    icon: Sparkles,
    action: "Plan with AI",
  },
  {
    title: "Solve transportation",
    detail: "Plan the ride before you commit so departure points, ferry connections, and return timing do not become surprises.",
    href: "/mobility",
    icon: CarFront,
    action: "Plan a ride",
  },
  {
    title: "See it on the islands",
    detail: "Use the Living Map to understand where the experience sits relative to beaches, towns, ports, and your other plans.",
    href: "/map",
    icon: MapPinned,
    action: "Open map",
  },
];

export function ActivityTripIntelligence() {
  return (
    <section className="border-b border-[#d8e4e0] bg-[#032f2d] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#73e3d9]">
              <CalendarClock className="h-4 w-4" /> Trip intelligence
            </div>
            <h2 className="vi-display mt-2 max-w-xl text-3xl font-bold leading-none sm:text-4xl">
              Do not book an activity in isolation.
            </h2>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/62">
              USVI Explorer connects the experience to transportation, island geography, timing, weather-sensitive alternatives, and the rest of your day.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-[#f5c451]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-[#f8d77c]">
              <CloudSun className="h-4 w-4" /> Keep a weather backup ready
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {TRIP_ACTIONS.map(({ title, detail, href, icon: Icon, action }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[190px] flex-col rounded-[24px] border border-white/10 bg-white/[.07] p-5 transition hover:-translate-y-1 hover:border-[#73e3d9]/35 hover:bg-white/[.1]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#73e3d9]/12 text-[#73e3d9]">
                  <Icon className="h-5 w-5" />
                </span>
                <strong className="mt-4 text-lg font-black leading-tight">{title}</strong>
                <span className="mt-2 flex-1 text-xs font-semibold leading-5 text-white/58">{detail}</span>
                <span className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-[#f5c451]">
                  {action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

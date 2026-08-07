import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  Car,
  HeartHandshake,
  MapPinned,
  Sparkles,
} from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import { UsviTripPlanner } from "@/components/planner/usvi-trip-planner";

export const metadata: Metadata = {
  title: "Plan Your USVI Trip | VI Guide",
  description:
    "Plan a personalized U.S. Virgin Islands trip with VI Guide, VI Concierge, and guidance from a trained USVI Travel Specialist.",
};

const SUPPORT = [
  {
    title: "Stay planning",
    description:
      "Compare the right island, neighborhood, hotel, resort, or villa for the way you want to travel.",
    icon: BedDouble,
  },
  {
    title: "Island logistics",
    description:
      "Build realistic days around ferries, taxis, drives, cruise calls, and the time it actually takes to move around.",
    icon: Car,
  },
  {
    title: "Local experiences",
    description:
      "Connect beaches, food, heritage, excursions, and local context into one coherent itinerary.",
    icon: MapPinned,
  },
] as const;

export default function TripPlanningPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] pb-24 text-[#073b39]">
      <section className="relative isolate overflow-hidden border-b border-[#d8e4e0] px-4 pb-16 pt-5 sm:px-8 lg:px-12 lg:pb-20">
        <div className="absolute inset-0 -z-30">
          <Image
            src="/images/usvi-harbor-hero.jpg"
            alt="U.S. Virgin Islands harbor and hillside"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,251,241,.97)_0%,rgba(255,251,241,.9)_48%,rgba(255,255,255,.26)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,.12)_0%,rgba(247,243,234,.88)_100%)]" />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/76 px-4 py-3 shadow-[0_14px_40px_rgba(4,51,49,.10)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="VI Guide home">
            <ViBrandMark className="h-11 w-11" priority />
            <div>
              <div className="font-serif text-xl font-bold tracking-[.02em]">VI Guide</div>
              <div className="text-[8px] font-black uppercase tracking-[.25em] text-[#b16a18]">
                U.S. Virgin Islands
              </div>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#0f766e]/20 bg-white/90 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em]"
          >
            <ArrowLeft size={14} /> Home
          </Link>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0f766e]/15 bg-white/80 px-4 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#0f766e] shadow-sm backdrop-blur">
              <Sparkles size={14} /> Personal USVI trip planning
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(3.5rem,7vw,6.6rem)] font-semibold leading-[.88] tracking-[-.055em]">
              Plan the trip.<br />
              <span className="italic text-[#159b91]">Keep the island magic.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-[#274c49] sm:text-lg">
              Start with the way you want to travel. VI Guide turns your dates, budget, interests, stays, and transportation needs into a practical U.S. Virgin Islands itinerary you can keep refining with VI Concierge.
            </p>
          </div>

          <aside className="rounded-[30px] border border-white/80 bg-[#073b39]/96 p-6 text-white shadow-[0_28px_70px_rgba(4,51,49,.18)] backdrop-blur sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f5c451] text-[#073b39]">
                <BadgeCheck size={24} />
              </span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                  Traveler trust
                </div>
                <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-.035em]">
                  USVI Travel Specialist guided.
                </h2>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold leading-6 text-white/72">
              VI Guide founder Ovando Rawlins has completed the United States Virgin Islands advisor training course and is designated a USVI Travel Specialist. That training supports the human travel-advisory layer behind VI Concierge.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.07] p-4 text-xs font-semibold leading-5 text-white/65">
              VI Guide describes the credential in plain language and does not use tourism-program logos or certificate artwork here unless branding permission is confirmed.
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {SUPPORT.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[26px] border border-[#d8e5e1] bg-white p-6 shadow-[0_14px_40px_rgba(4,51,49,.07)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f7f3] text-[#0f766e]">
                <Icon size={21} />
              </span>
              <h2 className="mt-4 text-xl font-black tracking-[-.025em]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {description}
              </p>
            </article>
          ))}
        </div>

        <UsviTripPlanner />

        <div className="mt-8 rounded-[28px] border border-[#d8e5e1] bg-white px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff1d4] text-[#a85b16]">
                <HeartHandshake size={19} />
              </span>
              <div>
                <h2 className="text-lg font-black">Already have an itinerary?</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Open the full journey planner to save, edit, map, route, and share it.
                </p>
              </div>
            </div>
            <Link
              href="/planner"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f766e] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-white"
            >
              Open journey planner <Sparkles size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

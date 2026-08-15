import Link from "next/link";
import { Anchor, CarFront, Clock3, CloudSun, Ship, Sparkles } from "lucide-react";

const SIGNALS = [
  {
    icon: Clock3,
    label: "Duration",
    title: "Protect the rest of the day",
    text: "Use the listed trip length as a planning anchor, then leave room for check-in, loading, return traffic, and ferry connections.",
  },
  {
    icon: Anchor,
    label: "Departure point",
    title: "Know where the experience really starts",
    text: "Marina, beach, resort, harbor, and trailhead departures can change the best operator even when two activities look similar.",
  },
  {
    icon: Ship,
    label: "Cruise day",
    title: "Work backward from all-aboard",
    text: "Cruise visitors should prioritize return margin and port geography before price or an extra stop.",
  },
  {
    icon: CloudSun,
    label: "Conditions",
    title: "Treat weather as part of the booking",
    text: "Marine, hiking, and evening experiences can shift with wind, swell, rain, visibility, or seasonal conditions.",
  },
];

export function ActivityBookingIntelligence() {
  return (
    <section className="rounded-[34px] border border-[#d9e6e2] bg-[#fffdf8] p-5 shadow-[0_18px_50px_rgba(4,51,49,.08)] sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="vi-eyebrow text-[#0f766e]">Before you request</p>
          <h2 className="vi-display mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Compare the trip around the activity, not only the activity.</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#607370]">USVI geography makes departure point, transfer time, weather exposure, and return margin part of the product. Use these signals before committing.</p>
        </div>
        <Link href="/concierge?prompt=Compare%20USVI%20activities%20for%20my%20trip%20using%20departure%20point%2C%20duration%2C%20transportation%2C%20weather%2C%20and%20return%20margin" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#075e58]">
          <Sparkles className="h-4 w-4 text-[#73e3d9]" /> Compare with Concierge
        </Link>
      </div>
      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {SIGNALS.map(({ icon: Icon, label, title, text }) => (
          <article key={label} className="rounded-[24px] border border-[#dce7e4] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eaf8f5] text-[#0f766e]"><Icon className="h-5 w-5" /></span>
              <span className="text-[8px] font-black uppercase tracking-[.14em] text-[#9b5d12]">{label}</span>
            </div>
            <h3 className="mt-4 text-base font-black text-[#032f2d]">{title}</h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-[#607370]">{text}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-[22px] bg-[#eaf8f5] p-4 text-[#35514e]">
        <CarFront className="mt-0.5 h-5 w-5 shrink-0 text-[#0f766e]" />
        <p className="text-xs font-semibold leading-5"><strong className="text-[#032f2d]">Transportation is part of the choice.</strong> After selecting an operator, use Mobility to solve the pickup and return legs instead of treating them as a separate problem.</p>
      </div>
    </section>
  );
}

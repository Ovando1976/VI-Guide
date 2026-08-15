import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  CloudSun,
  MapPin,
  Sparkles,
  UsersRound,
} from "lucide-react";

const FITS = [
  {
    title: "Match the time window",
    detail: "Compare duration, departure timing, and what still fits before or after the activity.",
    icon: Clock3,
    href: "/concierge?prompt=Help%20me%20choose%20a%20USVI%20activity%20that%20fits%20my%20available%20time.%20Ask%20about%20my%20island%2C%20date%2C%20arrival%20or%20departure%20time%2C%20and%20other%20plans.",
  },
  {
    title: "Check the pickup geography",
    detail: "Make the departure point part of the decision so the day does not break around transportation.",
    icon: MapPin,
    href: "/concierge?prompt=Compare%20USVI%20activities%20by%20departure%20point%20and%20transportation.%20Ask%20where%20I%20am%20staying%20and%20how%20I%20plan%20to%20get%20around.",
  },
  {
    title: "Plan for weather exposure",
    detail: "Water, wind, rain, and heat can change the best choice. Keep a realistic backup in the same part of the island.",
    icon: CloudSun,
    href: "/concierge?prompt=Build%20me%20a%20weather-aware%20USVI%20activity%20plan%20with%20a%20good%20backup%20nearby.",
  },
  {
    title: "Fit the whole group",
    detail: "Account for ages, mobility, swimming confidence, luggage, and the pace your group actually wants.",
    icon: UsersRound,
    href: "/concierge?prompt=Help%20me%20choose%20a%20USVI%20activity%20for%20my%20group.%20Ask%20about%20ages%2C%20mobility%2C%20swimming%20ability%2C%20luggage%2C%20and%20preferred%20pace.",
  },
];

export function ActivityFitGuide() {
  return (
    <section className="border-b border-[#d8e4e0] bg-[#f5f0e6] px-4 py-8 text-[#032f2d] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="vi-eyebrow text-[#9b5d12]">Choose by trip fit</p>
            <h2 className="vi-display mt-2 max-w-3xl text-3xl font-bold sm:text-4xl">
              The best activity is the one that fits the rest of your day.
            </h2>
          </div>
          <Link
            href="/concierge?prompt=Compare%20the%20best%20USVI%20activities%20for%20my%20trip%20using%20timing%2C%20transportation%2C%20weather%2C%20group%20needs%2C%20and%20backup%20options."
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#075e58]"
          >
            <Sparkles className="h-4 w-4 text-[#73e3d9]" /> Compare my fit
            <ArrowRight className="h-4 w-4 text-[#f5c451]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FITS.map(({ title, detail, icon: Icon, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-[24px] border border-[#d5e4df] bg-[#fffdf8] p-5 shadow-[0_12px_34px_rgba(4,51,49,.06)] transition hover:-translate-y-0.5 hover:border-[#aad7d0] hover:shadow-[0_18px_42px_rgba(4,51,49,.10)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf8f5] text-[#0f766e]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-black">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#657875]">{detail}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[.12em] text-[#0f766e]">
                Use this filter <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  CalendarCheck2,
  Check,
  ChevronRight,
  MapPinned,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

export const metadata = {
  title: "Founding 50 Business Partners | USVI Explorer",
  description:
    "Join the first 50 St. Thomas businesses building the visitor-to-business network on USVI Explorer.",
};

const PILOT_STEPS = [
  {
    number: "01",
    title: "We build your profile",
    text: "USVI Explorer prepares your business presence with your services, location, photos, contact details, and visitor-facing information.",
  },
  {
    number: "02",
    title: "We connect you to the journey",
    text: "Your business can appear in relevant discovery, map, trip-planning, and concierge contexts when it fits what a traveler is asking for.",
  },
  {
    number: "03",
    title: "We measure engagement",
    text: "We track the visitor actions available to us, including profile engagement, outbound clicks, inquiries, and booking handoffs where supported.",
  },
  {
    number: "04",
    title: "We review the results",
    text: "At the end of the pilot, you decide whether continued Founding Partner participation makes business sense.",
  },
] as const;

const INCLUDED = [
  "Enhanced USVI Explorer business profile",
  "Relevant map and discovery placement",
  "Eligibility for grounded Concierge recommendations",
  "Trip-plan and itinerary discovery where relevant",
  "Direct inquiry / booking handoff capability",
  "Partner performance reporting as available",
  "Founding Partner rate of $149/month after the pilot",
  "No long-term contract",
] as const;

export default function Founding50Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f1e7] text-[#043331]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_8%,rgba(245,196,81,.24),transparent_25%),radial-gradient(circle_at_15%_70%,rgba(115,227,217,.12),transparent_32%),linear-gradient(135deg,#021f1d,#07534e_58%,#032f2d)]" />
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="px-4 pt-5 sm:px-7 lg:px-10">
          <ViPublicHeader
            actionHref="/partners/apply"
            actionLabel="Apply for the pilot"
            actionIcon={ArrowRight}
            secondaryHref="/partners"
            secondaryLabel="Business network"
          />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-7 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-24 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f8d77c]">
              <Users className="h-4 w-4" />
              Founding 50 · St. Thomas
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(3.4rem,7vw,6.8rem)] font-bold leading-[.84]">
              Turn visitor intent
              <span className="block italic text-[#73e3d9]">into your next customer.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/70 sm:text-xl">
              USVI Explorer is building the digital layer between a visitor's
              question and the local business that can answer it. We are inviting
              the first 50 St. Thomas businesses to test that model with us.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/partners/apply"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-7 text-[10px] font-black uppercase tracking-[.16em] text-[#173c39] shadow-xl transition hover:-translate-y-0.5"
              >
                Apply for the 30-day pilot
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/partners"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.06] px-7 text-[10px] font-black uppercase tracking-[.16em] text-white backdrop-blur"
              >
                Explore the partner network
              </Link>
            </div>

            <p className="mt-4 text-xs font-semibold text-white/45">
              No application fee. No long-term contract. We do not promise bookings or
              traffic we cannot measure.
            </p>
          </div>

          <aside className="rounded-[34px] border border-white/10 bg-white/[.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#f5c451]">
                  Founding offer
                </p>
                <p className="mt-2 text-3xl font-black">$0</p>
                <p className="text-sm font-semibold text-white/45">for the first 30 days</p>
              </div>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#73e3d9]/10 text-[#73e3d9]">
                <BadgeCheck className="h-7 w-7" />
              </span>
            </div>

            <div className="my-7 h-px bg-white/10" />

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/40">
                  If you continue
                </p>
                <p className="mt-2 text-4xl font-black">$149<span className="text-base font-bold text-white/40">/month</span></p>
              </div>
              <span className="rounded-full bg-[#f5c451]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-[#f8d77c]">
                Founding rate
              </span>
            </div>

            <div className="mt-7 space-y-3">
              {["Built for visitor discovery", "Measured engagement", "Listing-scoped access", "Cancel anytime"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-white/75">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#73e3d9]/10 text-[#73e3d9]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9a6a1f]">The difference</p>
          <h2 className="vi-display mt-3 text-4xl font-bold leading-[.92] sm:text-6xl">
            This is not another directory listing.
          </h2>
          <p className="mt-5 text-base font-semibold leading-8 text-[#526762] sm:text-lg">
            A directory tells a traveler that your business exists. Our goal is to
            connect the business to a real decision: what should I do, where should I
            go, how do I get there, and how can I contact or book the operator?
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          <ValueCard icon={MapPinned} title="Discovery" text="Reach travelers while they are actively exploring the islands and deciding what belongs in their day." />
          <ValueCard icon={Sparkles} title="Concierge context" text="Become eligible for relevant recommendations when your business actually matches the traveler's request." />
          <ValueCard icon={CalendarCheck2} title="Conversion" text="Carry the visitor from discovery toward inquiry, booking, and service operations where the product supports it." />
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9a6a1f]">The 30-day pilot</p>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.92] sm:text-5xl">
              We do the setup. You judge the value.
            </h2>
            <p className="mt-5 text-sm font-semibold leading-7 text-slate-500">
              The pilot is designed to remove the biggest risk for a local operator:
              paying for a marketing channel before seeing how it performs.
            </p>
          </div>

          <div className="grid gap-3">
            {PILOT_STEPS.map((step) => (
              <article key={step.number} className="grid gap-4 rounded-[26px] border border-slate-200 bg-[#fbfaf7] p-5 sm:grid-cols-[64px_1fr] sm:p-6">
                <span className="font-mono text-sm font-black text-[#0b766d]">{step.number}</span>
                <div>
                  <h3 className="text-xl font-black tracking-[-.03em]">{step.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_.85fr]">
          <div className="rounded-[34px] bg-[#032f2d] p-7 text-white sm:p-10">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">What's included</p>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.92] sm:text-5xl">
              A partner presence built around the visitor.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.05] p-4 text-sm font-bold text-white/72">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#73e3d9]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-[#eadcae] bg-[#fff7df] p-7 sm:p-10">
            <ShieldCheck className="h-7 w-7 text-[#9a6a1f]" />
            <h2 className="mt-5 text-3xl font-black tracking-[-.04em]">Professional by design.</h2>
            <div className="mt-6 space-y-5">
              <TrustPoint icon={BarChart3} title="No vanity metrics" text="We distinguish engagement from actual inquiries and booking outcomes." />
              <TrustPoint icon={MessageSquareText} title="Human review" text="Partner applications are reviewed and listing access stays scoped to approved businesses." />
              <TrustPoint icon={BadgeCheck} title="Clear commercial terms" text="The pilot is free. Continued Founding Partner participation is $149/month with no long-term contract." />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-[38px] bg-[linear-gradient(135deg,#073b38,#0b6b64)] p-8 text-center text-white shadow-2xl sm:p-12">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">St. Thomas · Founding 50</p>
          <h2 className="vi-display mx-auto mt-4 max-w-3xl text-5xl font-bold leading-[.88] sm:text-6xl">
            Let's prove the channel before you pay for it.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/60">
            Apply now. We'll review your business, prepare the listing, and contact you
            about the pilot and next steps.
          </p>
          <Link
            href="/partners/apply"
            className="mt-8 inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[#f5c451] px-8 text-[10px] font-black uppercase tracking-[.16em] text-[#173c39] shadow-xl"
          >
            Start the partner application
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function ValueCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPinned;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0b766d]/10 text-[#0b766d]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-xl font-black tracking-[-.03em]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text}</p>
    </article>
  );
}

function TrustPoint({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof BarChart3;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0b766d] shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#6e5c38]">{text}</p>
      </div>
    </div>
  );
}

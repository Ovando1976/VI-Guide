import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

export const metadata = {
  title: "USVI Explorer Partners",
  description:
    "Apply to partner with USVI Explorer or privately check an existing business application.",
};

const NETWORK_BENEFITS = [
  {
    icon: MapPinned,
    title: "Discovery that leads somewhere",
    text: "Connect a local business to island discovery, the Living Map, traveler shortlists, and relevant trip context.",
  },
  {
    icon: Sparkles,
    title: "Concierge consideration",
    text: "Approved listings can become eligible for grounded recommendations when the business fits the traveler’s request.",
  },
  {
    icon: CalendarCheck2,
    title: "Booking operations",
    text: "Use USVI Explorer workflows for availability, booking requests, deposits, confirmations, and practical service operations.",
  },
] as const;

export default function PartnersPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-12 pt-5 text-white sm:px-7 lg:px-10 lg:pb-16">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and hillside businesses in St. Thomas"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.99)_0%,rgba(3,47,45,.95)_46%,rgba(3,47,45,.58)_78%,rgba(3,47,45,.28)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(245,196,81,.18),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.04),rgba(2,31,29,.55))]" />

        <ViPublicHeader
          actionHref="/partners/apply"
          actionLabel="Apply to partner"
          actionIcon={Building2}
          secondaryHref="/partners/status"
          secondaryLabel="Check status"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f8d77c] backdrop-blur-xl">
              <Building2 size={14} /> USVI Explorer business network
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Put local businesses
              <span className="block italic text-[#73e3d9]">inside the traveler journey.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/74 sm:text-xl sm:leading-8">
              USVI Explorer connects Virgin Islands businesses to discovery, Concierge recommendations, trip planning, booking requests, secure payments, and practical operations without turning local commerce into a generic marketplace.
            </p>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="vi-eyebrow text-[#f5c451]">Partner access is reviewed</div>
            <h2 className="vi-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              A form submission never creates merchant access by itself.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
              USVI Explorer verifies the business, resolves the correct listing, and grants listing-scoped access only after review. That protects travelers, merchants, and the integrity of the directory.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-xs font-semibold leading-5 text-white/56">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#73e3d9]" />
              Application status can be checked privately with the reference and contact email. Internal review notes remain private.
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <PartnerAction
            icon={Building2}
            eyebrow="New business"
            title="Apply to join the network"
            text="Tell USVI Explorer what the business offers, where it operates, and which discovery, booking, or operating tools would create the most value."
            href="/partners/apply"
            label="Start application"
            image="/images/places/st-john/trunk-bay-overlook-1.jpg"
          />
          <PartnerAction
            icon={Search}
            eyebrow="Application already submitted"
            title="Check the public review stage"
            text="Use the application reference and the same contact email to privately see the current review status without exposing internal notes."
            href="/partners/status"
            label="Check status"
            image="/images/accommodations/king-christian-hotel.jpg"
          />
        </div>

        <section className="mt-10 rounded-[36px] bg-[#032f2d] p-6 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-9 lg:p-11">
          <div className="max-w-3xl">
            <div className="vi-eyebrow text-[#f5c451]">What partnership means</div>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
              Be useful at the moment a traveler is making a decision.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/60 sm:text-base">
              The goal is not simply another directory profile. USVI Explorer should connect the right local operator or business to the right traveler context, then carry that decision into the rest of the trip.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {NETWORK_BENEFITS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[26px] border border-white/10 bg-white/[.07] p-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#73e3d9]/12 text-[#73e3d9]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-white/58">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-3 rounded-[30px] border border-[#eadcae] bg-[#fff7df] p-5 sm:grid-cols-3 sm:p-6">
          <TrustItem
            icon={BadgeCheck}
            title="Reviewed access"
            text="An application never creates merchant privileges automatically."
          />
          <TrustItem
            icon={Sparkles}
            title="Listing scoped"
            text="Approved accounts manage only the businesses assigned to them."
          />
          <TrustItem
            icon={Building2}
            title="Built for the USVI"
            text="The workflow is designed around real Virgin Islands businesses and organizations."
          />
        </section>
      </section>
    </main>
  );
}

function PartnerAction({
  icon: Icon,
  eyebrow,
  title,
  text,
  href,
  label,
  image,
}: {
  icon: typeof Building2;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  label: string;
  image: string;
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[29rem] overflow-hidden rounded-[34px] border border-white/40 text-white shadow-[0_20px_60px_rgba(3,47,45,.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_75px_rgba(3,47,45,.2)]"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover transition duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.05)_18%,rgba(3,47,45,.42)_52%,rgba(2,31,29,.97)_100%)]" />
      <span className="relative flex min-h-[29rem] flex-col justify-between p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/12 text-[#8ef0e7] shadow-lg backdrop-blur-md transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
          <Icon className="h-6 w-6" />
        </span>
        <span>
          <span className="text-[9px] font-black uppercase tracking-[.18em] text-[#f8d77c]">
            {eyebrow}
          </span>
          <span className="vi-display mt-3 block text-4xl font-bold leading-[.96] sm:text-5xl">
            {title}
          </span>
          <span className="mt-4 block max-w-xl text-sm font-semibold leading-7 text-white/66">
            {text}
          </span>
          <span className="mt-6 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#73e3d9]">
            {label} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </span>
      </span>
    </Link>
  );
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Building2;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/78 p-4">
      <Icon className="h-5 w-5 text-[#9a6a1f]" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#725c34]">{text}</p>
    </div>
  );
}

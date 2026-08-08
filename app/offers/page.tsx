import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  MapPin,
  MapPinned,
  Sparkles,
  TicketCheck,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  resolveMerchantOfferForBooking,
  type MerchantOfferBookingSnapshot,
} from "@/lib/merchant-offer-booking";
import { formatMerchantOfferMoney } from "@/lib/merchant-offers";
import { getOfferVisual } from "@/lib/offers/offer-visual";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Island Offers | VI Guide",
  description:
    "Book live U.S. Virgin Islands stays, tours, and experiences offered by verified VI Guide businesses.",
};

export default async function OffersPage() {
  const offers = await loadLiveOffers();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-12 pt-5 text-white sm:px-7 lg:px-10 lg:pb-16">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and the hills of St. Thomas"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98)_0%,rgba(3,47,45,.94)_45%,rgba(3,47,45,.52)_78%,rgba(3,47,45,.25)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(245,196,81,.18),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.5))]" />

        <ViPublicHeader
          actionHref="/bookings"
          actionLabel="My bookings"
          actionIcon={TicketCheck}
          secondaryHref="/"
          secondaryLabel="Home"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f9d875] backdrop-blur-xl">
              <BadgeDollarSign size={14} /> Live island packages
            </div>
            <h1 className="vi-display mt-7 max-w-4xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Choose a real VI experience,
              <span className="block italic text-[#73e3d9]">not just a listing.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/76 sm:text-xl sm:leading-8">
              Book live packages published by VI Guide businesses with current prices and selling dates. Availability is confirmed before a secure deposit is collected.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#live-offers"
                className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d] shadow-[0_16px_40px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
              >
                Browse live offers <ArrowRight size={15} />
              </Link>
              <Link
                href="/concierge?prompt=Help%20me%20compare%20live%20Virgin%20Islands%20offers%20and%20fit%20one%20into%20my%20trip"
                className="vi-glass inline-flex min-h-13 items-center gap-2 rounded-full px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/[.16]"
              >
                <Sparkles size={17} className="text-[#73e3d9]" /> Ask Concierge
              </Link>
            </div>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="vi-eyebrow text-[#f5c451]">Live inventory now</div>
            <div className="mt-3 flex items-end gap-3">
              <strong className="vi-display text-6xl font-bold text-white">{offers.length}</strong>
              <span className="pb-2 text-[9px] font-black uppercase tracking-[.15em] text-white/48">
                package{offers.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
              Only offers that are active, in their selling window, and valid under the VI Guide booking rules appear here.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-xs font-semibold leading-5 text-white/55">
              Photos are tied to the linked VI Guide listing when one can be resolved. Otherwise the card is explicitly labeled as island context.
            </div>
          </aside>
        </div>
      </section>

      <section id="live-offers" className="scroll-mt-6 px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-7xl">
          {offers.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <OfferCard key={offer.offerId} offer={offer} />
              ))}
            </div>
          ) : (
            <section className="relative overflow-hidden rounded-[36px] bg-[#032f2d] p-8 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-10">
              <div className="max-w-3xl">
                <Sparkles className="h-9 w-9 text-[#f5c451]" />
                <h2 className="vi-display mt-5 text-4xl font-bold tracking-[-.04em] sm:text-5xl">
                  New island packages are being prepared.
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/62">
                  Only packages with a current published price and active selling window appear here. Keep exploring VI Guide while merchants prepare the next offers.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/map"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
                  >
                    <MapPinned className="h-4 w-4" /> Explore Living Map
                  </Link>
                  <Link
                    href="/experiences"
                    className="inline-flex min-h-12 items-center rounded-full border border-white/15 bg-white/[.08] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
                  >
                    Tours & experiences
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function OfferCard({ offer }: { offer: MerchantOfferBookingSnapshot }) {
  const visual = getOfferVisual(offer);

  return (
    <Link
      href={`/offers/${encodeURIComponent(offer.offerId)}`}
      className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_16px_45px_rgba(4,51,49,.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#aad7d0] hover:shadow-[0_28px_65px_rgba(4,51,49,.14)]"
    >
      <div
        className="relative min-h-[19rem] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(3,47,45,.05)_24%,rgba(3,47,45,.78)_100%),url('${visual.image}')`,
        }}
      >
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/25 bg-[#043331]/78 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-white backdrop-blur-md">
            {humanizeKind(offer.kind)}
          </span>
          <span className={`rounded-full border border-white/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white backdrop-blur-md ${visual.source === "listing" ? "bg-[#0f766e]/78" : "bg-black/30"}`}>
            {visual.sourceLabel}
          </span>
        </div>
        <div className="absolute inset-x-5 bottom-5 text-white">
          <div className="text-[8px] font-black uppercase tracking-[.2em] text-[#f8d77c]">
            {humanizeIsland(offer.island)} · live offer
          </div>
          <h2 className="vi-display mt-2 text-3xl font-bold leading-[.95] tracking-[-.045em]">
            {offer.offerTitle}
          </h2>
          <p className="mt-2 text-xs font-semibold text-white/68">{offer.listingName}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            {offer.offerCompareAtCents ? (
              <p className="text-xs font-bold text-[#8a9997] line-through">
                {formatMerchantOfferMoney(offer.offerCompareAtCents)}
              </p>
            ) : null}
            <p className="vi-display text-4xl font-bold tracking-[-.04em]">
              {formatMerchantOfferMoney(offer.offerPriceCents)}
            </p>
          </div>
          <span className="rounded-full bg-[#fff1c7] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-[#805410]">
            {offer.offerDepositCents
              ? `${formatMerchantOfferMoney(offer.offerDepositCents)} deposit`
              : "Availability first"}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-xs font-bold text-[#607370]">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0f766e]" />
            {humanizeIsland(offer.island)}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#0f766e]" />
            Available through {formatDate(offer.validThrough)}
          </p>
        </div>

        <span className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white transition group-hover:bg-[#075e58]">
          View package <ArrowRight className="h-4 w-4 text-[#f5c451] transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

async function loadLiveOffers() {
  if (!hasFirebaseAdminConfiguration()) return [];

  const snapshot = await getAdminDb()
    .collection("merchantOffers")
    .where("status", "==", "active")
    .limit(100)
    .get();
  const offers: MerchantOfferBookingSnapshot[] = [];

  for (const document of snapshot.docs) {
    const result = resolveMerchantOfferForBooking({
      offerId: document.id,
      record: document.data(),
    });
    if (result.ok) offers.push(result.snapshot);
  }

  return offers.sort((left, right) =>
    left.validThrough.localeCompare(right.validThrough),
  );
}

function humanizeKind(value: string) {
  return value === "accommodation"
    ? "Stay"
    : value === "tour"
      ? "Tour"
      : "Experience";
}

function humanizeIsland(value: string) {
  return value === "stt"
    ? "St. Thomas"
    : value === "stj"
      ? "St. John"
      : "St. Croix";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/St_Thomas",
  }).format(date);
}

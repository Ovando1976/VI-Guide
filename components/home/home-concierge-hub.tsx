import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  BedDouble,
  Car,
  CarFront,
  Compass,
  MapPin,
  Route,
  Sparkles,
  TicketCheck,
} from "lucide-react";

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

const PROMPTS = [
  { label: "Experiences", href: "/activities", icon: Compass, image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "Trunk Bay overlook and North Shore scenery in St. John" },
  { label: "Stays", href: "/accommodations", icon: BedDouble, image: "/images/accommodations/king-christian-hotel.jpg", alt: "King Christian Hotel in Christiansted" },
  { label: "Transportation", href: "/mobility", icon: Car, image: "/images/mobility/usvi-taxi-van.png", alt: "USVI passenger taxi van on St. Thomas" },
  { label: "Car rentals", href: "/car-rentals", icon: CarFront, image: "/images/places/st-croix/cane-bay-beach-1.jpg", alt: "Cane Bay coast in St. Croix" },
] as const;

const ACTION_COPY = {
  Experiences: { detail: "Tours, charters, diving & island days", cta: "Find experiences" },
  Stays: { detail: "Hotels, resorts, villas & island bases", cta: "Find a stay" },
  Transportation: { detail: "Taxi, airport and ferry handoffs", cta: "Plan transportation" },
  "Car rentals": { detail: "Compare island vehicles and pickup options", cta: "Compare cars" },
} as const;

export async function HomeConciergeHub() {
  const offers = await loadLiveOffers();

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:px-12">
      <div className="overflow-hidden rounded-[36px] bg-[#073b39] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)]">
        <div className="grid lg:grid-cols-[.82fr_1.18fr]">
          <div className="border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-[#f5c451]">
              <Route size={14} /> Book & move
            </div>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-5xl">
              Turn the plan into the next real move.
            </h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/68">
              Once you know what kind of trip you are taking, move directly into
              experiences, stays, transportation, vehicles, and live island packages.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#73e3d9]/20 bg-[#73e3d9]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-[#9ff1e8]">
              <BadgeCheck size={14} /> One journey · fewer dead ends
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-[#073b39]"
              >
                <TicketCheck size={15} /> Book live offers <ArrowRight size={16} />
              </Link>
              <Link
                href="/concierge?open=true&prompt=Help%20me%20turn%20my%20USVI%20trip%20ideas%20into%20bookings%2C%20transportation%2C%20and%20a%20practical%20day-by-day%20plan"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-white transition hover:bg-white/[.12]"
              >
                <Sparkles size={15} /> Ask Concierge
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-5">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-white/50">
                High-intent actions
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">
                Ready to act? Go straight there.
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROMPTS.map(({ label, href, image, alt, icon: Icon }) => {
                const copy = ACTION_COPY[label];
                return (
                  <Link
                    key={label}
                    href={href}
                    className="group relative flex min-h-[190px] items-end overflow-hidden rounded-[24px] border border-white/12 bg-[#032f2d] p-4 transition hover:-translate-y-0.5 hover:border-[#f5c451]/60"
                  >
                    <Image
                      src={image}
                      alt={alt}
                      fill
                      sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.32)_38%,rgba(2,31,29,.94)_100%)]" />
                    <span className="relative flex w-full items-end gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/92 text-[#0f766e] shadow-lg backdrop-blur transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 pb-0.5">
                        <span className="block text-[8px] font-black uppercase tracking-[.16em] text-[#73e3d9]">
                          One-tap idea
                        </span>
                        <span className="mt-1 block text-sm font-black text-white">{label}</span>
                        <span className="mt-1 block text-[10px] font-semibold leading-4 text-white/60">
                          {copy.detail}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.14em] text-[#f5c451]">
                          {copy.cta} <ArrowRight size={12} />
                        </span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_18px_55px_rgba(4,51,49,.08)]">
        <div className="flex flex-col gap-4 border-b border-[#e4ece9] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#0f766e]">
              <BadgeDollarSign size={14} /> Live bookable inventory
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#032f2d] sm:text-3xl">
              {offers.length ? "Book something real today." : "Put your experience in front of travelers."}
            </h3>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#607370]">
              {offers.length
                ? "Current merchant packages appear here only when they are published and inside their selling window."
                : "When a local operator publishes a verified package, it becomes bookable from this traveler journey."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/offers"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              View all offers <ArrowRight size={14} className="text-[#f5c451]" />
            </Link>
            <Link
              href="/partners/apply"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9e6e2] bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
            >
              <BadgeCheck size={14} className="text-[#0f766e]" /> List my business
            </Link>
          </div>
        </div>

        {offers.length ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
            {offers.map((offer) => (
              <HomeOfferCard key={offer.offerId} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_.9fr] sm:p-7">
            <div className="rounded-[24px] bg-[#032f2d] p-6 text-white">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                Merchant growth loop
              </div>
              <h4 className="mt-3 text-2xl font-black tracking-[-.035em]">
                Claim → publish → receive requests → collect deposits.
              </h4>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
                USVI Explorer already has the merchant offer, booking, payment, and
                settlement workflow. The next dollar comes from putting real operator
                inventory into the marketplace.
              </p>
            </div>
            <div className="rounded-[24px] border border-[#eadcae] bg-[#fff7df] p-6">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#805410]">
                For travelers
              </div>
              <h4 className="mt-3 text-xl font-black tracking-[-.03em] text-[#032f2d]">
                Need help choosing?
              </h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#607370]">
                Ask Concierge to turn your trip goals into a practical booking plan.
              </p>
              <Link
                href="/concierge?open=true&prompt=Build%20a%20bookable%20USVI%20day%20for%20me"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-5 py-3 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
              >
                Build my day <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

function HomeOfferCard({ offer }: { offer: MerchantOfferBookingSnapshot }) {
  const visual = getOfferVisual(offer);

  return (
    <Link
      href={`/offers/${encodeURIComponent(offer.offerId)}`}
      className="group overflow-hidden rounded-[24px] border border-[#d9e6e2] bg-white transition hover:-translate-y-1 hover:border-[#aad7d0] hover:shadow-[0_18px_45px_rgba(4,51,49,.12)]"
    >
      <div className="relative min-h-[220px] bg-[#032f2d]">
        <Image
          src={visual.image}
          alt={visual.source === "listing" ? `${offer.listingName} package` : `${offer.offerTitle} island context`}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.05),rgba(3,47,45,.9)_100%)]" />
        <div className="absolute inset-x-4 bottom-4 text-white">
          <div className="text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">
            {humanizeIsland(offer.island)} · {humanizeKind(offer.kind)}
          </div>
          <h4 className="mt-1 text-xl font-black leading-tight">{offer.offerTitle}</h4>
          <p className="mt-1 text-[10px] font-semibold text-white/60">{offer.listingName}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 p-5">
        <div>
          {offer.offerCompareAtCents ? (
            <div className="text-xs font-bold text-slate-400 line-through">
              {formatMerchantOfferMoney(offer.offerCompareAtCents)}
            </div>
          ) : null}
          <div className="text-2xl font-black tracking-[-.03em] text-[#032f2d]">
            {formatMerchantOfferMoney(offer.offerPriceCents)}
          </div>
          <div className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-[#0f766e]">
            {offer.offerDepositCents
              ? `${formatMerchantOfferMoney(offer.offerDepositCents)} deposit`
              : "Availability first"}
          </div>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#032f2d] text-white transition group-hover:bg-[#0f766e]">
          <ArrowRight size={15} />
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
    .limit(12)
    .get();

  const offers: MerchantOfferBookingSnapshot[] = [];
  for (const document of snapshot.docs) {
    const result = resolveMerchantOfferForBooking({
      offerId: document.id,
      record: document.data(),
    });
    if (result.ok) offers.push(result.snapshot);
  }

  return offers
    .sort((left, right) => left.validThrough.localeCompare(right.validThrough))
    .slice(0, 3);
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

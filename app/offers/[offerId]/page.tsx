import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { OfferBookingForm } from "@/components/offers/offer-booking-form";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { resolveMerchantOfferForBooking } from "@/lib/merchant-offer-booking";
import {
  formatMerchantOfferMoney,
  normalizeMerchantOfferId,
} from "@/lib/merchant-offers";
import { getOfferVisual } from "@/lib/offers/offer-visual";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Island Package | VI Guide",
  description:
    "Review a live VI Guide business package and request verified availability.",
};

export default async function OfferDetailPage({
  params,
}: {
  params: { offerId: string };
}) {
  const offerId = normalizeMerchantOfferId(params.offerId);
  if (!offerId || !hasFirebaseAdminConfiguration()) notFound();

  const document = await getAdminDb()
    .collection("merchantOffers")
    .doc(offerId)
    .get();
  const data = document.exists ? document.data() ?? {} : null;
  const resolution = resolveMerchantOfferForBooking({ offerId, record: data });
  if (!resolution.ok || !data) notFound();

  const offer = resolution.snapshot;
  const summary = cleanMultiline(data.summary, 700);
  const inclusions = cleanMultiline(data.inclusions, 1400);
  const terms = cleanMultiline(data.terms, 1400);
  const visual = getOfferVisual(offer);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section
        className="relative isolate overflow-hidden bg-cover bg-center px-4 pb-14 pt-5 text-white sm:px-7 lg:px-10 lg:pb-16"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(2,31,29,.98)_0%,rgba(3,47,45,.94)_44%,rgba(3,47,45,.58)_78%,rgba(3,47,45,.32)_100%),linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.5)),url('${visual.image}')`,
        }}
      >
        <ViPublicHeader
          actionHref="/bookings"
          actionLabel="My bookings"
          actionIcon={BadgeDollarSign}
          secondaryHref="/offers"
          secondaryLabel="Island offers"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] backdrop-blur-xl">
                {humanizeKind(offer.kind)}
              </span>
              <span className="rounded-full border border-emerald-200/20 bg-emerald-300/15 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-emerald-100 backdrop-blur-xl">
                Live offer
              </span>
              <span className={`rounded-full border border-white/15 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white backdrop-blur-xl ${visual.source === "listing" ? "bg-[#0f766e]/72" : "bg-black/25"}`}>
                {visual.sourceLabel}
              </span>
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              {offer.offerTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/72 sm:text-lg">
              {summary}
            </p>
            <div className="mt-7 flex flex-wrap gap-4 text-xs font-bold text-white/68">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#f5c451]" />
                {humanizeIsland(offer.island)}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#f5c451]" />
                Book by {formatDate(offer.validThrough)}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#73e3d9]" />
                VI Guide verified package
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/map?island=${offer.island}`}
                className="vi-glass inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
              >
                <MapPinned className="h-4 w-4 text-[#73e3d9]" /> See the island
              </Link>
              <Link
                href={`/concierge?island=${offer.island}&prompt=${encodeURIComponent(`Help me decide whether ${offer.offerTitle} from ${offer.listingName} fits my Virgin Islands trip. Compare timing, transportation, nearby stops, and any details I should confirm before booking.`)}`}
                className="vi-glass inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
              >
                <Sparkles className="h-4 w-4 text-[#f5c451]" /> Ask Concierge
              </Link>
            </div>
          </div>

          <div className="vi-glass rounded-[30px] p-6 sm:p-7">
            <BadgeDollarSign className="h-6 w-6 text-[#f5c451]" />
            {offer.offerCompareAtCents ? (
              <p className="mt-5 text-sm font-bold text-white/40 line-through">
                {formatMerchantOfferMoney(offer.offerCompareAtCents)}
              </p>
            ) : null}
            <p className="vi-display mt-1 text-6xl font-bold tracking-[-.06em] text-white">
              {formatMerchantOfferMoney(offer.offerPriceCents)}
            </p>
            <p className="mt-3 text-[9px] font-black uppercase tracking-[.15em] text-[#f5c451]">
              {offer.offerDepositCents
                ? `${formatMerchantOfferMoney(offer.offerDepositCents)} secure deposit after review`
                : "Availability confirmed before payment"}
            </p>
            <p className="mt-5 text-sm font-semibold leading-6 text-white/60">
              Offered by {offer.listingName}. The merchant confirms capacity and timing before VI Guide sends a payment link.
            </p>
            {visual.source === "island" ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-xs font-semibold leading-5 text-white/52">
                The hero is island context, not a merchant-supplied package photo. Package details and availability come from the live merchant offer.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <Link
          href="/offers"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9e6e2] bg-[#fffdf8] px-5 text-[9px] font-black uppercase tracking-[.14em] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> All island offers
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="space-y-5">
            <article className="rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] p-6 shadow-[0_16px_45px_rgba(4,51,49,.08)] sm:p-8">
              <p className="vi-eyebrow text-[#0f766e]">Package details</p>
              <h2 className="vi-display mt-2 text-3xl font-bold tracking-[-.04em]">
                What the merchant is offering
              </h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#607370]">
                {summary}
              </p>

              {inclusions ? (
                <div className="mt-6 border-t border-[#e4ece9] pt-5">
                  <h3 className="text-[9px] font-black uppercase tracking-[.14em] text-[#8a9997]">
                    Included
                  </h3>
                  <div className="mt-3 space-y-2">
                    {inclusions.split("\n").map((item) => (
                      <p
                        key={item}
                        className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#607370]"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0f766e]" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {terms ? (
                <div className="mt-6 rounded-2xl bg-[#f4f1e8] p-5">
                  <h3 className="text-[9px] font-black uppercase tracking-[.14em] text-[#8a9997]">
                    Terms and restrictions
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-[#607370]">
                    {terms}
                  </p>
                </div>
              ) : null}
            </article>
          </div>

          <OfferBookingForm offer={offer} />
        </div>
      </section>
    </main>
  );
}

function cleanMultiline(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxLength)
    : "";
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

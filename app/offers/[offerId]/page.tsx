import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";

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

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-7 pb-28 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/offers"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
        >
          <ArrowLeft className="h-4 w-4" /> Island offers
        </Link>

        <section className="mt-5 overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.38),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-8 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:p-12 lg:p-14">
          <div className="grid gap-9 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em]">
                  {humanizeKind(offer.kind)}
                </span>
                <span className="rounded-full bg-emerald-300/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-emerald-100">
                  Live offer
                </span>
              </div>
              <h1 className="mt-6 text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
                {offer.offerTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65 sm:text-base">
                {summary}
              </p>
              <div className="mt-7 flex flex-wrap gap-4 text-xs font-bold text-white/65">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#f5c451]" />
                  {humanizeIsland(offer.island)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#f5c451]" />
                  Book by {formatDate(offer.validThrough)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#f5c451]" />
                  VI Guide verified package
                </span>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[.08] p-6">
              <BadgeDollarSign className="h-6 w-6 text-[#f5c451]" />
              {offer.offerCompareAtCents ? (
                <p className="mt-5 text-sm font-bold text-white/40 line-through">
                  {formatMerchantOfferMoney(offer.offerCompareAtCents)}
                </p>
              ) : null}
              <p className="mt-1 text-5xl font-black tracking-[-.06em]">
                {formatMerchantOfferMoney(offer.offerPriceCents)}
              </p>
              <p className="mt-3 text-[9px] font-black uppercase tracking-[.15em] text-[#f5c451]">
                {offer.offerDepositCents
                  ? `${formatMerchantOfferMoney(offer.offerDepositCents)} secure deposit after review`
                  : "Availability confirmed before payment"}
              </p>
              <p className="mt-5 text-sm font-semibold leading-6 text-white/60">
                Offered by {offer.listingName}. The merchant confirms capacity and
                timing before VI Guide sends a payment link.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="space-y-5">
            <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                Package details
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
                What the merchant is offering
              </h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                {summary}
              </p>

              {inclusions ? (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                    Included
                  </h3>
                  <div className="mt-3 space-y-2">
                    {inclusions.split("\n").map((item) => (
                      <p
                        key={item}
                        className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-600"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {terms ? (
                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <h3 className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                    Terms and restrictions
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-slate-600">
                    {terms}
                  </p>
                </div>
              ) : null}
            </article>
          </div>

          <OfferBookingForm offer={offer} />
        </section>
      </div>
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

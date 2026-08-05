import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { resolveMerchantOfferForBooking } from "@/lib/merchant-offer-booking";
import { formatMerchantOfferMoney } from "@/lib/merchant-offers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Island Offers | VI Guide",
  description:
    "Book live U.S. Virgin Islands stays, tours, and experiences offered by verified VI Guide businesses.",
};

export default async function OffersPage() {
  const offers = await loadLiveOffers();

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 pb-28 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.36),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-8 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:p-12 lg:p-16">
          <div className="max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#f5c451]">
              Live island packages
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
              Choose a real VI experience, not just a directory listing.
            </h1>
            <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-white/65 sm:text-base">
              These packages are published by VI Guide businesses with current
              prices and selling dates. Request availability before any secure
              deposit is collected.
            </p>
          </div>
          <div className="mt-9 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[.08] px-5 py-3 text-[9px] font-black uppercase tracking-[.15em] text-white/75">
            <Sparkles className="h-4 w-4 text-[#f5c451]" /> {offers.length} live
            package{offers.length === 1 ? "" : "s"}
          </div>
        </section>

        {offers.length ? (
          <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <Link
                key={offer.offerId}
                href={`/offers/${encodeURIComponent(offer.offerId)}`}
                className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl"
              >
                <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.38),transparent_38%),linear-gradient(145deg,#063e3a,#0f8278)] p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[.13em]">
                      {humanizeKind(offer.kind)}
                    </span>
                    <BadgeDollarSign className="h-5 w-5 text-[#f5c451]" />
                  </div>
                  <h2 className="mt-8 text-3xl font-black leading-[.95] tracking-[-.05em]">
                    {offer.offerTitle}
                  </h2>
                  <p className="mt-3 text-sm font-semibold text-white/60">
                    {offer.listingName}
                  </p>
                </div>

                <div className="p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      {offer.offerCompareAtCents ? (
                        <p className="text-xs font-bold text-slate-400 line-through">
                          {formatMerchantOfferMoney(offer.offerCompareAtCents)}
                        </p>
                      ) : null}
                      <p className="text-3xl font-black tracking-[-.04em]">
                        {formatMerchantOfferMoney(offer.offerPriceCents)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-amber-900">
                      {offer.offerDepositCents
                        ? `${formatMerchantOfferMoney(offer.offerDepositCents)} deposit`
                        : "Availability first"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-xs font-bold text-slate-500">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-700" />
                      {humanizeIsland(offer.island)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-teal-700" />
                      Available through {formatDate(offer.validThrough)}
                    </p>
                  </div>

                  <span className="mt-7 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em]">
                    View package
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="mt-7 rounded-[34px] border border-emerald-200 bg-emerald-50 p-10 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-emerald-700" />
            <h2 className="mt-5 text-3xl font-black tracking-[-.04em]">
              New island packages are being prepared
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-emerald-950/65">
              Only packages with a current published price and active selling
              window appear here. Explore VI Guide while merchants prepare the
              next offers.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Explore the islands
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

async function loadLiveOffers() {
  if (!hasFirebaseAdminConfiguration()) return [];

  const snapshot = await getAdminDb()
    .collection("merchantOffers")
    .where("status", "==", "active")
    .limit(100)
    .get();

  return snapshot.docs
    .map((document) =>
      resolveMerchantOfferForBooking({
        offerId: document.id,
        record: document.data(),
      }),
    )
    .filter((result) => result.ok)
    .map((result) => result.snapshot)
    .sort((left, right) =>
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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CommerceBookingForm } from "@/components/booking/commerce-booking-form";
import { safeInternalDestinationOrNull } from "@/lib/safe-internal-destination";

export const metadata: Metadata = {
  title: "Book with VI Guide",
  description:
    "Request accommodations, tours, and island experiences through one clear VI Guide booking flow.",
};

type BookingSearchParams = Record<
  string,
  string | string[] | undefined
>;

export default function BookingPage({
  searchParams = {},
}: {
  searchParams?: BookingSearchParams;
}) {
  const rawListingHref = firstValue(searchParams.listingHref);
  if (rawListingHref) {
    const safeListingHref = safeInternalDestinationOrNull(
      rawListingHref,
      "https://vi-guide.local",
    );

    if (safeListingHref !== rawListingHref) {
      redirect(buildSanitizedBookingHref(searchParams, safeListingHref));
    }
  }

  return (
    <Suspense fallback={<BookingLoading />}>
      <CommerceBookingForm />
    </Suspense>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSanitizedBookingHref(
  searchParams: BookingSearchParams,
  safeListingHref: string | null,
) {
  const sanitized = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "listingHref" || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) sanitized.append(key, item);
    } else {
      sanitized.set(key, value);
    }
  }

  if (safeListingHref) sanitized.set("listingHref", safeListingHref);
  const query = sanitized.toString();
  return query ? `/book?${query}` : "/book";
}

function BookingLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f4ea] px-6 text-center text-[#043331]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">
          VI Guide Booking
        </div>
        <h1 className="mt-3 text-3xl font-black">Preparing your request…</h1>
      </div>
    </main>
  );
}

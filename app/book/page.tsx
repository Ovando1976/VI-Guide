import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck, ClipboardCheck, MapPin } from "lucide-react";

import { CommerceBookingExperience } from "@/components/booking/commerce-booking-experience";
import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { GooglePlacePhoto } from "@/components/directory/google-place-photo";
import { safeInternalDestinationOrNull } from "@/lib/safe-internal-destination";
import {
  getTravelKnowledge,
  type TravelKnowledgeKind,
} from "@/lib/travel-knowledge";
import type { DirectoryItem } from "@/types/directory";

export const metadata: Metadata = {
  title: "Book with VI Guide",
  description:
    "Request accommodations, tours, and island experiences through one clear VI Guide booking flow.",
};

type BookingSearchParams = Record<
  string,
  string | string[] | undefined
>;

type BookingIsland = "stt" | "stj" | "stx";

type BookingVisualContext = {
  island: BookingIsland;
  islandName: string;
  listingName: string;
  detailHref: string | null;
  resolvedListing: DirectoryItem | null;
  photoPlaceId: string;
  photoFallback: string;
  contextImage: string;
};

const ISLAND_NAMES: Record<BookingIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const ISLAND_CONTEXT_IMAGES: Record<BookingIsland, string> = {
  stt: "/images/usvi-harbor-hero.jpg",
  stj: "/images/places/st-john/trunk-bay-overlook-1.jpg",
  stx: "/images/places/st-croix/cane-bay-beach-1.jpg",
};

export default function BookingPage({
  searchParams = {},
}: {
  searchParams?: BookingSearchParams;
}) {
  const rawListingHref = firstValue(searchParams.listingHref);
  const safeListingHref = rawListingHref
    ? safeInternalDestinationOrNull(rawListingHref, "https://vi-guide.local")
    : null;

  if (rawListingHref && safeListingHref !== rawListingHref) {
    redirect(buildSanitizedBookingHref(searchParams, safeListingHref));
  }

  const bookingContext = resolveBookingVisualContext(
    searchParams,
    safeListingHref,
  );

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/bookings"
          actionLabel="My Bookings"
          actionIcon={ClipboardCheck}
          secondaryHref="/planner"
          secondaryLabel="My Trip"
        />
      </div>

      <BookingContextHero context={bookingContext} />

      <Suspense fallback={<BookingLoading />}>
        <CommerceBookingExperience />
      </Suspense>
    </main>
  );
}

function BookingContextHero({ context }: { context: BookingVisualContext }) {
  const { resolvedListing } = context;
  const hasCanonicalLocalImage = Boolean(
    resolvedListing?.heroImage?.startsWith("/") &&
      !resolvedListing.heroImage.startsWith("/api/google-places/photo?"),
  );

  return (
    <section className="mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:mt-7">
      <div className="group relative min-h-[270px] overflow-hidden rounded-[34px] bg-[#043331] shadow-[0_28px_80px_rgba(4,51,49,.16)] sm:min-h-[330px]">
        {context.photoPlaceId ? (
          <GooglePlacePhoto
            placeId={context.photoPlaceId}
            name={resolvedListing?.name || context.listingName}
            island={context.island.toUpperCase()}
            fallbackImage={context.photoFallback || context.contextImage}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
            style={{
              backgroundImage: `url('${
                hasCanonicalLocalImage
                  ? resolvedListing?.heroImage
                  : context.contextImage
              }')`,
            }}
            role="img"
            aria-label={
              resolvedListing
                ? resolvedListing.name
                : `${context.islandName} booking context`
            }
          />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,47,45,.94)_0%,rgba(3,47,45,.76)_42%,rgba(3,47,45,.2)_100%)]" />

        <div className="relative flex min-h-[270px] max-w-2xl flex-col justify-end p-6 text-white sm:min-h-[330px] sm:p-9 lg:p-10">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] backdrop-blur">
              {resolvedListing ? (
                <BadgeCheck className="h-3.5 w-3.5 text-[#7ce0d4]" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-[#f5c451]" />
              )}
              {resolvedListing ? "Verified listing context" : "Island context"}
            </span>
            <span className="rounded-full border border-white/20 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] backdrop-blur">
              {context.islandName}
            </span>
          </div>

          <h1 className="mt-5 max-w-xl text-4xl font-black leading-[.94] tracking-[-.05em] sm:text-5xl">
            {context.listingName}
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/72">
            {resolvedListing
              ? "You are continuing from a VI Guide catalog listing. The image and listing identity are resolved from the same canonical travel record used across Explore and details."
              : `This request is not tied to a canonical VI Guide photo record, so the image is labeled as ${context.islandName} context rather than presented as the specific property or experience.`}
          </p>

          {context.detailHref ? (
            <Link
              href={context.detailHref}
              className="mt-5 inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-[9px] font-black uppercase tracking-[.16em] text-white backdrop-blur transition hover:bg-white/15"
            >
              Review listing details
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function resolveBookingVisualContext(
  searchParams: BookingSearchParams,
  safeListingHref: string | null,
): BookingVisualContext {
  const island = normalizeIsland(firstValue(searchParams.island));
  const listingId = clean(firstValue(searchParams.listingId));
  const requestedName = clean(firstValue(searchParams.listingName));
  const requestedKind = clean(firstValue(searchParams.kind));
  const hrefKind = inferTravelKnowledgeKind(safeListingHref);
  const hrefSlug = getListingSlug(safeListingHref);

  const kinds: TravelKnowledgeKind[] = hrefKind
    ? [hrefKind]
    : requestedKind === "accommodation"
      ? ["stays"]
      : ["places", "beaches", "historic"];

  const keys = [listingId, hrefSlug].filter(Boolean);
  let resolvedListing: DirectoryItem | null = null;

  for (const kind of kinds) {
    const match = getTravelKnowledge(kind).find(
      (item) =>
        keys.some((key) => item.id === key || item.slug === key) &&
        item.island === island,
    );
    if (match) {
      resolvedListing = match;
      break;
    }
  }

  const googlePhoto = getGooglePhotoContext(resolvedListing?.heroImage);

  return {
    island,
    islandName: ISLAND_NAMES[island],
    listingName:
      resolvedListing?.name || requestedName || "VI Guide booking request",
    detailHref: resolvedListing ? safeListingHref : null,
    resolvedListing,
    photoPlaceId: googlePhoto.placeId,
    photoFallback: googlePhoto.fallback,
    contextImage: ISLAND_CONTEXT_IMAGES[island],
  };
}

function inferTravelKnowledgeKind(
  href: string | null,
): TravelKnowledgeKind | null {
  if (!href) return null;
  if (href.startsWith("/accommodations/")) return "stays";
  if (href.startsWith("/places/")) return "places";
  if (href.startsWith("/beaches/")) return "beaches";
  if (href.startsWith("/historic/") || href.startsWith("/heritage/")) {
    return "historic";
  }
  return null;
}

function getListingSlug(href: string | null) {
  if (!href) return "";
  const path = href.split("?")[0]?.replace(/\/$/, "") || "";
  return decodeURIComponent(path.split("/").filter(Boolean).at(-1) || "");
}

function getGooglePhotoContext(value?: string) {
  if (!value?.startsWith("/api/google-places/photo?")) {
    return { placeId: "", fallback: "" };
  }
  const params = new URLSearchParams(value.split("?")[1] || "");
  return {
    placeId: params.get("placeId") || "",
    fallback: params.get("fallback") || "",
  };
}

function normalizeIsland(value: string | undefined): BookingIsland {
  return value === "stj" || value === "stx" ? value : "stt";
}

function clean(value: string | undefined) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
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
    <div className="grid min-h-[60vh] place-items-center px-6 text-center text-[#043331]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">
          VI Guide Booking
        </div>
        <h2 className="mt-3 text-3xl font-black">Preparing your request…</h2>
      </div>
    </div>
  );
}

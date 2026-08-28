import Image from "next/image";
import Link from "next/link";
import { MapPinned, Route, ShieldCheck, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { ProactiveTripIntelligence } from "@/components/intelligence/proactive-trip-intelligence";
import { RiderCancelRide } from "@/components/mobility/rider-cancel-ride";
import { RiderLiveDriverMap } from "@/components/mobility/rider-live-driver-map";
import { RiderTripSubscriptionScope } from "@/components/mobility/rider-trip-subscription-scope";
import { RiderTripTiming } from "@/components/mobility/rider-trip-timing";
import { TripReturnNotice } from "@/components/mobility/trip-return-notice";
import { TripRideStatusFromUrl } from "@/components/mobility/trip-ride-status-from-url";
import { RiderTripHistory } from "@/components/rider-trip-history";
import { TripAwareConciergeLink } from "@/components/trips/trip-aware-concierge-link";
import { TripAwareLivingMapLink } from "@/components/trips/trip-aware-living-map-link";
import { TravelerTripCommandCenter } from "@/components/trips/traveler-trip-command-center";
import { TravelerTripReadinessPanel } from "@/components/trips/traveler-trip-readiness-panel";
import { TravelerPreferencesCard } from "@/components/insights/traveler-preferences-card";
import { getSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  serializeTravelerAdvisorTrip,
  serializeTravelerCommerceBooking,
  type TravelerAdvisorTrip,
  type TravelerCommerceBooking,
  type TravelerStayRequest,
} from "@/lib/traveler-trip-command";

const tripMetadataContract = {
  title: "My Trip | USVI Explorer",
} as const;

export const metadata = {
  title: { absolute: tripMetadataContract.title },
  description:
    "Your connected USVI Explorer trip workspace for itinerary, bookings, payments, stays, rides, advisor planning, readiness, and Concierge.",
};

export default async function TripsPage() {
  const session = await getSession();
  const { stays, bookings, advisorTrips } = session
    ? await loadTravelerTripData({ uid: session.uid, email: session.email })
    : { stays: [], bookings: [], advisorTrips: [] };

  return (
    <main className="min-h-screen bg-[#f4f1e8] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/planner"
          actionLabel="Open Planner"
          actionIcon={Route}
          secondaryHref="/bookings"
          secondaryLabel="Bookings"
        />
      </div>

      <section className="mx-auto mt-5 max-w-7xl px-4 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[36px] border border-white/50 bg-[#043331] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)]">
          <Image
            src="/images/places/st-john/trunk-bay-overlook-1.jpg"
            alt="Virgin Islands coastline viewed from above"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="-z-30 object-cover object-center"
          />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,36,35,.98)_0%,rgba(3,51,49,.9)_46%,rgba(3,51,49,.42)_78%,rgba(3,51,49,.2)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_25%,rgba(124,224,212,.24),transparent_24rem)]" />

          <div className="grid min-h-[390px] gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10">
            <div className="max-w-4xl self-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-[#f5c451]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f8d77c] backdrop-blur">
                <Route className="h-4 w-4" /> Your connected island journey
              </div>
              <h1 className="vi-display mt-4 max-w-4xl text-4xl font-black leading-[.9] tracking-[-.06em] sm:text-6xl lg:text-7xl">
                Your island story, <span className="text-[#7ce0d4]">in motion.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/72 sm:text-base sm:leading-7">
                One place for the plan, the reservations, the ride, the advisor, and what needs your attention next.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/75 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#7ce0d4]" /> Readiness protected
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/75 backdrop-blur">
                  <MapPinned className="h-3.5 w-3.5 text-[#7ce0d4]" /> Map connected
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/75 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-[#f5c451]" /> Concierge aware
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-[320px] lg:justify-end">
              <Link
                href="/planner"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
              >
                <Route className="h-4 w-4" /> Shape my trip
              </Link>
              <TripAwareLivingMapLink className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.08] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white backdrop-blur transition hover:bg-white/[.13]" />
              <TripAwareConciergeLink className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.08] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white backdrop-blur transition hover:bg-white/[.13]" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <TripReturnNotice />
        <TripRideStatusFromUrl />
        <TravelerPreferencesCard />
        <TravelerTripCommandCenter
          travelerName={session?.name}
          bookings={bookings}
          stayRequests={stays}
          advisorTrips={advisorTrips}
        />

        <div className="mt-6">
          <TravelerTripReadinessPanel
            bookings={bookings}
            stayRequests={stays}
            advisorTrips={advisorTrips}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
          <ProactiveTripIntelligence />
        </div>

        {!session ? (
          <section className="mt-6 flex flex-col gap-4 rounded-[28px] border border-teal-200 bg-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                Connect your account
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-.035em]">
                Your saved itinerary still works without signing in.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Sign in when you want My Trip to also connect account bookings, advisor proposals, stay requests, live rides, and ride history. Device-only itinerary and tracked booking continuity remain available either way.
              </p>
            </div>
            <Link
              href="/login?next=/trips"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.15em] text-white"
            >
              Sign in to connect
            </Link>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] px-6 py-6 text-white sm:px-8">
              <div className="text-[10px] font-black uppercase tracking-[.24em] text-[#f5c558]">
                Live transportation
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
                Rides connected to your trip
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/65">
                Active ride timing, driver location, cancellation controls, and ride history remain connected below the same My Trip workspace.
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <RiderTripSubscriptionScope />
              <RiderTripTiming riderId={session.uid} />
              <RiderLiveDriverMap riderId={session.uid} />
              <RiderCancelRide riderId={session.uid} />
              <RiderTripHistory riderId={session.uid} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

async function loadTravelerTripData(input: {
  uid: string;
  email?: string;
}): Promise<{
  stays: TravelerStayRequest[];
  bookings: TravelerCommerceBooking[];
  advisorTrips: TravelerAdvisorTrip[];
}> {
  if (!hasFirebaseAdminConfiguration()) {
    return { stays: [], bookings: [], advisorTrips: [] };
  }

  const db = getAdminDb();
  const email = input.email?.trim().toLowerCase() ?? "";

  const [stayResult, bookingResult, advisorResult] = await Promise.allSettled([
    db
      .collection("stayBookingRequests")
      .where("riderId", "==", input.uid)
      .limit(20)
      .get(),
    email
      ? db.collection("commerceBookings").where("email", "==", email).limit(30).get()
      : Promise.resolve(null),
    email
      ? db
          .collection("travelPlanningRequests")
          .where("email", "==", email)
          .limit(12)
          .get()
      : Promise.resolve(null),
  ]);

  const stays: TravelerStayRequest[] =
    stayResult.status === "fulfilled"
      ? stayResult.value.docs
          .map((document) => {
            const data = document.data();
            return {
              requestId: document.id,
              stayName: clean(data.stayName, 180) || "USVI Explorer stay",
              staySlug: clean(data.staySlug, 180),
              checkIn: clean(data.checkIn, 10),
              checkOut: clean(data.checkOut, 10),
              adults: safeInteger(data.adults),
              children: safeInteger(data.children),
              rooms: Math.max(1, safeInteger(data.rooms)),
              status: clean(data.status, 60) || "pending_property_confirmation",
            };
          })
          .filter((stay) => stay.staySlug && stay.checkIn && stay.checkOut)
          .sort((left, right) => right.checkIn.localeCompare(left.checkIn))
      : [];

  if (stayResult.status === "rejected") {
    console.error("traveler trip stay history error", stayResult.reason);
  }

  const bookings: TravelerCommerceBooking[] =
    bookingResult.status === "fulfilled" && bookingResult.value
      ? bookingResult.value.docs
          .map((document) =>
            serializeTravelerCommerceBooking(document.id, document.data()),
          )
          .filter(isTravelerCommerceBooking)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      : [];

  if (bookingResult.status === "rejected") {
    console.error("traveler trip commerce history error", bookingResult.reason);
  }

  const advisorTrips: TravelerAdvisorTrip[] =
    advisorResult.status === "fulfilled" && advisorResult.value
      ? advisorResult.value.docs
          .map((document) =>
            serializeTravelerAdvisorTrip(document.id, document.data()),
          )
          .filter(isTravelerAdvisorTrip)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      : [];

  if (advisorResult.status === "rejected") {
    console.error("traveler trip advisor history error", advisorResult.reason);
  }

  return { stays, bookings, advisorTrips };
}

function isTravelerCommerceBooking(
  value: TravelerCommerceBooking | null,
): value is TravelerCommerceBooking {
  return value !== null;
}

function isTravelerAdvisorTrip(
  value: TravelerAdvisorTrip | null,
): value is TravelerAdvisorTrip {
  return value !== null;
}

function safeInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

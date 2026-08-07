import Link from "next/link";
import { Route } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { ProactiveTripIntelligence } from "@/components/intelligence/proactive-trip-intelligence";
import { RiderCancelRide } from "@/components/mobility/rider-cancel-ride";
import { RiderLiveDriverMap } from "@/components/mobility/rider-live-driver-map";
import { RiderTripTiming } from "@/components/mobility/rider-trip-timing";
import { TripReturnNotice } from "@/components/mobility/trip-return-notice";
import { RiderTripHistory } from "@/components/rider-trip-history";
import { TravelerTripCommandCenter } from "@/components/trips/traveler-trip-command-center";
import { TravelerTripReadinessPanel } from "@/components/trips/traveler-trip-readiness-panel";
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

export const metadata = {
  title: "My Trip | VI Guide",
  description:
    "Your connected VI Guide trip workspace for itinerary, bookings, payments, stays, rides, advisor planning, readiness, and Concierge.",
};

export default async function TripsPage() {
  const session = await getSession();
  const { stays, bookings, advisorTrips } = session
    ? await loadTravelerTripData({ uid: session.uid, email: session.email })
    : { stays: [], bookings: [], advisorTrips: [] };

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/planner"
          actionLabel="Open Planner"
          actionIcon={Route}
          secondaryHref="/bookings"
          secondaryLabel="Bookings"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <TripReturnNotice />
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
              stayName: clean(data.stayName, 180) || "VI Guide stay",
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

"use client";

import Link from "next/link";
import {
  CarFront,
  CheckCircle2,
  Headphones,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RiderDriverLocation } from "@/components/mobility/rider-driver-location";
import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";

const TRACKABLE_STATUSES: RideBooking["status"][] = [
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

const RIDE_STEPS: Array<{ status: RideBooking["status"]; label: string }> = [
  { status: "matched", label: "Assigned" },
  { status: "driver_en_route", label: "En route" },
  { status: "arrived", label: "Arrived" },
  { status: "in_progress", label: "On trip" },
];

export function RiderLiveDriverMap({ riderId }: { riderId: string }) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToRiderBookings(
      riderId,
      (nextBookings) => {
        setBookings(nextBookings);
        setError(null);
      },
      (subscriptionError) => {
        console.error("rider live location listener error", subscriptionError);
        setError(subscriptionError.message);
      },
    );
  }, [riderId]);

  const activeBooking = useMemo(
    () => bookings.find((booking) => TRACKABLE_STATUSES.includes(booking.status)),
    [bookings],
  );

  if (error) {
    return (
      <section className="mb-6 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        Live driver position is temporarily unavailable: {error}
      </section>
    );
  }

  if (!activeBooking) return null;

  return (
    <div className="mb-6 space-y-4">
      <DriverArrivalCard booking={activeBooking} />
      <RiderDriverLocation booking={activeBooking} />
    </div>
  );
}

function DriverArrivalCard({ booking }: { booking: RideBooking }) {
  const compliance = booking.assignmentComplianceSnapshot;
  const identity = booking.riderAssignmentSnapshot;
  const arrival = arrivalCopy(booking.status);
  const vehicleName = identity
    ? [identity.vehicle.color, identity.vehicle.make, identity.vehicle.model]
        .filter(Boolean)
        .join(" ")
    : "Verified vehicle details pending";
  const activeStep = Math.max(
    0,
    RIDE_STEPS.findIndex((step) => step.status === booking.status),
  );

  return (
    <section className="overflow-hidden rounded-[30px] border border-teal-900/10 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] px-5 py-5 text-white sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              Active ride · {booking.origin.estateName} → {booking.destination.estateName}
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
              {arrival.title}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
              {arrival.detail}
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/85">
            {arrival.badge}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Ride progress">
          {RIDE_STEPS.map((step, index) => {
            const complete = index <= activeStep;
            return (
              <div key={step.status} className="min-w-0">
                <div
                  className={`h-1.5 rounded-full ${complete ? "bg-[#7ce0d4]" : "bg-white/15"}`}
                />
                <div
                  className={`mt-2 truncate text-[7px] font-black uppercase tracking-[.1em] ${complete ? "text-white" : "text-white/40"}`}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <TrustItem
          icon={UserRound}
          label="Driver"
          value={identity?.driver.displayName ?? "Verified driver details pending"}
          helper={
            identity
              ? `Commission badge ${identity.driver.commissionBadgeNumber}`
              : "Identity appears only from the verified assignment record"
          }
          ready={Boolean(identity)}
        />
        <TrustItem
          icon={CarFront}
          label="Vehicle"
          value={vehicleName}
          helper={
            identity
              ? `Taxi plate ${identity.vehicle.taxiPlate} · Medallion ${identity.vehicle.medallionNumber}`
              : "Vehicle identity appears after verified assignment"
          }
          ready={Boolean(identity)}
        />
        <TrustItem
          icon={ShieldCheck}
          label="Authorization"
          value={
            identity?.association.name ??
            compliance?.driverAuthorizationStatus ??
            "Verification recorded at assignment"
          }
          helper={
            identity
              ? "Active association assignment verified by dispatch"
              : compliance
                ? "Dispatch compliance snapshot"
                : "Shown when the verified assignment is available"
          }
          ready={Boolean(compliance && identity)}
        />
        <TrustItem
          icon={MapPin}
          label="Pickup"
          value={booking.origin.estateName}
          helper={`Destination: ${booking.destination.estateName}`}
          ready
        />
      </div>

      {booking.status !== "in_progress" ? (
        <div className="border-t border-slate-100 bg-[#fff9e8] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5c451] text-[#043331]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-[#8a6512]">
                Before you board
              </div>
              <p className="mt-1 text-sm font-black leading-5 text-[#043331]">
                Match the driver, Commission badge, vehicle, taxi plate, and medallion to this booking.
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                If the arriving taxi does not match the verified details shown here, do not board it. Keep My Trip open and use Get help.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-t border-slate-100 bg-[#f8f4ea] px-5 py-5 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">
              <LocateFixed className="h-4 w-4" /> Pickup check
            </div>
            <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-600">
              {pickupInstruction(booking.status, booking.origin.estateName)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link
              href="/map"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 text-[8px] font-black uppercase tracking-[.12em] text-white transition hover:bg-[#0f766e]"
            >
              <Navigation className="h-4 w-4" /> Open map
            </Link>
            <Link
              href="/concierge"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[8px] font-black uppercase tracking-[.12em] text-[#043331] transition hover:border-teal-300"
            >
              <Headphones className="h-4 w-4" /> Get help
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  label,
  value,
  helper,
  ready,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  helper: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
            ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.15em] text-slate-400">
            {label}
            {ready ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
          </div>
          <div className="mt-1 break-words text-sm font-black text-[#043331]">{value}</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function pickupInstruction(status: RideBooking["status"], pickup: string) {
  switch (status) {
    case "matched":
      return `Your taxi is assigned for ${pickup}. Keep My Trip open so the verified driver details and live approach stay together.`;
    case "driver_en_route":
      return `Head toward the agreed pickup point at ${pickup} and watch the live driver position below.`;
    case "arrived":
      return `Your driver is in the ${pickup} pickup area. Use the verification checklist above before entering the vehicle.`;
    case "in_progress":
      return "You are on the trip. My Trip will keep the verified ride record and live status together until completion.";
    default:
      return `Keep the agreed ${pickup} pickup point in view while your ride progresses.`;
  }
}

function arrivalCopy(status: RideBooking["status"]) {
  switch (status) {
    case "matched":
      return {
        badge: "Ride confirmed",
        title: "Your driver is assigned.",
        detail: "Your ride has moved out of dispatch. Use the verified identity below to recognize the taxi that was assigned to this booking.",
      };
    case "driver_en_route":
      return {
        badge: "Driver en route",
        title: "Your driver is heading to pickup.",
        detail: "Stay near the pickup point, follow the live position below, and use the verified driver and taxi details to recognize your ride.",
      };
    case "arrived":
      return {
        badge: "Driver arrived",
        title: "Your driver is at the pickup area.",
        detail: "Before boarding, match the arriving driver and taxi against every verified booking detail shown below.",
      };
    case "in_progress":
      return {
        badge: "On trip",
        title: "Your ride is in progress.",
        detail: "The verified driver, taxi, route, and live trip status remain connected to this booking until completion.",
      };
    default:
      return {
        badge: "Active ride",
        title: "Your ride is active.",
        detail: "My Trip keeps verified driver and vehicle context connected as the ride progresses.",
      };
  }
}

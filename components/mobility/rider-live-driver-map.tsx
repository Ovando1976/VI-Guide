"use client";

import { CarFront, CheckCircle2, MapPin, ShieldCheck, UserRound } from "lucide-react";
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

  return (
    <section className="overflow-hidden rounded-[30px] border border-teal-900/10 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              Your assigned ride
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-[-.04em]">
              {arrival.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
              {arrival.detail}
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/85">
            {arrival.badge}
          </span>
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

      <div className="border-t border-slate-100 bg-[#f8f4ea] px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold leading-5 text-slate-600">
          Before boarding, match the driver name and Commission badge plus the taxi color, make/model, plate, and medallion shown here. These details are copied from the reviewed fleet records at assignment time; internal account IDs are never shown.
        </p>
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
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
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
        detail: "Before boarding, match the arriving driver and taxi against the verified booking details below.",
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

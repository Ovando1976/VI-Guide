"use client";

import {
  BriefcaseBusiness,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking, TimestampLike } from "@/types/mobility";

const ACTIVE: RideBooking["status"][] = [
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

const STAGES: Array<{ status: RideBooking["status"]; label: string }> = [
  { status: "requested", label: "Dispatch" },
  { status: "matched", label: "Assigned" },
  { status: "driver_en_route", label: "En route" },
  { status: "arrived", label: "Arrived" },
  { status: "in_progress", label: "On trip" },
];

export function RiderTripTiming({ riderId }: { riderId: string }) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    return subscribeToRiderBookings(riderId, setBookings, () => undefined);
  }, [riderId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const booking = useMemo(
    () => bookings.find((item) => ACTIVE.includes(item.status)) ?? null,
    [bookings],
  );

  if (!booking) return null;

  const startedAt = currentStageTimestamp(booking);
  const elapsed = startedAt ? Math.max(0, now - startedAt) : null;
  const stageIndex = STAGES.findIndex((item) => item.status === booking.status);
  const payment = paymentPresentation(booking);
  const lifecycle = lifecyclePresentation(booking.status);
  const prep = pickupPreparation(booking);

  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-teal-900/10 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#7ce0d4]">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#7ce0d4]">
                Live ride status
              </div>
              <div className="mt-1 text-2xl font-black tracking-[-.035em]">
                {lifecycle.title}
              </div>
              <p className="mt-1 max-w-2xl text-sm font-semibold leading-5 text-white/65">
                {lifecycle.detail}
              </p>
              <p className="mt-2 text-sm font-black text-white">
                {booking.origin.estateName} → {booking.destination.estateName}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.15em] text-white/45">
              <TimerReset className="h-3.5 w-3.5" /> Time in stage
            </div>
            <div className="mt-1 text-2xl font-black">
              {elapsed === null ? "Starting" : formatDuration(elapsed)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-5 gap-1" aria-label="Ride progress">
          {STAGES.map((stage, index) => {
            const complete = index < stageIndex;
            const current = index === stageIndex;
            return (
              <div key={stage.status} className="min-w-0 text-center">
                <div
                  className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[9px] font-black ${
                    complete
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : current
                        ? "border-[#f5c451] bg-[#f5c451] text-[#043331]"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                  aria-current={current ? "step" : undefined}
                >
                  {complete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className={`mt-2 truncate text-[8px] font-black uppercase tracking-[.08em] ${current ? "text-[#043331]" : "text-slate-400"}`}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className={`rounded-[20px] border p-4 ${payment.tone}`}>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em]">
              <CreditCard className="h-4 w-4" /> Payment
            </div>
            <div className="mt-2 text-sm font-black">{payment.title}</div>
            <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{payment.detail}</p>
          </div>
          <div className="rounded-[20px] border border-teal-200 bg-teal-50 p-4 text-teal-950">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
              <ShieldCheck className="h-4 w-4" /> Confirmation
            </div>
            <div className="mt-2 text-sm font-black">{lifecycle.confirmation}</div>
            <p className="mt-1 text-xs font-semibold leading-5 text-teal-800">
              Payment and driver assignment are separate states. Your ride is driver-confirmed only after an authorized operator is assigned.
            </p>
          </div>
        </div>

        {booking.status !== "in_progress" ? (
          <div className="mt-5 rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Pickup readiness</div>
                <div className="mt-1 text-lg font-black tracking-[-.025em] text-[#043331]">{prep.title}</div>
                <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">{prep.detail}</p>
              </div>
              {booking.scheduledAt ? (
                <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                  <div className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">Scheduled</div>
                  <div className="mt-1 text-xs font-black text-[#043331]">{formatDateTime(booking.scheduledAt)}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <ReadinessItem
                icon={<MapPin className="h-4 w-4" />}
                label="Pickup point"
                value={booking.origin.estateName}
                detail={booking.origin.notes || prep.pickupDetail}
              />
              <ReadinessItem
                icon={<Users className="h-4 w-4" />}
                label="Travelers"
                value={`${booking.passengers} ${booking.passengers === 1 ? "rider" : "riders"}`}
                detail="Make sure everyone in the party is ready before the driver arrives."
              />
              <ReadinessItem
                icon={<BriefcaseBusiness className="h-4 w-4" />}
                label="Luggage"
                value={`${booking.luggage} ${booking.luggage === 1 ? "bag" : "bags"}`}
                detail={booking.luggage > 0 ? "Keep bags together and ready for loading." : "No luggage was recorded on this booking."}
              />
            </div>

            {prep.connectionDetail ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-950">
                <span className="font-black">Connection watch:</span> {prep.connectionDetail}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReadinessItem({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
        <span className="text-teal-700">{icon}</span> {label}
      </div>
      <div className="mt-2 text-sm font-black text-[#043331]">{value}</div>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function pickupPreparation(booking: RideBooking) {
  const accessDetail: Record<RideBooking["origin"]["accessType"], string> = {
    airport: "Meet at the saved airport pickup point and keep flight details handy.",
    ferry: "Wait at the saved ferry pickup point, clear of boarding traffic and taxi lanes.",
    beach: "Move to the safest accessible roadside pickup point before the driver arrives.",
    resort: "Use the resort’s designated taxi or guest pickup area when available.",
    villa: "Be ready at the accessible road entrance if the property driveway is difficult to enter.",
    roadside: "Wait in a safe visible location where the driver can stop without blocking traffic.",
  };

  const connection = booking.connectionKind && booking.connectionDeadline
    ? `${connectionLabel(booking.connectionKind)} deadline ${formatDateTime(booking.connectionDeadline)}. Leave margin for traffic, loading, check-in, security, or boarding.`
    : null;

  switch (booking.status) {
    case "requested":
      return {
        title: "Get ready while dispatch finds your driver",
        detail: "Confirm your pickup point, party size, and bags now so you can move quickly once a driver is assigned.",
        pickupDetail: accessDetail[booking.origin.accessType],
        connectionDetail: connection,
      };
    case "matched":
      return {
        title: "Your driver is assigned — prepare to move",
        detail: "Keep the party together, watch the verified driver/taxi details below, and be ready before the driver starts the final approach.",
        pickupDetail: accessDetail[booking.origin.accessType],
        connectionDetail: connection,
      };
    case "driver_en_route":
      return {
        title: "Be at the pickup point now",
        detail: "Your driver is moving toward you. Head to the saved pickup point with your full party and luggage ready.",
        pickupDetail: accessDetail[booking.origin.accessType],
        connectionDetail: connection,
      };
    case "arrived":
      return {
        title: "Driver waiting — verify before boarding",
        detail: "Match the arriving taxi and driver to the verified booking details below before entering the vehicle.",
        pickupDetail: accessDetail[booking.origin.accessType],
        connectionDetail: connection,
      };
    default:
      return {
        title: "Pickup readiness",
        detail: "Keep your party and bags together and follow the saved pickup instructions.",
        pickupDetail: accessDetail[booking.origin.accessType],
        connectionDetail: connection,
      };
  }
}

function connectionLabel(kind: NonNullable<RideBooking["connectionKind"]>) {
  switch (kind) {
    case "flight":
      return "Flight";
    case "ferry":
      return "Ferry";
    case "cruise":
      return "Cruise";
    case "appointment":
      return "Appointment";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function lifecyclePresentation(status: RideBooking["status"]) {
  switch (status) {
    case "requested":
      return {
        title: "Dispatching your ride",
        detail: "Your request is in dispatch. A driver has not been assigned yet.",
        confirmation: "Awaiting driver assignment",
      };
    case "matched":
      return {
        title: "Driver assigned",
        detail: "An authorized operator is assigned. Watch here for movement toward pickup.",
        confirmation: "Ride confirmed with a driver",
      };
    case "driver_en_route":
      return {
        title: "Driver heading to pickup",
        detail: "Your assigned driver is on the way. Live location appears below when available.",
        confirmation: "Driver confirmed and en route",
      };
    case "arrived":
      return {
        title: "Driver is at pickup",
        detail: "Meet your assigned driver at the pickup point and follow the saved pickup instructions.",
        confirmation: "Driver confirmed and waiting",
      };
    case "in_progress":
      return {
        title: "Ride in progress",
        detail: "Your trip is underway and remains connected to My Trip until completion.",
        confirmation: "Trip actively underway",
      };
    default:
      return {
        title: status.replaceAll("_", " "),
        detail: "Your ride status is updating.",
        confirmation: "Check current ride status",
      };
  }
}

function paymentPresentation(booking: RideBooking) {
  switch (booking.paymentStatus) {
    case "paid":
      return {
        title: "Payment complete",
        detail: "Payment is complete. This does not by itself mean a driver has been assigned.",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
      };
    case "processing":
      return {
        title: "Payment processing",
        detail: "Payment is still processing. Do not submit a second payment while this updates.",
        tone: "border-sky-200 bg-sky-50 text-sky-950",
      };
    case "failed":
      return {
        title: "Payment needs attention",
        detail: "The latest payment attempt failed. Review payment before relying on dispatch.",
        tone: "border-rose-200 bg-rose-50 text-rose-950",
      };
    case "refunded":
      return {
        title: "Payment refunded",
        detail: "The recorded payment has been refunded.",
        tone: "border-slate-200 bg-slate-50 text-slate-800",
      };
    case "canceled":
      return {
        title: "Payment canceled",
        detail: "No completed payment is recorded for this request.",
        tone: "border-slate-200 bg-slate-50 text-slate-800",
      };
    case "requires_payment_method":
    case "unpaid":
    default:
      return {
        title: "Payment not complete",
        detail: "Complete payment before treating this request as ready for dispatch.",
        tone: "border-amber-200 bg-amber-50 text-amber-950",
      };
  }
}

function currentStageTimestamp(booking: RideBooking) {
  switch (booking.status) {
    case "matched":
      return timestampMs(booking.matchedAt);
    case "driver_en_route":
      return timestampMs(booking.driverEnRouteAt);
    case "arrived":
      return timestampMs(booking.arrivedAt);
    case "in_progress":
      return timestampMs(booking.startedAt);
    default:
      return timestampMs(booking.createdAt);
  }
}

function timestampMs(value: TimestampLike | undefined) {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if ("toDate" in value && typeof value.toDate === "function") {
    const parsed = value.toDate().getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if ("seconds" in value && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  return null;
}

function formatDuration(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CarFront,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";
import { BookingTimeline } from "@/components/booking-timeline";

type Props = {
  riderId: string;
};

type RideIdentity = {
  driverName: string | null;
  vehicleDescription: string | null;
  taxiPlate: string | null;
  medallionNumber: string | null;
  associationName: string | null;
  dispatchPhone: string | null;
};

type SecureRideDetails = {
  bookingId: string;
  riderVerificationCode: string | null;
  rideIdentity: RideIdentity | null;
};

const ACTIVE_STATUSES: RideBooking["status"][] = [
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export function RiderTripHistory({ riderId }: Props) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secureRide, setSecureRide] = useState<SecureRideDetails | null>(null);

  useEffect(() => {
    return subscribeToRiderBookings(
      riderId,
      (data) => {
        setBookings(data);
        setErrorMessage(null);
      },
      (error) => {
        console.error(error);
        setErrorMessage(error.message);
      },
    );
  }, [riderId]);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)),
    [bookings],
  );

  const historicalBookings = useMemo(
    () => bookings.filter((booking) => !ACTIVE_STATUSES.includes(booking.status)),
    [bookings],
  );

  const selectedBooking =
    bookings.find((booking) => booking.id === selectedBookingId) ?? null;

  useEffect(() => {
    if (!bookings.length) {
      setSelectedBookingId(null);
      return;
    }

    if (
      selectedBookingId &&
      bookings.some((booking) => booking.id === selectedBookingId)
    ) {
      return;
    }

    if (activeBookings.length) {
      setSelectedBookingId(activeBookings[0].id);
      return;
    }

    if (historicalBookings.length) {
      setSelectedBookingId(historicalBookings[0].id);
    }
  }, [bookings, activeBookings, historicalBookings, selectedBookingId]);

  const primaryActive =
    selectedBooking && ACTIVE_STATUSES.includes(selectedBooking.status)
      ? selectedBooking
      : activeBookings[0] ?? null;
  const otherActiveBookings = primaryActive
    ? activeBookings.filter((booking) => booking.id !== primaryActive.id)
    : [];
  const selectedHistoricalBooking =
    selectedBooking && !ACTIVE_STATUSES.includes(selectedBooking.status)
      ? selectedBooking
      : historicalBookings[0] ?? null;
  const activeBookingId = primaryActive?.id ?? null;
  const riderVerificationStatus = primaryActive?.riderVerification?.status;

  useEffect(() => {
    if (!activeBookingId) {
      setSecureRide(null);
      return;
    }
    let cancelled = false;
    async function loadSecureRide() {
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(activeBookingId)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          riderVerificationCode?: string | null;
          rideIdentity?: RideIdentity | null;
        };
        if (!cancelled) {
          setSecureRide({
            bookingId: activeBookingId,
            riderVerificationCode: payload.riderVerificationCode ?? null,
            rideIdentity: payload.rideIdentity ?? null,
          });
        }
      } catch {
        // The live Firestore trip remains usable if the secure detail refresh fails.
      }
    }
    void loadSecureRide();
    const timer = window.setInterval(() => void loadSecureRide(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeBookingId, riderVerificationStatus]);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">
          Rider lounge
        </div>
        <h2 className="mt-3 text-4xl font-black italic tracking-tight text-[#043331]">
          Your island trip center
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-500">
          Track active rides, complete secure payment, review completed trips, and follow live trip movement across the territory.
        </p>
      </div>

      {errorMessage ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {primaryActive ? (
        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[linear-gradient(135deg,#043331_0%,#0b5d5b_55%,#14b8a6_100%)] px-6 py-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#fde68a]">
                  Active island trip
                </div>
                <StatusBadge status={primaryActive.status} />
              </div>

              <div className="mt-5 text-3xl font-black italic tracking-tight">
                {primaryActive.origin.estateName} → {primaryActive.destination.estateName}
              </div>

              <div className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-50/80">
                {primaryActive.mode} · {primaryActive.passengers} passenger
                {primaryActive.passengers === 1 ? "" : "s"} · {primaryActive.luggage} bag
                {primaryActive.luggage === 1 ? "" : "s"}
              </div>
            </div>

            <div className="space-y-6 p-6">
              <PaymentStatusPanel booking={primaryActive} />

              <MobileRideCommand
                booking={primaryActive}
                secureRide={
                  secureRide?.bookingId === primaryActive.id ? secureRide : null
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Driver"
                  value={
                    primaryActive.paymentStatus !== "paid"
                      ? "Payment required first"
                      : primaryActive.driverId
                        ? "Verified driver assigned"
                        : "Awaiting assignment"
                  }
                />
                <MetricCard
                  label="Vehicle"
                  value={
                    primaryActive.paymentStatus !== "paid"
                      ? "Dispatch not opened"
                      : primaryActive.vehicleId
                        ? "Verified fleet vehicle"
                        : "Pending match"
                  }
                />
                <MetricCard
                  label="Fare"
                  value={`$${primaryActive.quotedFare.total.toFixed(2)}`}
                />
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-[#f8f4ea] p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Rider guidance
                </div>
                <div className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                  {paymentAwareGuidance(primaryActive)}
                </div>
              </div>

              {otherActiveBookings.length ? (
                <div>
                  <div className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Other active trips
                  </div>
                  <div className="space-y-3">
                    {otherActiveBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBookingId(booking.id)}
                        className="block w-full rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#0f766e]/35 hover:bg-[#f8f4ea]"
                      >
                        <div className="text-lg font-black italic tracking-tight text-[#043331]">
                          {booking.origin.estateName} → {booking.destination.estateName}
                        </div>
                        <div className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          {prettyStatus(booking.status)} · {prettyPaymentStatus(booking.paymentStatus)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <BookingTimelineCard
            bookingId={primaryActive.id}
            booking={primaryActive}
          />
        </section>
      ) : (
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f59e0b]">
            No live movement
          </div>
          <div className="mt-3 text-2xl font-black italic tracking-tight text-[#043331]">
            No active trips right now.
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            Once you request a ride, payment and live trip activity will appear here.
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                Trip archive
              </div>
              <h3 className="mt-2 text-3xl font-black italic tracking-tight text-[#043331]">
                Recent island rides
              </h3>
            </div>
            <div className="rounded-full bg-[#f8f4ea] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {historicalBookings.length} trips
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {historicalBookings.length ? (
              historicalBookings.map((booking) => {
                const active = booking.id === selectedHistoricalBooking?.id;
                return (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`block w-full rounded-[24px] border p-4 text-left transition ${
                      active
                        ? "border-[#f5b942] bg-[#fff4d6]"
                        : "border-slate-200 bg-white hover:border-[#0f766e]/35 hover:bg-[#f8f4ea]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black italic tracking-tight text-[#043331]">
                          {booking.origin.estateName} → {booking.destination.estateName}
                        </div>
                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {booking.mode} · {prettyStatus(booking.status)} · {prettyPaymentStatus(booking.paymentStatus)}
                        </div>
                      </div>
                      <div className="text-lg font-black text-[#043331]">
                        ${booking.quotedFare.total.toFixed(2)}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-4 text-sm font-semibold text-slate-500">
                No completed or past trips yet.
              </div>
            )}
          </div>
        </section>

        <BookingTimelineCard
          bookingId={selectedHistoricalBooking?.id ?? null}
          booking={selectedHistoricalBooking}
        />
      </div>
    </section>
  );
}

function MobileRideCommand({
  booking,
  secureRide,
}: {
  booking: RideBooking;
  secureRide: SecureRideDetails | null;
}) {
  const identity = secureRide?.rideIdentity;
  const pickupHref = mapsHref(booking.origin.lat, booking.origin.lng);
  const dropoffHref = mapsHref(booking.destination.lat, booking.destination.lng);
  const scheduled = formatTripTime(booking.scheduledAt);
  const connection = formatTripTime(booking.connectionDeadline);

  return (
    <section className="overflow-hidden rounded-[28px] border border-teal-200 bg-white shadow-[0_16px_40px_rgba(4,51,49,.08)]">
      <div className="flex items-center justify-between gap-3 bg-[#043331] px-4 py-4 text-white sm:px-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">Live ride card</p>
          <p className="mt-1 text-lg font-black">Everything you need at pickup</p>
        </div>
        <ShieldCheck className="h-6 w-6 text-[#7ce0d4]" />
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        {identity ? (
          <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-800">
              <BadgeCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Verified pickup identity</p>
              <p className="mt-1 text-base font-black text-[#043331]">{identity.driverName || "Verified VI Guide driver"}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {identity.vehicleDescription || "Verified fleet vehicle"}
                {identity.taxiPlate ? ` · Taxi ${identity.taxiPlate}` : ""}
                {identity.medallionNumber ? ` · Medallion ${identity.medallionNumber}` : ""}
              </p>
              {identity.associationName ? <p className="mt-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{identity.associationName}</p> : null}
            </div>
          </div>
        ) : booking.driverId ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">Your verified driver and vehicle details are updating.</p>
        ) : null}

        {secureRide?.riderVerificationCode ? (
          <div className="flex items-center justify-between gap-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Pickup PIN</p>
                <p className="mt-1 text-xs font-semibold">Share only after matching the driver, vehicle, and taxi plate.</p>
              </div>
            </div>
            <p className="shrink-0 text-2xl font-black tracking-[.22em]">{secureRide.riderVerificationCode}</p>
          </div>
        ) : booking.riderVerification?.status === "verified" ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">
            <UserCheck className="h-5 w-5" /> Rider verified · trip cleared to start
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <RiderFact icon={CalendarClock} label="Pickup" value={scheduled || "As soon as matched"} />
          <RiderFact icon={Clock3} label="Connection" value={connection || "None recorded"} />
          <RiderFact icon={CarFront} label="Ride type" value={booking.serviceExpectation === "shared" ? "Shared · stops possible" : "Direct requested"} />
          <RiderFact icon={MapPin} label="Pickup access" value={`${capitalizeWord(booking.origin.accessType)} pickup`} />
        </div>

        {booking.origin.notes ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-amber-800">Pickup instructions</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-950">{booking.origin.notes}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <RideAction href={pickupHref} icon={Navigation} label="Pickup map" primary />
          <RideAction href={dropoffHref} icon={MapPin} label="Destination" />
          {identity?.dispatchPhone ? (
            <RideAction href={`tel:${identity.dispatchPhone}`} icon={Phone} label="Call dispatch" />
          ) : null}
        </div>

        <div className="rounded-[22px] border border-slate-200 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Official fare</p>
              <p className="mt-1 text-xs font-bold text-slate-600">{booking.quotedFare.tariffTitle} · {booking.quotedFare.tariffVersion}</p>
            </div>
            <p className="text-2xl font-black text-[#043331]">${booking.quotedFare.total.toFixed(2)}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-600">
            <span className="rounded-xl bg-slate-50 p-2">Route ${booking.quotedFare.routeFare.toFixed(2)}</span>
            <span className="rounded-xl bg-slate-50 p-2">Riders ${booking.quotedFare.passengerFare.toFixed(2)}</span>
            <span className="rounded-xl bg-slate-50 p-2">Bags ${booking.quotedFare.luggageFare.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RiderFact({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.13em] text-slate-400"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <p className="mt-2 text-xs font-black leading-5 text-[#043331]">{value}</p>
    </div>
  );
}

function RideAction({ href, icon: Icon, label, primary = false }: { href: string; icon: typeof Navigation; label: string; primary?: boolean }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] ${primary ? "bg-[#043331] text-white" : "border border-slate-200 bg-white text-[#043331]"}`}>
      <Icon className="h-4 w-4" /> {label}
    </a>
  );
}

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function formatTripTime(value?: RideBooking["scheduledAt"]) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function capitalizeWord(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function PaymentStatusPanel({ booking }: { booking: RideBooking }) {
  const paid = booking.paymentStatus === "paid";
  const processing = booking.paymentStatus === "processing";

  return (
    <section
      className={`rounded-[26px] border p-5 ${
        paid
          ? "border-emerald-200 bg-emerald-50"
          : processing
            ? "border-amber-200 bg-amber-50"
            : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Payment and dispatch gate
          </div>
          <div className="mt-2 text-xl font-black text-[#043331]">
            {paid
              ? "Fare paid · dispatch enabled"
              : processing
                ? "Payment is processing"
                : "Complete payment to open dispatch"}
          </div>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            {paid
              ? "VI Guide can now match this ride only with an eligible, verified driver and vehicle."
              : processing
                ? "Stripe is still confirming this payment. Dispatch remains closed until the booking is marked paid."
                : "The regulated fare is saved, but no driver should be assigned until secure payment is complete."}
          </p>
        </div>
        <span className="rounded-full border border-white bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 shadow-sm">
          {prettyPaymentStatus(booking.paymentStatus)}
        </span>
      </div>

      {!paid && !processing ? (
        <Link
          href={`/checkout/${booking.id}`}
          className="mt-4 inline-flex rounded-full bg-[#043331] px-5 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white"
        >
          Return to secure payment
        </Link>
      ) : null}
    </section>
  );
}

function BookingTimelineCard({
  bookingId,
  booking,
}: {
  bookingId: string | null;
  booking?: RideBooking | null;
}) {
  if (!bookingId) {
    return (
      <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-500">
          Select a trip to view its timeline.
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {booking ? (
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
            Selected trip
          </div>
          <div className="mt-4 text-2xl font-black italic tracking-tight text-[#043331]">
            {booking.origin.estateName} → {booking.destination.estateName}
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-500">
            {booking.passengers} passenger{booking.passengers === 1 ? "" : "s"} · {booking.luggage} bag{booking.luggage === 1 ? "" : "s"} · {booking.mode} · {prettyPaymentStatus(booking.paymentStatus)}
          </div>
        </section>
      ) : null}
      <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <BookingTimeline bookingId={bookingId} />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-[#043331]">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: RideBooking["status"] }) {
  return (
    <div className="rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur">
      {prettyStatus(status)}
    </div>
  );
}

function prettyStatus(status: RideBooking["status"]) {
  switch (status) {
    case "driver_en_route":
      return "Driver En Route";
    case "in_progress":
      return "In Progress";
    default:
      return status.replaceAll("_", " ");
  }
}

function prettyPaymentStatus(status: RideBooking["paymentStatus"]) {
  switch (status) {
    case "requires_payment_method":
      return "Payment required";
    case "paid":
      return "Paid";
    case "processing":
      return "Processing";
    case "failed":
      return "Payment failed";
    case "canceled":
      return "Payment canceled";
    default:
      return "Unpaid";
  }
}

function paymentAwareGuidance(booking: RideBooking) {
  if (booking.paymentStatus !== "paid") {
    if (booking.paymentStatus === "processing") {
      return "Payment confirmation is still processing. Dispatch will open automatically after the booking is marked paid.";
    }
    return "Complete secure payment before VI Guide releases this request to verified dispatch.";
  }
  return statusGuidance(booking.status);
}

function statusGuidance(status: RideBooking["status"]) {
  switch (status) {
    case "requested":
      return "Your paid ride request is in the island queue and waiting for a verified driver assignment.";
    case "matched":
      return "A verified driver and fleet vehicle are assigned. Expect movement toward pickup shortly.";
    case "driver_en_route":
      return "Your driver is on the way to the pickup point now.";
    case "arrived":
      return "Your driver has arrived. Head to the pickup location.";
    case "in_progress":
      return "Your ride is in progress across the island.";
    case "completed":
      return "Your trip is complete. The ride remains available in your archive.";
    case "cancelled":
      return "This ride was cancelled and dispatch has been updated.";
    default:
      return "Trip updates will appear here as your ride moves forward.";
  }
}

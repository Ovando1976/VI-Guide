"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import {
  BadgeCheck,
  CarFront,
  Clock3,
  CreditCard,
  DollarSign,
  Luggage,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Power,
  Radio,
  Route,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Users,
} from "lucide-react";

import { db } from "@/lib/firebase";
import type { RideBooking, TimestampLike } from "@/types/mobility";
import type { FleetVehicle, TaxiAssociation } from "@/types/taxi-operations";

type DriverProfile = {
  id: string;
  displayName?: string;
  availability?: "available" | "busy" | "offline";
  authorizationStatus?: string;
  taxiCommissionBadgeNumber?: string;
  rating?: number;
  reliabilityScore?: number;
  totalTrips?: number;
  vehicleId?: string;
  associationId?: string;
};

type BusyAction =
  | "availability"
  | "accept"
  | "en_route"
  | "arrived"
  | "verify"
  | "start"
  | "complete"
  | null;

const ACTIVE_STATUSES = ["matched", "driver_en_route", "arrived", "in_progress"] as const;
const WAIT_GRACE_SECONDS = 5 * 60;

export function DriverCommandDeck({ driverId }: { driverId: string }) {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [vehicle, setVehicle] = useState<FleetVehicle | null>(null);
  const [association, setAssociation] = useState<TaxiAssociation | null>(null);
  const [openBookings, setOpenBookings] = useState<RideBooking[]>([]);
  const [myBookings, setMyBookings] = useState<RideBooking[]>([]);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [riderPin, setRiderPin] = useState("");
  const [showFareReview, setShowFareReview] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const openQuery = query(
      collection(db, "bookings"),
      where("status", "==", "requested"),
      where("paymentStatus", "==", "paid"),
    );
    const mineQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", driverId),
    );

    const unsubOpen = onSnapshot(
      openQuery,
      (snapshot) => {
        setOpenBookings(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as RideBooking),
        );
      },
      (listenerError) => setError(listenerError.message),
    );
    const unsubMine = onSnapshot(
      mineQuery,
      (snapshot) => {
        setMyBookings(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as RideBooking),
        );
      },
      (listenerError) => setError(listenerError.message),
    );
    const unsubDriver = onSnapshot(
      doc(db, "drivers", driverId),
      (snapshot) => {
        setDriver(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as DriverProfile)
            : null,
        );
      },
      (listenerError) => setError(listenerError.message),
    );

    return () => {
      unsubOpen();
      unsubMine();
      unsubDriver();
    };
  }, [driverId]);

  useEffect(() => {
    setVehicle(null);
    if (!driver?.vehicleId) return;
    return onSnapshot(
      doc(db, "vehicles", driver.vehicleId),
      (snapshot) =>
        setVehicle(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as FleetVehicle)
            : null,
        ),
      (listenerError) => setError(listenerError.message),
    );
  }, [driver?.vehicleId]);

  useEffect(() => {
    setAssociation(null);
    if (!driver?.associationId) return;
    return onSnapshot(
      doc(db, "taxiAssociations", driver.associationId),
      (snapshot) =>
        setAssociation(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as TaxiAssociation)
            : null,
        ),
      (listenerError) => setError(listenerError.message),
    );
  }, [driver?.associationId]);

  const activeTrip = useMemo(
    () =>
      sortByTripTime(
        myBookings.filter((booking) =>
          ACTIVE_STATUSES.includes(
            booking.status as (typeof ACTIVE_STATUSES)[number],
          ),
        ),
      )[0] ?? null,
    [myBookings],
  );

  const nextRequest = useMemo(
    () => sortByTripTime(openBookings)[0] ?? null,
    [openBookings],
  );

  const completedToday = useMemo(() => {
    const today = new Date(now);
    return myBookings.filter(
      (booking) =>
        booking.status === "completed" &&
        isSameLocalDay(toMillis(booking.completedAt), today),
    );
  }, [myBookings, now]);

  const todayEarnings = useMemo(
    () =>
      completedToday.reduce(
        (sum, booking) => sum + (booking.payout?.driverPayout ?? 0),
        0,
      ),
    [completedToday],
  );

  useEffect(() => {
    if (activeTrip?.status !== "arrived") return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeTrip?.status]);

  useEffect(() => {
    setRiderPin("");
    setShowFareReview(false);
  }, [activeTrip?.id]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const isAvailable = driver?.availability === "available";
  const hasActiveTrip = Boolean(activeTrip);
  const medallion = vehicle?.medallionNumber ?? "Not linked";
  const coreRecordsActive =
    driver?.authorizationStatus === "active" &&
    association?.status === "active" &&
    vehicle?.active === true &&
    Boolean(vehicle?.medallionNumber);
  const rating =
    typeof driver?.rating === "number" ? driver.rating.toFixed(2) : "—";
  const reliability = formatReliability(driver?.reliabilityScore);
  const waitState = activeTrip?.status === "arrived"
    ? getWaitState(activeTrip.arrivedAt, now)
    : null;

  async function postAction(
    url: string,
    body: Record<string, unknown>,
    action: BusyAction,
    successMessage: string,
  ) {
    setBusyAction(action);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Driver action failed.");
      }
      setNotice(successMessage);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Driver action failed.",
      );
      throw actionError;
    } finally {
      setBusyAction(null);
    }
  }

  async function toggleAvailability() {
    if (!driver?.id || hasActiveTrip) return;
    const availability = isAvailable ? "offline" : "available";
    await postAction(
      `/api/drivers/${driver.id}/availability`,
      { availability },
      "availability",
      availability === "available"
        ? "You are online and eligible for paid dispatch."
        : "You are offline.",
    ).catch(() => undefined);
  }

  async function acceptRequest() {
    if (!nextRequest) return;
    if (!isAvailable) {
      setError("Go online before accepting a job. The server will re-check all Commission and fleet credentials.");
      return;
    }
    if (!hasOfficialFare(nextRequest)) {
      setError("This job has no complete official tariff snapshot. It cannot be accepted from the command deck.");
      return;
    }
    await postAction(
      `/api/bookings/${nextRequest.id}/accept`,
      { driverId },
      "accept",
      "Job accepted. You are assigned and marked busy.",
    ).catch(() => undefined);
  }

  async function advanceTrip(
    status: "driver_en_route" | "arrived" | "in_progress" | "completed",
    action: BusyAction,
    message: string,
  ) {
    if (!activeTrip) return;
    await postAction(
      `/api/bookings/${activeTrip.id}/status`,
      { status, message },
      action,
      message,
    ).catch(() => undefined);
  }

  async function verifyRider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTrip) return;
    if (!/^\d{4}$/.test(riderPin)) {
      setError("Enter the rider's 4-digit trip PIN.");
      return;
    }
    await postAction(
      `/api/bookings/${activeTrip.id}/verify-rider`,
      { code: riderPin },
      "verify",
      "Rider verified. Trip start is unlocked.",
    )
      .then(() => setRiderPin(""))
      .catch(() => undefined);
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[32px] border border-[#043331]/10 bg-white shadow-[0_22px_70px_rgba(4,51,49,.12)]">
      <div className="bg-[linear-gradient(135deg,#032f2d,#075c56)] px-4 py-4 text-white sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              <CarFront className="h-4 w-4" /> Driver command deck
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
              Action first. Tariff governed. Medallion protected.
            </h2>
          </div>

          <button
            type="button"
            onClick={toggleAvailability}
            disabled={Boolean(busyAction) || hasActiveTrip || !driver}
            className={`min-h-16 min-w-[190px] rounded-[22px] border px-6 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
              hasActiveTrip
                ? "border-amber-300/35 bg-amber-400/15"
                : isAvailable
                  ? "border-emerald-300/40 bg-emerald-400 text-[#032f2d] shadow-[0_0_28px_rgba(52,211,153,.28)]"
                  : "border-white/15 bg-white/10 text-white"
            }`}
          >
            <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] opacity-70">
              <Power className="h-4 w-4" /> Shift status
            </span>
            <span className="mt-1 block text-xl font-black tracking-[-.03em]">
              {hasActiveTrip ? "TRIP ACTIVE" : isAvailable ? "ONLINE" : "GO ONLINE"}
            </span>
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div className={`border-b px-4 py-3 text-sm font-bold sm:px-6 ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {error ?? notice}
        </div>
      )}

      <div className="grid gap-3 border-b border-slate-100 bg-[#fbfaf6] p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <Metric label="Today" value={formatMoney(todayEarnings)} detail={`${completedToday.length} completed`} icon={DollarSign} />
        <Metric label="Rating" value={rating} detail={`Reliability ${reliability}`} icon={BadgeCheck} />
        <Metric label="Medallion" value={medallion} detail={coreRecordsActive ? "Core records active" : "Server gate will verify"} icon={ShieldCheck} />
        <Metric label="Demand radar" value={`${openBookings.length} live`} detail={association?.name ?? "Association dispatch"} icon={Route} />
      </div>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.4fr_.6fr]">
        <div className="min-w-0">
          {activeTrip ? (
            <ActiveTripCard
              booking={activeTrip}
              vehicle={vehicle}
              busyAction={busyAction}
              riderPin={riderPin}
              setRiderPin={setRiderPin}
              verifyRider={verifyRider}
              waitState={waitState}
              showFareReview={showFareReview}
              setShowFareReview={setShowFareReview}
              advanceTrip={advanceTrip}
            />
          ) : nextRequest ? (
            <IncomingJobCard
              booking={nextRequest}
              isAvailable={isAvailable}
              accepting={busyAction === "accept"}
              onAccept={acceptRequest}
            />
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-[28px] border border-dashed border-[#043331]/15 bg-[#f7f2e7]/55 p-8 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#043331] text-[#f5c451]">
                  <Radio className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-[-.04em]">Standing by for the next paid job.</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
                  Stay online to receive governed requests. No surge pricing is generated here; the booking carries its official tariff snapshot into dispatch.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[26px] bg-[#043331] p-5 text-white">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">Smart radar</p>
            <div className="mt-4 space-y-3">
              <QuickLink href="/map" icon={MapPin} title="Living Map" detail="Pickup pins + island context" />
              <QuickLink href="/cruises" icon={Ship} title="Cruise board" detail="Port-day intelligence" />
            </div>
            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[.06] p-4">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-white/45">Shared capacity</p>
              <p className="mt-1 text-lg font-black">
                {vehicle?.passengerCapacity ? `${vehicle.passengerCapacity} seats` : "Fleet capacity pending"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-white/55">
                Multi-party corridor sequencing and return-leg matching plug into this deck next.
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#043331]/10 bg-white p-5">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Communication</p>
            <div className="mt-4 grid gap-2">
              {association?.dispatchPhone ? (
                <a href={`tel:${association.dispatchPhone}`} className="flex min-h-12 items-center gap-3 rounded-2xl bg-[#f7f2e7] px-4 text-sm font-black text-[#043331]">
                  <Radio className="h-4 w-4" /> Call dispatch
                </a>
              ) : (
                <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-400">
                  <Radio className="h-4 w-4" /> Dispatch number pending
                </div>
              )}
              <button type="button" disabled className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-100 px-4 text-left text-sm font-black text-slate-400">
                <MessageCircle className="h-4 w-4" /> Passenger relay — next integration
              </button>
              <button type="button" onClick={() => setShowSafety((value) => !value)} className="flex min-h-12 items-center gap-3 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 text-left text-sm font-black text-rose-800">
                <ShieldAlert className="h-4 w-4" /> Safety / SOS actions
              </button>
            </div>

            {showSafety ? (
              <div className="mt-3 rounded-[18px] border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold leading-5 text-rose-900">
                  Emergency actions require an intentional second tap. This release does not pretend to broadcast directly to authorities or nearby drivers.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <a href="tel:911" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-xs font-black uppercase tracking-[.12em] text-white">
                    <Phone className="h-4 w-4" /> Call 911
                  </a>
                  {association?.dispatchPhone ? (
                    <a href={`tel:${association.dispatchPhone}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-[.12em] text-rose-800">
                      <Radio className="h-4 w-4" /> Call dispatch
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function IncomingJobCard({
  booking,
  isAvailable,
  accepting,
  onAccept,
}: {
  booking: RideBooking;
  isAvailable: boolean;
  accepting: boolean;
  onAccept: () => void;
}) {
  const official = hasOfficialFare(booking);
  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-amber-300 bg-amber-50 shadow-[0_18px_50px_rgba(245,196,81,.18)]">
      <div className="flex items-center justify-between gap-3 bg-amber-300/45 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-rose-600 shadow-[0_0_14px_rgba(225,29,72,.45)]" />
          <span className="text-[10px] font-black uppercase tracking-[.18em] text-amber-950">Incoming paid job</span>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-amber-950">
          {booking.serviceExpectation === "shared" ? "Shared" : "Direct request"}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <LocationBlock label="Pickup" value={booking.origin.estateName} />
          <Navigation className="hidden h-5 w-5 text-amber-600 sm:block" />
          <LocationBlock label="Destination" value={booking.destination.estateName} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniStat icon={Users} label="Passengers" value={String(booking.passengers)} />
          <MiniStat icon={Luggage} label="Luggage" value={String(booking.luggage)} />
          <MiniStat icon={DollarSign} label="Official total" value={official ? formatMoney(booking.quotedFare.total) : "Blocked"} />
        </div>

        <div className="mt-5 rounded-[18px] border border-amber-200 bg-white/70 p-4 text-xs font-semibold leading-5 text-amber-950/75">
          {official ? (
            <>
              <span className="font-black text-amber-950">{booking.quotedFare.tariffTitle}</span>
              {` · ${booking.quotedFare.tariffVersion}. The server re-checks driver, medallion, association, vehicle and payment eligibility when you accept.`}
            </>
          ) : (
            "Official tariff metadata is incomplete. Fail-closed: do not dispatch this booking."
          )}
        </div>

        <button
          type="button"
          onClick={onAccept}
          disabled={!isAvailable || accepting || !official}
          className="mt-5 min-h-16 w-full rounded-[22px] bg-[#043331] px-6 text-lg font-black uppercase tracking-[.08em] text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {accepting ? "Accepting…" : isAvailable ? "ACCEPT JOB" : "GO ONLINE TO ACCEPT"}
        </button>
      </div>
    </div>
  );
}

function ActiveTripCard({
  booking,
  vehicle,
  busyAction,
  riderPin,
  setRiderPin,
  verifyRider,
  waitState,
  showFareReview,
  setShowFareReview,
  advanceTrip,
}: {
  booking: RideBooking;
  vehicle: FleetVehicle | null;
  busyAction: BusyAction;
  riderPin: string;
  setRiderPin: (value: string) => void;
  verifyRider: (event: FormEvent<HTMLFormElement>) => void;
  waitState: ReturnType<typeof getWaitState> | null;
  showFareReview: boolean;
  setShowFareReview: (value: boolean) => void;
  advanceTrip: (
    status: "driver_en_route" | "arrived" | "in_progress" | "completed",
    action: BusyAction,
    message: string,
  ) => Promise<void>;
}) {
  const riderVerified = booking.riderVerification?.status === "verified";
  const official = hasOfficialFare(booking);
  const capacity = vehicle?.passengerCapacity;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#043331]/12 bg-[#f7f2e7]/50">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#043331] px-5 py-4 text-white">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">Active trip</p>
          <p className="mt-1 text-lg font-black">{statusLabel(booking.status)}</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]">
          {booking.serviceExpectation === "shared" ? "Shared route" : "Direct request"}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <LocationBlock label="Pickup" value={booking.origin.estateName} detail={booking.origin.notes} />
          <Navigation className="hidden h-5 w-5 text-amber-600 sm:block" />
          <LocationBlock label="Destination" value={booking.destination.estateName} detail={booking.destination.notes} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <MiniStat icon={Users} label="Passengers" value={capacity ? `${booking.passengers} / ${capacity}` : String(booking.passengers)} />
          <MiniStat icon={Luggage} label="Luggage" value={String(booking.luggage)} />
          <MiniStat icon={CreditCard} label="Payment" value={booking.paymentStatus === "paid" ? "Verified" : booking.paymentStatus ?? "Unknown"} />
          <MiniStat icon={DollarSign} label="Governed fare" value={official ? formatMoney(booking.quotedFare.total) : "Blocked"} />
        </div>

        {booking.status === "arrived" && waitState ? (
          <div className={`mt-5 rounded-[20px] border p-4 ${waitState.chargeableSeconds > 0 ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">
                  {waitState.chargeableSeconds > 0
                    ? `Beyond 5-minute grace: ${formatDuration(waitState.chargeableSeconds)}`
                    : `Grace remaining: ${formatDuration(waitState.graceRemainingSeconds)}`}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 opacity-75">
                  Arrival time is server-recorded. This deck tracks eligibility time only; it does not invent a dollar wait charge before that rule exists in the governed tariff engine.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/map" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#043331]/12 bg-white px-4 text-xs font-black uppercase tracking-[.12em] text-[#043331]">
            <MapPin className="h-4 w-4" /> Open pickup map
          </Link>
          <div className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#043331]/12 bg-white px-4 text-center text-xs font-black uppercase tracking-[.12em] text-[#043331]">
            <Route className="h-4 w-4" /> {booking.connectionKind ? `${booking.connectionKind} connection` : "Island route"}
          </div>
        </div>

        {booking.status === "matched" ? (
          <ActionButton
            label="START NAVIGATION"
            working={busyAction === "en_route"}
            onClick={() => advanceTrip("driver_en_route", "en_route", "Driver is en route to pickup.")}
          />
        ) : null}

        {booking.status === "driver_en_route" ? (
          <ActionButton
            label="ARRIVE / PICKUP"
            working={busyAction === "arrived"}
            onClick={() => advanceTrip("arrived", "arrived", "Driver arrived at pickup. Waiting grace period started.")}
          />
        ) : null}

        {booking.status === "arrived" && !riderVerified ? (
          <form onSubmit={verifyRider} className="mt-5 rounded-[22px] border border-[#043331]/12 bg-white p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <p className="font-black">Verify rider before moving</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Ask the passenger for the 4-digit trip PIN. The server will not allow trip start without it.</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={riderPin}
                onChange={(event) => setRiderPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Rider 4-digit PIN"
                placeholder="4-digit PIN"
                className="min-h-14 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-[#f7f2e7] px-4 text-center text-xl font-black tracking-[.32em] outline-none focus:border-emerald-500"
              />
              <button type="submit" disabled={busyAction === "verify" || riderPin.length !== 4} className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-xs font-black uppercase tracking-[.12em] text-white disabled:opacity-40">
                {busyAction === "verify" ? "Checking…" : "Verify"}
              </button>
            </div>
          </form>
        ) : null}

        {booking.status === "arrived" && riderVerified ? (
          <ActionButton
            label="START TRIP"
            working={busyAction === "start"}
            onClick={() => advanceTrip("in_progress", "start", "Rider verified. Trip started.")}
          />
        ) : null}

        {booking.status === "in_progress" && !showFareReview ? (
          <ActionButton
            label="DROP OFF / REVIEW FARE"
            working={false}
            onClick={() => setShowFareReview(true)}
          />
        ) : null}

        {booking.status === "in_progress" && showFareReview ? (
          <FareReview
            booking={booking}
            working={busyAction === "complete"}
            onBack={() => setShowFareReview(false)}
            onComplete={() => advanceTrip("completed", "complete", "Trip completed. Fare moved to settlement review.")}
          />
        ) : null}
      </div>
    </div>
  );
}

function FareReview({
  booking,
  working,
  onBack,
  onComplete,
}: {
  booking: RideBooking;
  working: boolean;
  onBack: () => void;
  onComplete: () => void;
}) {
  const official = hasOfficialFare(booking);
  return (
    <div className="mt-5 rounded-[24px] border-2 border-[#043331] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Final fare review</p>
          <h4 className="mt-1 text-2xl font-black tracking-[-.04em]">Transparent before completion.</h4>
        </div>
        <CreditCard className="h-6 w-6 text-[#043331]" />
      </div>

      {official ? (
        <>
          <div className="mt-5 space-y-2 rounded-[18px] bg-[#f7f2e7] p-4 text-sm font-bold">
            <FareLine label="Published route component" value={booking.quotedFare.routeFare} />
            <FareLine label="Passenger component" value={booking.quotedFare.passengerFare} />
            <FareLine label="Governed luggage component" value={booking.quotedFare.luggageFare} />
            <FareLine label="Authorized additional charges" value={booking.quotedFare.authorizedAdditionalCharges} />
            <div className="mt-3 flex items-center justify-between border-t border-[#043331]/10 pt-3 text-lg font-black">
              <span>Official total</span>
              <span>{formatMoney(booking.quotedFare.total)}</span>
            </div>
          </div>
          <div className="mt-3 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-900">
            <strong>{booking.quotedFare.tariffTitle}</strong>{` · ${booking.quotedFare.tariffVersion}. No driver-editable surge or mileage price is added here. Wait-time, after-hours, exclusive-ride, or other adjustments remain $0 unless they are explicitly present in the governed quote.`}
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-800">
          Completion blocked: official tariff snapshot is missing or invalid.
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onBack} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[.12em] text-[#043331]">Back</button>
        <button type="button" onClick={onComplete} disabled={!official || working} className="min-h-12 rounded-2xl bg-[#043331] px-4 text-xs font-black uppercase tracking-[.12em] text-white disabled:opacity-40">
          {working ? "Completing…" : "CONFIRM & COMPLETE"}
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof DollarSign }) {
  return (
    <div className="rounded-[22px] border border-[#043331]/8 bg-white p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-slate-400"><Icon className="h-4 w-4 text-amber-600" /> {label}</div>
      <p className="mt-2 truncate text-2xl font-black tracking-[-.04em] text-[#043331]">{value}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#043331]/8 bg-white p-4">
      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.14em] text-slate-400"><Icon className="h-3.5 w-3.5 text-amber-600" /> {label}</div>
      <p className="mt-2 text-lg font-black text-[#043331]">{value}</p>
    </div>
  );
}

function LocationBlock({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[.16em] text-amber-600">{label}</p>
      <p className="mt-1 text-xl font-black tracking-[-.03em] text-[#043331]">{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p> : null}
    </div>
  );
}

function QuickLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof MapPin; title: string; detail: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 rounded-[18px] border border-white/10 bg-white/[.07] px-4 transition hover:bg-white/[.12]">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <span><span className="block text-sm font-black">{title}</span><span className="block text-[10px] font-semibold text-white/50">{detail}</span></span>
    </Link>
  );
}

function ActionButton({ label, working, onClick }: { label: string; working: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={working} className="mt-5 min-h-16 w-full rounded-[22px] bg-[#043331] px-6 text-lg font-black uppercase tracking-[.08em] text-white shadow-lg transition hover:brightness-110 disabled:opacity-50">
      {working ? "Working…" : label}
    </button>
  );
}

function FareLine({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-slate-600">{label}</span><span className="font-black text-[#043331]">{formatMoney(value)}</span></div>;
}

function hasOfficialFare(booking: RideBooking) {
  return (
    booking.quotedFare?.pricingModel === "official_usvi_taxi_tariff" &&
    booking.quotedFare?.quoteStatus === "official" &&
    Boolean(booking.quotedFare?.tariffId) &&
    Boolean(booking.quotedFare?.tariffVersion) &&
    Number.isFinite(booking.quotedFare?.total) &&
    booking.quotedFare.total > 0
  );
}

function sortByTripTime(bookings: RideBooking[]) {
  return [...bookings].sort((left, right) => {
    const leftTime = toMillis(left.scheduledAt ?? left.createdAt);
    const rightTime = toMillis(right.scheduledAt ?? right.createdAt);
    return leftTime - rightTime;
  });
}

function toMillis(value?: TimestampLike | null) {
  if (!value) return 0;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if ("seconds" in value && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return 0;
}

function isSameLocalDay(timestamp: number, today: Date) {
  if (!timestamp) return false;
  const value = new Date(timestamp);
  return (
    value.getFullYear() === today.getFullYear() &&
    value.getMonth() === today.getMonth() &&
    value.getDate() === today.getDate()
  );
}

function getWaitState(arrivedAt: TimestampLike | undefined, now: number) {
  const arrived = toMillis(arrivedAt);
  const elapsedSeconds = arrived ? Math.max(0, Math.floor((now - arrived) / 1000)) : 0;
  return {
    elapsedSeconds,
    graceRemainingSeconds: Math.max(0, WAIT_GRACE_SECONDS - elapsedSeconds),
    chargeableSeconds: Math.max(0, elapsedSeconds - WAIT_GRACE_SECONDS),
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatReliability(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

function statusLabel(status: RideBooking["status"]) {
  switch (status) {
    case "matched":
      return "Job accepted — ready to navigate";
    case "driver_en_route":
      return "En route to pickup";
    case "arrived":
      return "At pickup — verify rider";
    case "in_progress":
      return "Passenger aboard — trip in progress";
    default:
      return status.replaceAll("_", " ");
  }
}

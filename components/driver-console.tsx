"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Clock3,
  DollarSign,
  Flame,
  History,
  Map as MapIcon,
  MapPin,
  Navigation,
  ShieldCheck,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";

import { db } from "@/lib/firebase";
import type { PaymentStatus } from "@/components/ops/ops-ui";
import {
  OpsCard,
  OpsMetric,
  OpsPill,
  OpsSection,
  PaymentPill,
  StatusPill,
} from "@/components/ops/ops-ui";

type DriverBooking = {
  id: string;
  status: string;
  paymentStatus?: PaymentStatus;
  mode: string;
  island?: "stt" | "stj" | "stx";
  driverId?: string | null;
  passengers?: number;
  luggage?: number;
  notes?: string;
  origin?: { estateName?: string; lat?: number; lng?: number };
  destination?: { estateName?: string; lat?: number; lng?: number };
  quotedFare?: {
    total?: number;
    quoteStatus?: "official" | "provisional";
  };
  finalFare?: number;
  payout?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
  };
  acceptedAt?: FirestoreDateLike;
  completedAt?: FirestoreDateLike;
  createdAt?: FirestoreDateLike;
  updatedAt?: FirestoreDateLike;
};

type DriverProfile = {
  id: string;
  displayName?: string;
  idHint?: string;
  availability?: "available" | "busy" | "offline";
  islands?: string[];
  reliabilityScore?: number;
  rating?: number;
  totalTrips?: number;
};

type FirestoreDateLike =
  | { seconds?: number; nanoseconds?: number }
  | string
  | undefined;

type DriverAvailability = "available" | "busy" | "offline";
type DriverConsoleTab = "console" | "hotspots" | "wallet" | "history";

const DRIVER_STATUSES: DriverAvailability[] = ["available", "busy", "offline"];

const TAB_BUTTON_BASE =
  "flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition";

const ACTION_BUTTON_BASE =
  "rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition disabled:opacity-60";

const PRIMARY_BUTTON =
  "rounded-2xl bg-[#043331] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:brightness-105 disabled:opacity-40";

const SECONDARY_BUTTON =
  "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#043331] transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40";

type Hotspot = {
  title: string;
  subtitle: string;
  value: string;
  footnote: string;
  tone: "amber" | "emerald" | "slate";
  icon: LucideIcon;
};

const STATIC_HOTSPOTS: Hotspot[] = [
  {
    title: "Airport Sector",
    subtitle: "Taxi stand coverage",
    value: "Coverage",
    footnote: "Official tariff only · no surge",
    tone: "amber",
    icon: Flame,
  },
  {
    title: "Red Hook Ferry",
    subtitle: "Ferry arrival coverage",
    value: "Active",
    footnote: "Association dispatch queue",
    tone: "emerald",
    icon: MapPin,
  },
  {
    title: "Charlotte Amalie",
    subtitle: "Town taxi coverage",
    value: "Steady",
    footnote: "No surge pricing",
    tone: "slate",
    icon: Clock3,
  },
];

export function DriverConsole({ driverId }: { driverId: string }) {
  const [activeTab, setActiveTab] = useState<DriverConsoleTab>("console");
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const openQuery = query(
      collection(db, "bookings"),
      where("status", "==", "requested"),
      where("paymentStatus", "==", "paid")
    );

    const mineQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", driverId)
    );

    const driverRef = doc(db, "drivers", driverId);

    const unsubOpen = onSnapshot(
      openQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as DriverBooking[];

        setBookings((prev) => mergeBookings(prev, rows));
        setErrorMessage(null);
      },
      (error) => {
        console.error("open bookings listener error", error);
        setErrorMessage(error.message);
      }
    );

    const unsubMine = onSnapshot(
      mineQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as DriverBooking[];

        setBookings((prev) => mergeBookings(prev, rows));
        setErrorMessage(null);
      },
      (error) => {
        console.error("my bookings listener error", error);
        setErrorMessage(error.message);
      }
    );

    const unsubDriver = onSnapshot(
      driverRef,
      (snapshot) => {
        setDriver(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as DriverProfile) : null);
        if (!snapshot.exists()) setErrorMessage("Your driver account is active, but no matching fleet profile was found. Ask dispatch to link your account to a driver record.");
      },
      (error) => {
        console.error("driver profile listener error", error);
        setErrorMessage(error.message);
      }
    );

    return () => {
      unsubOpen();
      unsubMine();
      unsubDriver();
    };
  }, [driverId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const isOnline = driver?.availability === "available";
  const authorizedIslands = useMemo(
    () => new Set((driver?.islands ?? []).map((value) => value.toLowerCase())),
    [driver?.islands]
  );

  const marketplace = useMemo(
    () =>
      sortBookings(
        bookings.filter(
          (booking) =>
            booking.status === "requested" &&
            booking.paymentStatus === "paid" &&
            booking.quotedFare?.quoteStatus === "official" &&
            Boolean(booking.island && authorizedIslands.has(booking.island))
        )
      ),
    [authorizedIslands, bookings]
  );

  const activeTrips = useMemo(
    () =>
      sortBookings(
        bookings.filter(
          (booking) =>
            booking.driverId === driverId &&
            ["matched", "driver_en_route", "arrived", "in_progress"].includes(
              booking.status
            )
        )
      ),
    [bookings, driverId]
  );

  const history = useMemo(
    () =>
      sortBookings(
        bookings.filter(
          (booking) =>
            booking.driverId === driverId &&
            ["completed", "cancelled"].includes(booking.status)
        )
      ),
    [bookings, driverId]
  );

  const completedTrips = useMemo(
    () => history.filter((booking) => booking.status === "completed"),
    [history]
  );

  const metrics = useMemo(() => {
    const gross = completedTrips.reduce(
      (sum, booking) => sum + (booking.payout?.driverPayout ?? 0),
      0
    );

    const platform = completedTrips.reduce(
      (sum, booking) => sum + (booking.payout?.platformRevenue ?? 0),
      0
    );

    const islandMix = bookings.reduce<Record<string, number>>((acc, booking) => {
      const key = normalizeIslandLabel(booking.island || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const avgPayout =
      completedTrips.length > 0 ? gross / completedTrips.length : 0;

    return {
      marketplace: marketplace.length,
      active: activeTrips.length,
      completed: completedTrips.length,
      gross,
      platform,
      avgPayout,
      islandMix,
    };
  }, [activeTrips.length, bookings, completedTrips, marketplace.length]);

  async function updateAvailability(availability: DriverAvailability) {
    if (!driver?.id) return;

    try {
      setWorkingId(`availability:${availability}`);

      const res = await fetch(`/api/drivers/${driver.id}/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ availability }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update availability.");
      }

      setToastMessage(
        availability === "available"
          ? "You are now online and visible for paid rides."
          : availability === "busy"
            ? "You are marked busy."
            : "You are now offline."
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Availability update failed."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function acceptBooking(bookingId: string) {
    try {
      if (!isOnline) {
        throw new Error("Go online before accepting rides.");
      }
      if (activeTrips.length) {
        throw new Error("Finish your active trip before accepting another ride.");
      }

      const booking = marketplace.find((entry) => entry.id === bookingId);
      if (!booking) throw new Error("This ride is no longer available.");
      const confirmed = window.confirm(
        `Accept ${booking.origin?.estateName || "pickup"} → ${
          booking.destination?.estateName || "destination"
        } for $${(booking.quotedFare?.total ?? 0).toFixed(2)}?`
      );
      if (!confirmed) return;

      setWorkingId(bookingId);

      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to accept booking.");
      }

      setToastMessage("Trip accepted. Navigate to pickup.");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Accept failed.");
    } finally {
      setWorkingId(null);
    }
  }

  async function advanceStatus(
    bookingId: string,
    status: string,
    message: string
  ) {
    try {
      if (
        status === "in_progress" &&
        !window.confirm("Confirm the rider is aboard and start this trip?")
      ) {
        return;
      }
      if (
        status === "completed" &&
        !window.confirm("Confirm the rider has arrived and complete this trip?")
      ) {
        return;
      }
      setWorkingId(`${bookingId}:${status}`);

      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          actorType: "driver",
          message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update trip.");
      }

      setToastMessage(message);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Status update failed."
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-10">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                isOnline
                  ? "bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.55)]"
                  : driver?.availability === "busy"
                    ? "bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.4)]"
                    : "bg-slate-300"
              }`}
            />
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#043331]">
              {isOnline
                ? "On Duty"
                : driver?.availability === "busy"
                  ? "Busy"
                  : "Offline"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:block">
              {driver?.displayName || driver?.idHint || "Driver"}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#043331] text-xs font-black text-white">
              {(driver?.displayName || driver?.idHint || "D").charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7">
        {errorMessage ? (
          <div className="mb-6 flex items-center gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="mb-5 flex w-fit max-w-full flex-wrap gap-2 rounded-[20px] border border-slate-200 bg-white p-1.5 shadow-sm">
          <TabButton
            active={activeTab === "console"}
            icon={Activity}
            label="Console"
            onClick={() => setActiveTab("console")}
          />
          <TabButton
            active={activeTab === "hotspots"}
            icon={MapIcon}
            label="Hotspots"
            onClick={() => setActiveTab("hotspots")}
          />
          <TabButton
            active={activeTab === "wallet"}
            icon={Wallet}
            label="Wallet"
            onClick={() => setActiveTab("wallet")}
          />
          <TabButton
            active={activeTab === "history"}
            icon={History}
            label="History"
            onClick={() => setActiveTab("history")}
          />
        </div>

        {activeTab === "console" ? (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <OpsSection
                eyebrow="Driver OS"
                title="Driver operations"
                subtitle="Premium trip-running across the U.S. Virgin Islands."
                actions={
                  <div className="flex flex-wrap gap-2">
                    {DRIVER_STATUSES.map((state) => {
                      const active = driver?.availability === state;
                      return (
                        <button
                          key={state}
                          onClick={() => updateAvailability(state)}
                          disabled={workingId === `availability:${state}`}
                          className={`${ACTION_BUTTON_BASE} ${
                            active
                              ? "bg-[#043331] text-white"
                              : "border border-slate-200 bg-white text-[#043331] hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {workingId === `availability:${state}`
                            ? "Updating..."
                            : state}
                        </button>
                      );
                    })}
                  </div>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <OpsMetric
                    label="Driver"
                    value={driver?.displayName || driver?.idHint || "—"}
                  />
                  <OpsMetric
                    label="Availability"
                    value={prettyAvailability(driver?.availability)}
                  />
                  <OpsMetric
                    label="Islands"
                    value={(driver?.islands || []).join(", ").toUpperCase() || "—"}
                  />
                  <OpsMetric
                    label="Reliability"
                    value={String(driver?.reliabilityScore ?? 0)}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <OpsMetric
                    label="Marketplace"
                    value={String(metrics.marketplace)}
                  />
                  <OpsMetric label="Active" value={String(metrics.active)} />
                  <OpsMetric
                    label="Completed"
                    value={String(metrics.completed)}
                    tone="success"
                  />
                  <OpsMetric
                    label="Gross"
                    value={`$${metrics.gross.toFixed(2)}`}
                  />
                  <OpsMetric
                    label="Avg Payout"
                    value={`$${metrics.avgPayout.toFixed(2)}`}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <OpsPill
                    label={`Rating ${driver?.rating?.toFixed(2) ?? "—"}`}
                  />
                  <OpsPill
                    label={`Trips ${driver?.totalTrips ?? completedTrips.length}`}
                  />
                  {Object.entries(metrics.islandMix).map(([key, count]) => (
                    <OpsPill key={key} label={`${key}:${count}`} />
                  ))}
                </div>
              </OpsSection>

              <OpsSection
                eyebrow="Marketplace"
                title="Open paid requests"
                subtitle="Paid rides on your authorized islands with a resolvable tariff appear here."
              >
                <div className="space-y-4">
                  {marketplace.length ? (
                    marketplace.map((booking) => (
                      <DriverTripCard
                        key={booking.id}
                        booking={booking}
                        footer={
                          <button
                            onClick={() => acceptBooking(booking.id)}
                            disabled={
                              workingId === booking.id ||
                              !isOnline ||
                              activeTrips.length > 0
                            }
                            className={PRIMARY_BUTTON}
                          >
                            {workingId === booking.id
                              ? "Accepting..."
                              : activeTrips.length
                                ? "Finish active trip"
                                : "Review & accept"}
                          </button>
                        }
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={Zap}
                      title="No open paid ride requests"
                      description="When paid demand comes in, it will appear here."
                    />
                  )}
                </div>
              </OpsSection>

              <OpsSection
                eyebrow="Active trips"
                title="Accepted and in motion"
                subtitle="The surface for what you are doing right now."
              >
                <div className="space-y-4">
                  {activeTrips.length ? (
                    activeTrips.map((booking) => (
                      <DriverTripCard
                        key={booking.id}
                        booking={booking}
                        hero
                        footer={
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={navigationHref(booking)}
                              target="_blank"
                              rel="noreferrer"
                              className={SECONDARY_BUTTON}
                            >
                              Navigate
                            </a>
                            {booking.status === "matched" ? (
                              <button
                                onClick={() =>
                                  advanceStatus(
                                    booking.id,
                                    "driver_en_route",
                                    "Driver is en route to pickup."
                                  )
                                }
                                disabled={workingId === `${booking.id}:driver_en_route`}
                                className={PRIMARY_BUTTON}
                              >
                                En route
                              </button>
                            ) : null}

                            {booking.status === "driver_en_route" ? (
                              <button
                                onClick={() =>
                                  advanceStatus(
                                    booking.id,
                                    "arrived",
                                    "Driver arrived at pickup."
                                  )
                                }
                                disabled={workingId === `${booking.id}:arrived`}
                                className={PRIMARY_BUTTON}
                              >
                                Arrived
                              </button>
                            ) : null}

                            {booking.status === "arrived" ? (
                              <button
                                onClick={() =>
                                  advanceStatus(
                                    booking.id,
                                    "in_progress",
                                    "Trip started."
                                  )
                                }
                                disabled={workingId === `${booking.id}:in_progress`}
                                className={PRIMARY_BUTTON}
                              >
                                Start trip
                              </button>
                            ) : null}

                            {booking.status === "in_progress" ? (
                              <button
                                onClick={() =>
                                  advanceStatus(
                                    booking.id,
                                    "completed",
                                    "Trip completed."
                                  )
                                }
                                disabled={workingId === `${booking.id}:completed`}
                                className="rounded-2xl bg-emerald-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:brightness-105 disabled:opacity-40"
                              >
                                Complete trip
                              </button>
                            ) : null}

                          </div>
                        }
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={Navigation}
                      title="No active trips"
                      description="Accepted rides will appear here once you're matched."
                    />
                  )}
                </div>
              </OpsSection>
            </div>

            <div className="space-y-8">
              <OpsSection
                eyebrow="Coverage guidance"
                title="Where service may be needed"
                subtitle="Operational positioning cues only. Fares always follow the configured tariff and never surge."
              >
                <div className="grid gap-4">
                  {STATIC_HOTSPOTS.map((item) => (
                    <SignalCard key={item.title} {...item} />
                  ))}
                </div>
              </OpsSection>

              <OpsSection
                eyebrow="Wallet snapshot"
                title="Current earnings"
                subtitle="Driver-facing payout visibility."
              >
                <div className="grid gap-4">
                  <MoneyCard
                    icon={DollarSign}
                    label="Completed earnings"
                    value={`$${metrics.gross.toFixed(2)}`}
                  />
                  <MoneyCard
                    icon={ShieldCheck}
                    label="Platform kept"
                    value={`$${metrics.platform.toFixed(2)}`}
                  />
                  <MoneyCard
                    icon={Truck}
                    label="Lifetime trips"
                    value={String(driver?.totalTrips ?? completedTrips.length)}
                  />
                </div>
              </OpsSection>

              <OpsSection
                eyebrow="Recent archive"
                title="Completed and closed"
                actions={<OpsPill label={`${history.length} trips`} />}
              >
                <div className="space-y-4">
                  {history.length ? (
                    history.slice(0, 5).map((booking) => (
                      <DriverTripCard key={booking.id} booking={booking} compact />
                    ))
                  ) : (
                    <EmptyState
                      icon={History}
                      title="No trip history"
                      description="Completed or cancelled trips will appear here."
                    />
                  )}
                </div>
              </OpsSection>
            </div>
          </div>
        ) : null}

        {activeTab === "hotspots" ? <HotspotsView /> : null}

        {activeTab === "wallet" ? (
          <WalletView
            driver={driver}
            completedTrips={completedTrips}
            gross={metrics.gross}
            platform={metrics.platform}
            avgPayout={metrics.avgPayout}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryView bookings={history} />
        ) : null}
      </main>

      {toastMessage ? (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-2xl">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${TAB_BUTTON_BASE} ${
        active
          ? "bg-[#043331] text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#043331]"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function DriverTripCard({
  booking,
  footer,
  compact = false,
  hero = false,
}: {
  booking: DriverBooking;
  footer?: React.ReactNode;
  compact?: boolean;
  hero?: boolean;
}) {
  const amount =
    booking.status === "completed"
      ? booking.payout?.driverPayout ?? booking.finalFare ?? 0
      : booking.quotedFare?.total ?? 0;

  return (
    <OpsCard>
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${
          hero ? "rounded-[20px] bg-[linear-gradient(135deg,rgba(4,51,49,0.04)_0%,rgba(20,184,166,0.04)_100%)] p-3" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
            {booking.mode}
          </div>

          <div
            className={`mt-2 font-black italic text-[#043331] ${
              compact ? "text-lg" : hero ? "text-3xl" : "text-2xl"
            }`}
          >
            {booking.origin?.estateName || "Unknown origin"} →{" "}
            {booking.destination?.estateName || "Unknown destination"}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <PaymentPill status={booking.paymentStatus || "unpaid"} />
            <StatusPill status={booking.status} />
            <OpsPill label={normalizeIslandLabel(booking.island || "unknown")} />
            <OpsPill label={`${booking.passengers ?? 0} pax`} />
            <OpsPill label={`${booking.luggage ?? 0} bags`} />
          </div>

          {!compact && booking.notes ? (
            <div className="mt-3 text-sm font-semibold text-slate-500">
              {booking.notes}
            </div>
          ) : null}
        </div>

        <div className="text-right">
          <div className="text-lg font-black text-[#043331]">
            ${amount.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {booking.status === "completed" ? "Driver payout" : "Quoted fare"}
          </div>
        </div>
      </div>

      {hero ? <TripProgress status={booking.status} /> : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </OpsCard>
  );
}

const TRIP_PROGRESS_STEPS = [
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
  "completed",
] as const;

function TripProgress({ status }: { status: string }) {
  const current = TRIP_PROGRESS_STEPS.indexOf(
    status as (typeof TRIP_PROGRESS_STEPS)[number]
  );

  return (
    <div className="mt-4 grid grid-cols-5 gap-1" aria-label="Trip progress">
      {TRIP_PROGRESS_STEPS.map((step, index) => (
        <div key={step} className="min-w-0">
          <div
            className={`h-1.5 rounded-full ${
              index <= current ? "bg-teal-600" : "bg-slate-200"
            }`}
          />
          <div className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
            {step === "driver_en_route"
              ? "En route"
              : step.replaceAll("_", " ")}
          </div>
        </div>
      ))}
    </div>
  );
}

function navigationHref(booking: DriverBooking) {
  const target = ["matched", "driver_en_route"].includes(booking.status)
    ? booking.origin
    : booking.destination;
  const query =
    typeof target?.lat === "number" && typeof target?.lng === "number"
      ? `${target.lat},${target.lng}`
      : target?.estateName || "U.S. Virgin Islands";

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

function SignalCard({
  icon: Icon,
  title,
  subtitle,
  value,
  footnote,
  tone,
}: Hotspot) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[24px] border p-5 ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/80 p-3">
            <Icon size={18} className="text-[#043331]" />
          </div>
          <div>
            <div className="text-sm font-black text-[#043331]">{title}</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="text-lg font-black text-[#043331]">{value}</div>
      </div>

      <div className="mt-3 text-xs font-semibold text-slate-500">{footnote}</div>
    </div>
  );
}

function MoneyCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {label}
        </div>
        <Icon size={16} className="text-slate-400" />
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-[#043331]">
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon size={18} className="text-slate-400" />
      </div>
      <div className="mt-4 text-sm font-black text-[#043331]">{title}</div>
      <div className="mt-2 text-sm font-semibold text-slate-500">
        {description}
      </div>
    </div>
  );
}

function HotspotsView() {
  return (
    <OpsSection
      eyebrow="Coverage"
      title="Territory positioning guide"
      subtitle="Service coverage guidance for airport, ferry, harbor, and town movement. This is not a surge-pricing signal."
    >
      <div className="relative h-[560px] overflow-hidden rounded-[32px] border border-slate-200 bg-slate-900">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600">
          <path
            d="M120,310 Q220,140 420,170 T700,125 T900,300 T690,470 T420,440 T120,310"
            fill="none"
            stroke="#0f766e"
            strokeWidth="34"
            strokeLinejoin="round"
          />
          <path
            d="M120,310 Q220,140 420,170 T700,125 T900,300 T690,470 T420,440 T120,310"
            fill="#14b8a6"
            opacity="0.08"
          />

          <circle cx="175" cy="285" r="65" fill="url(#airport)" />
          <circle cx="810" cy="275" r="48" fill="url(#ferry)" />
          <circle cx="520" cy="315" r="36" fill="url(#town)" />

          <defs>
            <radialGradient id="airport">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ferry">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="town">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g>
            <circle cx="500" cy="300" r="9" fill="#10b981" />
            <circle cx="500" cy="300" r="18" fill="#10b981" fillOpacity="0.2" />
          </g>
        </svg>

        <div className="absolute bottom-6 left-6 right-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
              Airport sector
            </div>
            <div className="mt-2 text-2xl font-black italic">Arrival coverage</div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              Position for scheduled arrivals. Official tariff only; no surge.
            </div>
          </div>

          <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Red Hook ferry
            </div>
            <div className="mt-2 text-2xl font-black italic">Ferry coverage</div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              Position around published ferry arrival cycles.
            </div>
          </div>

          <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
              Town corridor
            </div>
            <div className="mt-2 text-2xl font-black italic">Steady flow</div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              Consistent movement between town, cruise, and hotel zones.
            </div>
          </div>
        </div>
      </div>
    </OpsSection>
  );
}

function WalletView({
  driver,
  completedTrips,
  gross,
  platform,
  avgPayout,
}: {
  driver: DriverProfile | null;
  completedTrips: DriverBooking[];
  gross: number;
  platform: number;
  avgPayout: number;
}) {
  return (
    <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
      <OpsSection
        eyebrow="Wallet"
        title="Payout balance"
        subtitle="A premium payout snapshot for the driver side of the platform."
      >
        <div className="rounded-[32px] bg-[linear-gradient(135deg,#043331_0%,#0b5d5b_55%,#14b8a6_100%)] p-8 text-white">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-teal-100/65">
            Available balance
          </div>
          <div className="mt-4 text-6xl font-black italic tracking-tight">
            ${gross.toFixed(2)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <OpsPill label={`Trips ${completedTrips.length}`} />
            <OpsPill label={`Avg ${avgPayout.toFixed(2)}`} />
            <OpsPill label={`Rating ${driver?.rating?.toFixed(2) ?? "—"}`} />
          </div>
        </div>
      </OpsSection>

      <OpsSection eyebrow="Wallet stats" title="Performance and payout">
        <div className="grid gap-4">
          <MoneyCard
            icon={DollarSign}
            label="Driver earnings"
            value={`$${gross.toFixed(2)}`}
          />
          <MoneyCard
            icon={ShieldCheck}
            label="Platform kept"
            value={`$${platform.toFixed(2)}`}
          />
          <MoneyCard
            icon={Truck}
            label="Lifetime trips"
            value={String(driver?.totalTrips ?? completedTrips.length)}
          />
        </div>
      </OpsSection>
    </div>
  );
}

function HistoryView({ bookings }: { bookings: DriverBooking[] }) {
  return (
    <OpsSection
      eyebrow="History"
      title="Completed and cancelled trips"
      subtitle="A structured archive of driver movement and payouts."
    >
      <div className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Route
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Mode
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Date
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Payout
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length ? (
              bookings.map((booking) => {
                const completedMs = getTimeValue(
                  booking.completedAt || booking.updatedAt || booking.createdAt
                );
                const dateLabel = completedMs
                  ? new Date(completedMs).toLocaleDateString()
                  : "—";

                return (
                  <tr key={booking.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-[#043331]">
                        {booking.origin?.estateName || "Unknown origin"} →{" "}
                        {booking.destination?.estateName || "Unknown destination"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {booking.mode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill status={booking.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {dateLabel}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-[#043331]">
                      $
                      {(
                        booking.payout?.driverPayout ??
                        booking.finalFare ??
                        booking.quotedFare?.total ??
                        0
                      ).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm font-semibold text-slate-500"
                >
                  No trip history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </OpsSection>
  );
}

function prettyAvailability(value?: string) {
  switch (value) {
    case "available":
      return "AVAILABLE";
    case "busy":
      return "BUSY";
    case "offline":
      return "OFFLINE";
    default:
      return "UNKNOWN";
  }
}

function normalizeIslandLabel(value: string) {
  const key = value.toLowerCase();

  if (key === "stt") return "STT";
  if (key === "stj") return "STJ";
  if (key === "stx") return "STX";
  return "UNASSIGNED";
}

function mergeBookings(
  prev: DriverBooking[],
  next: DriverBooking[]
): DriverBooking[] {
  const map = new Map<string, DriverBooking>();

  for (const booking of prev) {
    map.set(booking.id, booking);
  }

  for (const booking of next) {
    map.set(booking.id, booking);
  }

  return sortBookings(Array.from(map.values()));
}

function sortBookings(bookings: DriverBooking[]) {
  return [...bookings].sort((a, b) => {
    const aTime = getTimeValue(a.updatedAt || a.completedAt || a.createdAt);
    const bTime = getTimeValue(b.updatedAt || b.completedAt || b.createdAt);
    return bTime - aTime;
  });
}

function getTimeValue(value: FirestoreDateLike): number {
  if (!value) return 0;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  return 0;
}

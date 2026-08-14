"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Anchor,
  CalendarClock,
  Clock3,
  CreditCard,
  DollarSign,
  Flame,
  History,
  Map as MapIcon,
  MapPin,
  Navigation,
  ShieldCheck,
  Truck,
  UserCheck,
  Wallet,
  Zap,
} from "lucide-react";

import { db } from "@/lib/firebase";
import type { PaymentStatus } from "@/components/ops/ops-ui";
import type { FleetVehicle, TaxiAssociation } from "@/types/taxi-operations";
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
  scheduledAt?: FirestoreDateLike;
  connectionDeadline?: FirestoreDateLike;
  connectionKind?: "flight" | "ferry" | "cruise" | "appointment" | null;
  paymentMethod?: "online_card";
  serviceExpectation?: "shared" | "direct_request";
  origin?: {
    estateName?: string;
    lat?: number;
    lng?: number;
    notes?: string;
    accessType?: "roadside" | "villa" | "beach" | "airport" | "ferry" | "resort";
  };
  destination?: {
    estateName?: string;
    lat?: number;
    lng?: number;
    notes?: string;
    accessType?: "roadside" | "villa" | "beach" | "airport" | "ferry" | "resort";
  };
  quotedFare?: {
    total?: number;
    routeFare?: number;
    passengerFare?: number;
    luggageFare?: number;
    tariffTitle?: string;
    tariffVersion?: string;
    tariffSourceUrl?: string;
    ruleNotes?: string;
  };
  estimatedSettlement?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
    feeAgreementId: string;
  };
  finalFare?: number;
  payout?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
  };
  acceptedAt?: FirestoreDateLike;
  matchedAt?: FirestoreDateLike;
  driverEnRouteAt?: FirestoreDateLike;
  arrivedAt?: FirestoreDateLike;
  startedAt?: FirestoreDateLike;
  completedAt?: FirestoreDateLike;
  createdAt?: FirestoreDateLike;
  updatedAt?: FirestoreDateLike;
  riderVerification?: {
    status: "required" | "verified";
  };
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
  vehicleId?: string;
  associationId?: string;
};

type FirestoreDateLike =
  | { seconds?: number; nanoseconds?: number }
  | string
  | null
  | undefined;

type DriverAvailability = "available" | "busy" | "offline";
type DriverConsoleTab = "console" | "hotspots" | "wallet" | "history";

const DRIVER_STATUSES: DriverAvailability[] = ["available", "busy", "offline"];

const TAB_BUTTON_BASE =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition sm:px-5";

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
    value: "Priority",
    footnote: "Official tariff applies",
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
  const [vehicle, setVehicle] = useState<FleetVehicle | null>(null);
  const [association, setAssociation] = useState<TaxiAssociation | null>(null);
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
      (error) => {
        console.error("driver vehicle listener error", error);
        setErrorMessage(error.message);
      },
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
      (error) => {
        console.error("driver association listener error", error);
        setErrorMessage(error.message);
      },
    );
  }, [driver?.associationId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const isOnline = driver?.availability === "available";

  const marketplace = useMemo(
    () =>
      sortBookings(
        bookings.filter(
          (booking) =>
            booking.status === "requested" && booking.paymentStatus === "paid"
        )
      ),
    [bookings]
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
      <div className="sticky top-0 z-40 overflow-hidden rounded-[24px] border border-[#f5c451]/20 bg-[linear-gradient(135deg,rgba(3,47,45,.98),rgba(7,80,76,.96))] text-white shadow-[0_14px_38px_rgba(3,47,45,.16)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`h-3 w-3 shrink-0 rounded-full ${
                isOnline
                  ? "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]"
                  : driver?.availability === "busy"
                    ? "bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.52)]"
                    : "bg-white/35"
              }`}
            />
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f5c451]">
                Driver control
              </div>
              <div className="mt-0.5 text-[11px] font-black uppercase tracking-[0.22em] text-white">
                {isOnline
                  ? "On Duty"
                  : driver?.availability === "busy"
                    ? "Busy"
                    : "Offline"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-black/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/70 sm:block">
              {driver?.displayName || driver?.idHint || "Driver"}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5c451] text-xs font-black text-[#032f2d] shadow-[0_8px_20px_rgba(245,196,81,.16)]">
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

        <div
          aria-label="Driver operations views"
          className="mb-5 flex max-w-full gap-1.5 overflow-x-auto rounded-[22px] border border-[#043331]/10 bg-[#043331] p-1.5 shadow-[0_12px_32px_rgba(4,51,49,.12)]"
        >
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
                subtitle="Governed trip-running across the U.S. Virgin Islands."
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

                <div className="mt-4 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FleetFact label="Assigned vehicle" value={vehicleLabel(vehicle)} />
                  <FleetFact label="Taxi identity" value={vehicle?.taxiPlate ? `${vehicle.taxiPlate}${vehicle.medallionNumber ? ` · Medallion ${vehicle.medallionNumber}` : ""}` : "Not available"} />
                  <FleetFact label="Capacity" value={vehicle ? `${vehicle.passengerCapacity} passengers · ${vehicle.luggageCapacity} bags` : "Not available"} />
                  <FleetFact label="Association dispatch" value={association ? `${association.name}${association.dispatchPhone ? ` · ${association.dispatchPhone}` : ""}` : "Not available"} />
                </div>
              </OpsSection>

              <OpsSection
                eyebrow="Marketplace"
                title="Open paid requests"
                subtitle="Only fully paid rides appear here."
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
                            disabled={workingId === booking.id || !isOnline}
                            className={PRIMARY_BUTTON}
                          >
                            {workingId === booking.id
                              ? "Accepting..."
                              : "Accept trip"}
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

                            {booking.status === "arrived" &&
                            booking.riderVerification?.status === "required" ? (
                              <RiderPinControl bookingId={booking.id} />
                            ) : null}

                            {booking.status === "arrived" &&
                            booking.riderVerification?.status !== "required" ? (
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

                            {!["completed", "cancelled"].includes(booking.status) ? (
                              <button
                                type="button"
                                className={SECONDARY_BUTTON}
                              >
                                Message rider
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
                eyebrow="Positioning intelligence"
                title="Coverage signals"
                subtitle="Reference sectors for driver positioning; this panel does not represent real-time demand."
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
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${TAB_BUTTON_BASE} ${
        active
          ? "bg-[#f5c451] text-[#032f2d] shadow-[0_8px_22px_rgba(245,196,81,.18)]"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={14} className={active ? "text-[#032f2d]" : "text-[#f5c451]"} />
      {label}
    </button>
  );
}

function FleetFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-black leading-5 text-[#043331]">{value}</p>
    </div>
  );
}

function RiderPinControl({ bookingId }: { bookingId: string }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verifyRider(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(code)) {
      setError("Enter the rider's 4-digit PIN.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch(`/api/bookings/${bookingId}/verify-rider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Rider verification failed.");
      setCode("");
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Rider verification failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={verifyRider} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`rider-pin-${bookingId}`}>
        Rider pickup PIN
      </label>
      <input
        id={`rider-pin-${bookingId}`}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{4}"
        placeholder="4-digit PIN"
        className="min-h-11 w-36 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black tracking-[0.2em] text-[#043331] outline-none focus:border-teal-500"
      />
      <button type="submit" disabled={submitting || code.length !== 4} className={PRIMARY_BUTTON}>
        <span className="inline-flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          {submitting ? "Checking" : "Verify rider"}
        </span>
      </button>
      {error ? <p className="w-full text-xs font-bold text-rose-700">{error}</p> : null}
    </form>
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
  const scheduledTime = formatDateTime(booking.scheduledAt);
  const connectionTime = formatDateTime(booking.connectionDeadline);
  const sharedRide =
    booking.serviceExpectation === "shared" ||
    booking.mode === "shared" ||
    booking.mode === "safari";
  const pickupNavigation = coordinateHref(booking.origin);
  const destinationNavigation = coordinateHref(booking.destination);
  const stageTime = formatDateTime(stageTimestamp(booking));

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
            <OpsPill label={sharedRide ? "Shared · stops possible" : "Direct requested"} />
            <OpsPill label={`Trip ${booking.id.slice(-8).toUpperCase()}`} />
          </div>

          {!compact ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TripFact
                icon={CalendarClock}
                label="Pickup"
                value={scheduledTime || "As soon as matched"}
              />
              <TripFact
                icon={booking.connectionKind === "ferry" ? Anchor : Clock3}
                label={
                  booking.connectionKind
                    ? `${capitalize(booking.connectionKind)} connection`
                    : "Connection"
                }
                value={connectionTime || "None recorded"}
              />
              <TripFact
                icon={CreditCard}
                label="Payment"
                value={
                  booking.paymentStatus === "paid"
                    ? "Paid online · dispatch cleared"
                    : "Payment not cleared"
                }
              />
              <TripFact
                icon={DollarSign}
                label="Expected driver settlement"
                value={
                  booking.estimatedSettlement
                    ? `$${booking.estimatedSettlement.driverPayout.toFixed(2)} after $${booking.estimatedSettlement.platformRevenue.toFixed(2)} service fee`
                    : "Calculated at completion"
                }
              />
              <TripFact
                icon={MapPin}
                label="Pickup access"
                value={pickupAccessLabel(booking.origin?.accessType)}
              />
              <TripFact
                icon={Activity}
                label="Current stage since"
                value={stageTime || "Just updated"}
              />
            </div>
          ) : null}

          {!compact ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <RouteStop
                label="Pickup"
                name={booking.origin?.estateName || "Unknown origin"}
                notes={booking.origin?.notes}
                href={pickupNavigation}
              />
              <RouteStop
                label="Drop-off"
                name={booking.destination?.estateName || "Unknown destination"}
                notes={booking.destination?.notes}
                href={destinationNavigation}
              />
            </div>
          ) : null}

          {!compact && booking.quotedFare ? (
            <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Official fare record</p>
                  <p className="mt-1 text-xs font-black text-[#043331]">
                    {booking.quotedFare.tariffTitle || "USVI taxi tariff"}
                    {booking.quotedFare.tariffVersion ? ` · ${booking.quotedFare.tariffVersion}` : ""}
                  </p>
                </div>
                {booking.quotedFare.tariffSourceUrl ? (
                  <a href={booking.quotedFare.tariffSourceUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700 underline underline-offset-4">
                    View tariff
                  </a>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <FarePart label="Route" value={booking.quotedFare.routeFare} />
                <FarePart label="Passengers" value={booking.quotedFare.passengerFare} />
                <FarePart label="Luggage" value={booking.quotedFare.luggageFare} />
                <FarePart label="Total" value={booking.quotedFare.total} strong />
              </div>
              {booking.quotedFare.ruleNotes ? <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{booking.quotedFare.ruleNotes}</p> : null}
            </div>
          ) : null}

          {hero && booking.connectionDeadline ? (
            <ConnectionCountdown deadline={booking.connectionDeadline} />
          ) : null}

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

      {footer ? <div className="mt-4">{footer}</div> : null}
    </OpsCard>
  );
}

function RouteStop({ label, name, notes, href }: { label: string; name: string; notes?: string; href: string | null }) {
  return (
    <div className="rounded-[18px] border border-teal-100 bg-teal-50/60 p-4">
      <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">{label}</p>
      <p className="mt-1 text-sm font-black text-[#043331]">{name}</p>
      <p className="mt-1 min-h-5 text-xs font-semibold leading-5 text-slate-600">{notes || "No additional location instructions."}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#043331] px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-white">
          <Navigation className="h-3.5 w-3.5" /> Navigate
        </a>
      ) : null}
    </div>
  );
}

function FarePart({ label, value, strong = false }: { label: string; value?: number; strong?: boolean }) {
  return (
    <div className={`rounded-xl bg-white p-3 ${strong ? "text-[#043331] ring-1 ring-teal-200" : "text-slate-600"}`}>
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-1 font-black">${(value ?? 0).toFixed(2)}</p>
    </div>
  );
}

function TripFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] border border-slate-100 bg-slate-50 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-[8px] font-black uppercase tracking-[.16em] text-slate-400">
          {label}
        </span>
        <span className="mt-1 block text-xs font-black leading-5 text-[#043331]">
          {value}
        </span>
      </span>
    </div>
  );
}

function ConnectionCountdown({ deadline }: { deadline: FirestoreDateLike }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const deadlineMs = getTimeValue(deadline);
  if (!deadlineMs || now === null) return null;
  const minutes = Math.ceil((deadlineMs - now) / 60_000);
  const missed = minutes < 0;

  return (
    <div
      className={`mt-4 flex items-center justify-between gap-3 rounded-[18px] border p-4 ${
        missed || minutes <= 30
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : minutes <= 60
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "border-teal-200 bg-teal-50 text-teal-950"
      }`}
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em]">
        <Clock3 size={16} /> Protected connection
      </span>
      <span className="text-sm font-black">
        {missed ? `${Math.abs(minutes)} min past deadline` : `${minutes} min remaining`}
      </span>
    </div>
  );
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
      eyebrow="Hotspots"
      title="Territory positioning map"
      subtitle="A static operating reference for airport, ferry, harbor, and town coverage—not a real-time demand feed."
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
            <div className="mt-2 text-2xl font-black italic">Tariff-governed priority</div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              High-traffic pickup sector. Official taxi tariff remains in effect.
            </div>
          </div>

          <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Red Hook ferry
            </div>
            <div className="mt-2 text-2xl font-black italic">Ferry-cycle coverage</div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              Position for scheduled arrival periods and association dispatch.
            </div>
          </div>

          <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
              Town corridor
            </div>
            <div className="mt-2 text-2xl font-black italic">Steady coverage</div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              Maintain service across town, cruise, and hotel corridors.
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

function formatDateTime(value: FirestoreDateLike) {
  const timestamp = getTimeValue(value);
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function coordinateHref(location?: { lat?: number; lng?: number }) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${location!.lat},${location!.lng}`;
}

function pickupAccessLabel(value?: DriverBooking["origin"] extends infer T ? T extends { accessType?: infer A } ? A : never : never) {
  if (!value) return "Roadside pickup";
  return `${capitalize(value)} pickup`;
}

function stageTimestamp(booking: DriverBooking) {
  if (booking.status === "in_progress") return booking.startedAt;
  if (booking.status === "arrived") return booking.arrivedAt;
  if (booking.status === "driver_en_route") return booking.driverEnRouteAt;
  if (booking.status === "matched") return booking.matchedAt ?? booking.acceptedAt;
  return booking.createdAt;
}

function vehicleLabel(vehicle: FleetVehicle | null) {
  if (!vehicle) return "Not available";
  const description = [vehicle.color, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  return description || vehicle.id;
}

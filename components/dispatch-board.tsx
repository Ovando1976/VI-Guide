"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query } from "firebase/firestore";
import { BookingTimeline } from "@/components/booking-timeline";
import { AdminShell } from "@/components/admin-shell";
import {
  DateRangeFilter,
  type DateRangeKey,
} from "@/components/date-range-filter";
import { getTimeValue, isInDateRange } from "@/lib/date-range";
import { db } from "@/lib/firebase";
import {
  OpsCard,
  OpsKeyValue,
  OpsMetric,
  OpsPanel,
  OpsSection,
  OpsPill,
  PaymentPill,
  StatusPill,
  type PaymentStatus,
} from "@/components/ops/ops-ui";

type DispatchBooking = {
  id: string;
  status: string;
  paymentStatus?: PaymentStatus;
  paymentIntentId?: string | null;
  mode: string;
  riderId: string;
  island?: "stt" | "stj" | "stx";
  driverId?: string;
  passengers?: number;
  luggage?: number;
  notes?: string;
  origin?: { estateName?: string };
  destination?: { estateName?: string };
  quotedFare?: { total?: number };
  finalFare?: number;
  payout?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
  };
  createdAt?: { seconds?: number; nanoseconds?: number } | string;
};

type DriverProfileLite = {
  id: string;
  idHint?: string;
  displayName?: string;
  availability?: string;
  islands?: string[];
  reliabilityScore?: number;
  verified?: boolean;
  authorizationStatus?: string;
  associationId?: string;
  vehicleId?: string;
};

const STATUS_ORDER = [
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
] as const;

type StatusKey = (typeof STATUS_ORDER)[number];

export function DispatchBoard() {
  const [range, setRange] = useState<DateRangeKey>("all");
  const [bookings, setBookings] = useState<DispatchBooking[]>([]);
  const [drivers, setDrivers] = useState<DriverProfileLite[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => isInDateRange(booking.createdAt, range)),
    [bookings, range]
  );

  useEffect(() => {
    const unsubBookings = onSnapshot(
      query(collection(db, "bookings")),
      (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as DispatchBooking[];

        setBookings(sortBookings(rows));
        setErrorMessage(null);
      },
      (error) => {
        console.error("dispatch bookings listener error", error);
        setErrorMessage(error.message);
      }
    );

    const unsubDrivers = onSnapshot(
      query(collection(db, "drivers")),
      (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as DriverProfileLite[];

        setDrivers(
          [...rows].sort(
            (a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0)
          )
        );
      },
      (error) => {
        console.error("dispatch drivers listener error", error);
        setErrorMessage(error.message);
      }
    );

    return () => {
      unsubBookings();
      unsubDrivers();
    };
  }, []);

  const selectedBooking =
    visibleBookings.find((booking) => booking.id === selectedBookingId) ?? null;

  useEffect(() => {
    if (!visibleBookings.length) {
      setSelectedBookingId(null);
      return;
    }

    if (
      selectedBookingId &&
      visibleBookings.some((booking) => booking.id === selectedBookingId)
    ) {
      return;
    }

    const preferred =
      visibleBookings.find(
        (booking) =>
          booking.status === "requested" && booking.paymentStatus === "paid"
      ) ?? visibleBookings[0];

    setSelectedBookingId(preferred.id);
  }, [visibleBookings, selectedBookingId]);

  useEffect(() => {
    setSelectedDriverId(selectedBooking?.driverId ?? "");
  }, [selectedBooking?.driverId]);

  const grouped = useMemo(() => {
    const result: Record<StatusKey, DispatchBooking[]> = {
      requested: [],
      matched: [],
      driver_en_route: [],
      arrived: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };

    for (const booking of visibleBookings) {
      result[normalizeStatus(booking.status)].push(booking);
    }

    return result;
  }, [visibleBookings]);

  const metrics = useMemo(() => {
    const open = grouped.requested.length;
    const active =
      grouped.matched.length +
      grouped.driver_en_route.length +
      grouped.arrived.length +
      grouped.in_progress.length;
    const completed = grouped.completed.length;

    const avgFare =
      visibleBookings.length > 0
        ? visibleBookings.reduce(
            (sum, booking) => sum + (booking.quotedFare?.total ?? 0),
            0
          ) / visibleBookings.length
        : 0;

    const platform = visibleBookings.reduce(
      (sum, booking) => sum + (booking.payout?.platformRevenue ?? 0),
      0
    );

    const paid = visibleBookings.filter(
      (booking) => booking.paymentStatus === "paid"
    ).length;

    const unpaid = visibleBookings.filter(
      (booking) => (booking.paymentStatus || "unpaid") !== "paid"
    ).length;

    return { open, active, completed, avgFare, platform, paid, unpaid };
  }, [visibleBookings, grouped]);

  const visibleStatusOrder = useMemo(
    () => STATUS_ORDER.filter((status) => status === "requested" || grouped[status].length > 0),
    [grouped],
  );
  const quietStatuses = STATUS_ORDER.filter((status) => !visibleStatusOrder.includes(status));

  const normalizedDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const hasIdentity = Boolean(driver.displayName || driver.idHint);
      const hasAvailability = typeof driver.availability === "string";
      const isCredentialed =
        driver.verified === true &&
        driver.authorizationStatus === "active" &&
        Boolean(driver.associationId && driver.vehicleId);
      return hasIdentity && hasAvailability && isCredentialed;
    });
  }, [drivers]);

  const bookingIsland = selectedBooking?.island ?? null;
  const bookingIsPaid = selectedBooking?.paymentStatus === "paid";

  const availableDrivers = useMemo(() => {
    return normalizedDrivers.filter((driver) => {
      const isCurrentAssigned = driver.id === selectedBooking?.driverId;
      const isAvailable =
        driver.availability === "available" || isCurrentAssigned;

      if (!isAvailable) return false;
      if (!bookingIsland) return true;

      const driverIslands = (driver.islands || []).map((value) =>
        value.toLowerCase()
      );
      return driverIslands.includes(bookingIsland) || isCurrentAssigned;
    });
  }, [normalizedDrivers, selectedBooking?.driverId, bookingIsland]);

  async function assignDriver() {
    if (!selectedBooking || !selectedDriverId || !bookingIsPaid) return;

    try {
      setWorking(`${selectedBooking.id}:assign`);
      const res = await fetch(`/api/bookings/${selectedBooking.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to assign driver.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Assign failed.");
    } finally {
      setWorking(null);
    }
  }

  async function moveStatus(bookingId: string, status: StatusKey) {
    if (!selectedBooking || !bookingIsPaid) return;

    try {
      setWorking(`${bookingId}:${status}`);
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          actorType: "admin",
          actorId: "dispatch-admin",
          message: dispatchMessage(status),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <AdminShell
      eyebrow="Dispatch OS"
      title="Territory operations"
      description="Live regulated taxi requests, payment gating, compliant assignment, and territory movement."
      actions={
        <>
          <DateRangeFilter value={range} onChange={setRange} />
          <Link
            href="/admin/payouts"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#043331] transition hover:border-slate-300 hover:bg-slate-50"
          >
            Open payouts
          </Link>
          <Link
            href="/admin/taxi-operations"
            className="rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:brightness-105 disabled:opacity-60"
          >
            Taxi operations
          </Link>
        </>
      }
    >
      <div className="space-y-8">
        {errorMessage ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <OpsMetric label="Open" value={String(metrics.open)} />
          <OpsMetric label="Active" value={String(metrics.active)} />
          <OpsMetric
            label="Completed"
            value={String(metrics.completed)}
            tone="success"
          />
          <OpsMetric label="Paid" value={String(metrics.paid)} tone="success" />
          <OpsMetric
            label="Unpaid"
            value={String(metrics.unpaid)}
            tone="warning"
          />
          <OpsMetric
            label="Avg Fare"
            value={`$${metrics.avgFare.toFixed(2)}`}
            footnote={`Recorded service fees $${metrics.platform.toFixed(2)}`}
          />
        </div>

        {quietStatuses.length ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Quiet lanes</span>
            {quietStatuses.map((status) => <OpsPill key={status} label={`${prettyStatus(status)} · 0`} />)}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.24fr_0.76fr]">
          <div className="space-y-5">
            {visibleStatusOrder.map((status) => (
              <OpsSection
                key={status}
                eyebrow="Lane"
                title={prettyStatus(status)}
                subtitle={laneSubtitle(status)}
                actions={
                  <div className="flex items-center gap-2">
                    <OpsPill label={`${grouped[status].length} trips`} />
                    {status === "requested" ? (
                      <OpsPill
                        label={`${
                          grouped[status].filter((b) => b.paymentStatus === "paid")
                            .length
                        } paid`}
                        tone="emerald"
                      />
                    ) : null}
                  </div>
                }
              >
                <div className="space-y-4">
                  {grouped[status].length ? (
                    grouped[status].map((booking) => {
                      const active = selectedBookingId === booking.id;
                      const bookingAmount =
                        booking.status === "completed"
                          ? booking.finalFare ?? booking.quotedFare?.total ?? 0
                          : booking.quotedFare?.total ?? 0;

                      return (
                        <OpsCard
                          key={booking.id}
                          active={active}
                          onClick={() => setSelectedBookingId(booking.id)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-lg font-black italic tracking-tight text-[#043331]">
                                {booking.origin?.estateName || "Unknown origin"} →{" "}
                                {booking.destination?.estateName ||
                                  "Unknown destination"}
                              </div>

                              <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                                {booking.mode} · rider {booking.riderId}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <PaymentPill
                                  status={booking.paymentStatus || "unpaid"}
                                />
                                <StatusPill status={booking.status} />
                                <OpsPill
                                  label={(booking.island || "unknown").toUpperCase()}
                                />
                                <OpsPill
                                  label={`${booking.passengers ?? 0} pax`}
                                />
                                <OpsPill label={`${booking.luggage ?? 0} bags`} />
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xl font-black tracking-tight text-[#043331]">
                                ${bookingAmount.toFixed(2)}
                              </div>

                              {booking.payout ? (
                                <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  Service fee $
                                  {(booking.payout.platformRevenue ?? 0).toFixed(2)}
                                </div>
                              ) : (
                                <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  Awaiting payout
                                </div>
                              )}
                            </div>
                          </div>
                        </OpsCard>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                      No trips in this lane.
                    </div>
                  )}
                </div>
              </OpsSection>
            ))}
          </div>

          <div className="space-y-6">
            <OpsSection
              eyebrow="Trip detail"
              title={
                selectedBooking
                  ? `${selectedBooking.origin?.estateName || "Unknown"} → ${
                      selectedBooking.destination?.estateName || "Unknown"
                    }`
                  : "Select a booking"
              }
              actions={
                selectedBooking ? (
                  <>
                    <PaymentPill
                      status={selectedBooking.paymentStatus || "unpaid"}
                    />
                    <StatusPill status={selectedBooking.status} />
                  </>
                ) : null
              }
            >
              {selectedBooking ? (
                <div className="space-y-6">
                  {!bookingIsPaid ? (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">
                        Assignment lock
                      </div>
                      <div className="mt-2 text-sm font-semibold text-amber-800">
                        Dispatch can inspect this ride, but assignment and state
                        changes are locked until payment is complete.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                        Payment cleared
                      </div>
                      <div className="mt-2 text-sm font-semibold text-emerald-800">
                        This ride is eligible for assignment and operational state
                        changes.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <OpsPill label={selectedBooking.mode} />
                    <OpsPill
                      label={(bookingIsland || "unknown").toUpperCase()}
                    />
                    <OpsPill label={`${selectedBooking.passengers ?? 0} pax`} />
                    <OpsPill label={`${selectedBooking.luggage ?? 0} bags`} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <OpsKeyValue
                      label="Rider"
                      value={selectedBooking.riderId || "Unknown"}
                    />
                    <OpsKeyValue
                      label="Driver"
                      value={selectedBooking.driverId || "Unassigned"}
                    />
                    <OpsKeyValue
                      label="Quoted Fare"
                      value={`$${(
                        selectedBooking.quotedFare?.total ?? 0
                      ).toFixed(2)}`}
                    />
                    <OpsKeyValue
                      label="Final Fare"
                      value={`$${(
                        selectedBooking.finalFare ??
                        selectedBooking.quotedFare?.total ??
                        0
                      ).toFixed(2)}`}
                    />
                    <OpsKeyValue
                      label="Payment"
                      value={(selectedBooking.paymentStatus || "unpaid").toUpperCase()}
                    />
                    <OpsKeyValue
                      label="Intent"
                      value={selectedBooking.paymentIntentId || "—"}
                    />
                    <OpsKeyValue
                      label="Recorded Service Fee"
                      value={`$${(
                        selectedBooking.payout?.platformRevenue ?? 0
                      ).toFixed(2)}`}
                    />
                    <OpsKeyValue
                      label="Driver Payout"
                      value={`$${(
                        selectedBooking.payout?.driverPayout ?? 0
                      ).toFixed(2)}`}
                    />
                  </div>

                  <OpsPanel
                    title="Driver assignment"
                    right={
                      !bookingIsPaid ? (
                        <OpsPill label="Locked" tone="amber" />
                      ) : (
                        <OpsPill label="Ready" tone="emerald" />
                      )
                    }
                  >
                    <div className="space-y-3">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition focus:border-[#0f766e]"
                      >
                        <option value="">Select driver</option>
                        {availableDrivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {`${driver.displayName || driver.idHint || "Unnamed Driver"} · ${
                              driver.availability || "unknown"
                            } · score ${driver.reliabilityScore ?? 0}`}
                          </option>
                        ))}
                      </select>

                      <div className="text-xs font-semibold text-slate-500">
                        {bookingIsland
                          ? `Showing drivers eligible for ${bookingIsland.toUpperCase()}.`
                          : "Showing all available drivers because island is missing on this booking."}
                      </div>

                      <button
                        onClick={assignDriver}
                        disabled={
                          !selectedDriverId ||
                          !bookingIsPaid ||
                          !["requested", "matched"].includes(
                            selectedBooking.status
                          ) ||
                          working === `${selectedBooking.id}:assign`
                        }
                        className="rounded-full bg-[#043331] px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:brightness-105 disabled:opacity-60"
                      >
                        {working === `${selectedBooking.id}:assign`
                          ? "Assigning..."
                          : selectedBooking.driverId
                          ? "Reassign driver"
                          : "Assign driver"}
                      </button>
                    </div>
                  </OpsPanel>

                  {selectedBooking.notes ? (
                    <OpsPanel title="Notes">
                      <div className="text-sm font-semibold leading-6 text-slate-700">
                        {selectedBooking.notes}
                      </div>
                    </OpsPanel>
                  ) : null}

                  <OpsPanel title="Operational actions">
                    <div className="flex flex-wrap gap-2">
                      {actionStatusesFor(selectedBooking.status).length ? (
                        actionStatusesFor(selectedBooking.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => moveStatus(selectedBooking.id, status)}
                            disabled={
                              !bookingIsPaid ||
                              working === `${selectedBooking.id}:${status}`
                            }
                            className={`rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition disabled:opacity-60 ${
                              status === "cancelled"
                                ? "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                : status === "completed"
                                ? "bg-amber-400 text-[#78350f] hover:brightness-95"
                                : "bg-[#043331] text-white hover:brightness-105"
                            }`}
                          >
                            {working === `${selectedBooking.id}:${status}`
                              ? "Updating..."
                              : buttonLabel(status)}
                          </button>
                        ))
                      ) : (
                        <div className="text-sm font-semibold text-slate-500">
                          No further actions are available for this trip.
                        </div>
                      )}
                    </div>
                  </OpsPanel>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  Select a booking to inspect and manage it.
                </div>
              )}
            </OpsSection>

            {selectedBooking ? (
              <OpsSection eyebrow="Timeline" title="Trip activity">
                <BookingTimeline bookingId={selectedBooking.id} />
              </OpsSection>
            ) : null}

            <OpsSection
              eyebrow="Driver pool"
              title="Eligible operators"
              actions={<OpsPill label={`${normalizedDrivers.length} drivers`} />}
            >
              <div className="space-y-3">
                {normalizedDrivers.length ? (
                  normalizedDrivers.map((driver) => (
                    <OpsCard key={driver.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-[#043331]">
                            {driver.displayName || driver.idHint || driver.id}
                          </div>
                          <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {(driver.availability || "unknown").toUpperCase()} ·{" "}
                            {(
                              (driver.islands || []).join(", ") || "no islands"
                            ).toUpperCase()}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <OpsPill
                            label={`Score ${driver.reliabilityScore ?? 0}`}
                          />
                          {driver.availability === "available" ? (
                            <OpsPill label="Available" tone="emerald" />
                          ) : driver.availability === "busy" ? (
                            <OpsPill label="Busy" tone="amber" />
                          ) : (
                            <OpsPill label="Offline" tone="neutral" />
                          )}
                        </div>
                      </div>
                    </OpsCard>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    No dispatch-eligible operators. Onboard and verify an association driver and fleet vehicle.
                  </div>
                )}
              </div>
            </OpsSection>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function sortBookings(bookings: DispatchBooking[]) {
  return [...bookings].sort(
    (a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt)
  );
}

function normalizeStatus(status: string): StatusKey {
  return STATUS_ORDER.includes(status as StatusKey)
    ? (status as StatusKey)
    : "requested";
}

function prettyStatus(status: string) {
  switch (status) {
    case "driver_en_route":
      return "Driver En Route";
    case "in_progress":
      return "In Progress";
    default:
      return status.replaceAll("_", " ");
  }
}

function laneSubtitle(status: StatusKey) {
  switch (status) {
    case "requested":
      return "Fresh incoming ride demand waiting for payment clearance and assignment.";
    case "matched":
      return "Trips assigned to a driver and ready to move into pickup execution.";
    case "driver_en_route":
      return "Drivers are actively heading toward pickup.";
    case "arrived":
      return "Drivers have arrived and are waiting for rider boarding.";
    case "in_progress":
      return "Trips currently underway across the territory.";
    case "completed":
      return "Closed trips with final operational and payout outcomes.";
    case "cancelled":
      return "Trips removed from the active movement pipeline.";
    default:
      return "";
  }
}

function actionStatusesFor(status: string): StatusKey[] {
  switch (status) {
    case "requested":
      return ["cancelled"];
    case "matched":
      return ["driver_en_route", "cancelled"];
    case "driver_en_route":
      return ["arrived", "cancelled"];
    case "arrived":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}

function buttonLabel(status: StatusKey) {
  switch (status) {
    case "driver_en_route":
      return "Mark en route";
    case "arrived":
      return "Mark arrived";
    case "in_progress":
      return "Start trip";
    case "completed":
      return "Complete trip";
    case "cancelled":
      return "Cancel trip";
    default:
      return status;
  }
}

function dispatchMessage(status: StatusKey) {
  switch (status) {
    case "driver_en_route":
      return "Dispatch marked driver en route.";
    case "arrived":
      return "Dispatch marked driver arrived.";
    case "in_progress":
      return "Dispatch marked trip in progress.";
    case "completed":
      return "Dispatch marked trip completed.";
    case "cancelled":
      return "Dispatch cancelled the trip.";
    default:
      return `Dispatch updated trip to ${status}.`;
  }
}

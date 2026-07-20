"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { AdminShell } from "@/components/admin-shell";
import {
  DateRangeFilter,
  type DateRangeKey,
} from "@/components/date-range-filter";
import { isInDateRange } from "@/lib/date-range";
import { db } from "@/lib/firebase";

type LedgerBooking = {
  id: string;
  status: string;
  mode: string;
  island?: "stt" | "stj" | "stx";
  riderId: string;
  driverId?: string;
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

function exportLedgerCsv(rows: LedgerBooking[]) {
  const headers = [
    "booking_id",
    "created_at",
    "route",
    "island",
    "driver_id",
    "mode",
    "gross_fare",
    "platform_revenue",
    "driver_payout",
    "commission_rate",
  ];

  const csvRows = rows.map((booking) => [
    booking.id,
    toIsoString(booking.createdAt),
    `${booking.origin?.estateName || ""} -> ${
      booking.destination?.estateName || ""
    }`,
    (booking.island || "unknown").toUpperCase(),
    booking.driverId || "",
    booking.mode,
    (booking.payout?.grossFare ?? 0).toFixed(2),
    (booking.payout?.platformRevenue ?? 0).toFixed(2),
    (booking.payout?.driverPayout ?? 0).toFixed(2),
    `${((booking.payout?.commissionRate ?? 0) * 100).toFixed(0)}%`,
  ]);

  const csv = [headers, ...csvRows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "payout-ledger.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toIsoString(value: LedgerBooking["createdAt"]) {
  const time = getTimeValue(value);
  return time ? new Date(time).toISOString() : "";
}

export function PayoutLedger() {
  const [range, setRange] = useState<DateRangeKey>("all");
  const [bookings, setBookings] = useState<LedgerBooking[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "bookings")),
      (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as LedgerBooking[];

        setBookings(rows);
        setErrorMessage(null);
      },
      (error) => {
        console.error("payout ledger listener error", error);
        setErrorMessage(error.message);
      }
    );
  }, []);

  const completedTrips = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.status === "completed" &&
            booking.payout &&
            isInDateRange(booking.createdAt, range)
        )
        .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt)),
    [bookings, range]
  );

  const metrics = useMemo(() => {
    const gross = completedTrips.reduce(
      (sum, booking) => sum + (booking.payout?.grossFare ?? 0),
      0
    );
    const platform = completedTrips.reduce(
      (sum, booking) => sum + (booking.payout?.platformRevenue ?? 0),
      0
    );
    const driver = completedTrips.reduce(
      (sum, booking) => sum + (booking.payout?.driverPayout ?? 0),
      0
    );

    const byIsland = completedTrips.reduce<Record<string, number>>(
      (acc, booking) => {
        const key = (booking.island || "unknown").toUpperCase();
        acc[key] = (acc[key] || 0) + (booking.payout?.grossFare ?? 0);
        return acc;
      },
      {}
    );

    return {
      trips: completedTrips.length,
      gross,
      platform,
      driver,
      byIsland,
    };
  }, [completedTrips]);

  return (
    <AdminShell
      eyebrow="Payout Ledger"
      title="Revenue and payouts"
      description="Completed trip financials across the territory, including gross fare, platform revenue, and driver payouts."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter value={range} onChange={setRange} />

          <button
            onClick={() => exportLedgerCsv(completedTrips)}
            disabled={!completedTrips.length}
            className="rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Completed Trips" value={String(metrics.trips)} />
            <MetricCard
              label="Gross Fare"
              value={`$${metrics.gross.toFixed(2)}`}
            />
            <MetricCard
              label="Platform Revenue"
              value={`$${metrics.platform.toFixed(2)}`}
            />
            <MetricCard
              label="Driver Payouts"
              value={`$${metrics.driver.toFixed(2)}`}
            />
            <MetricCard
              label="Island Mix"
              value={
                Object.entries(metrics.byIsland)
                  .map(([key, value]) => `${key}:$${value.toFixed(0)}`)
                  .join(" · ") || "—"
              }
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-500">
              Completed Trip Ledger
            </div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              {completedTrips.length} records
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4">Route</th>
                  <th className="px-4">Island</th>
                  <th className="px-4">Driver</th>
                  <th className="px-4">Date</th>
                  <th className="px-4">Gross</th>
                  <th className="px-4">Platform</th>
                  <th className="px-4">Driver Payout</th>
                  <th className="px-4">Rate</th>
                </tr>
              </thead>
              <tbody>
                {completedTrips.length ? (
                  completedTrips.map((booking) => (
                    <tr key={booking.id} className="rounded-2xl bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="text-sm font-black text-[#043331]">
                          {booking.origin?.estateName} →{" "}
                          {booking.destination?.estateName}
                        </div>
                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {booking.mode}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {(booking.island || "unknown").toUpperCase()}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-[#043331]">
                        ${(booking.payout?.grossFare ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-amber-700">
                        ${(booking.payout?.platformRevenue ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-teal-700">
                        ${(booking.payout?.driverPayout ?? 0).toFixed(2)}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 text-sm font-semibold text-slate-700">
                        {((booking.payout?.commissionRate ?? 0) * 100).toFixed(
                          0
                        )}
                        %
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500"
                    >
                      No completed payout records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-[#043331]">
        {value}
      </div>
    </div>
  );
}

function getTimeValue(value: LedgerBooking["createdAt"]) {
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

function formatDate(value: LedgerBooking["createdAt"]) {
  const time = getTimeValue(value);
  if (!time) return "—";

  return new Date(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Plane, RadioTower, ShipWheel, ShieldCheck } from "lucide-react";

import { db } from "@/lib/firebase";
import { STT_DISPATCH_HUBS, type SttDispatchHub } from "@/lib/stt-dispatch-hubs";

type HubBooking = {
  id: string;
  island?: string;
  status?: string;
  paymentStatus?: string;
  passengers?: number;
  scheduledAt?: string | null;
  connectionDeadline?: string | null;
  connectionKind?: string | null;
  origin?: {
    estateGeoid?: string;
    estateName?: string;
  };
};

const ACTIVE_STATUSES = new Set([
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
]);

export function DispatchHubRadar() {
  const [bookings, setBookings] = useState<HubBooking[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "bookings")),
      (snapshot) => {
        setBookings(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as HubBooking[],
        );
        setErrorMessage(null);
      },
      (error) => {
        console.error("dispatch hub radar listener error", error);
        setErrorMessage(error.message);
      },
    );
  }, []);

  const hubRows = useMemo(
    () =>
      STT_DISPATCH_HUBS.map((hub) => {
        const matching = bookings.filter(
          (booking) =>
            booking.island === "stt" &&
            ACTIVE_STATUSES.has(booking.status ?? "") &&
            booking.origin?.estateGeoid === hub.id,
        );
        const requested = matching.filter(
          (booking) => booking.status === "requested",
        );
        const paidWaiting = requested.filter(
          (booking) => booking.paymentStatus === "paid",
        );
        const active = matching.filter(
          (booking) => booking.status !== "requested",
        );
        const passengers = matching.reduce(
          (sum, booking) => sum + Math.max(0, Number(booking.passengers ?? 0)),
          0,
        );
        const connectionCritical = matching.filter((booking) => {
          if (!booking.connectionDeadline) return false;
          const deadline = Date.parse(booking.connectionDeadline);
          if (!Number.isFinite(deadline)) return false;
          const remaining = deadline - Date.now();
          return remaining > 0 && remaining <= 90 * 60 * 1000;
        }).length;

        return {
          hub,
          requested: requested.length,
          paidWaiting: paidWaiting.length,
          active: active.length,
          passengers,
          connectionCritical,
        };
      }),
    [bookings],
  );

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-teal-900/10 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-[#043331] px-5 py-5 text-white sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
            <RadioTower className="h-4 w-4" /> STT stand radar
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
            Verified terminal demand, without fake queue order.
          </h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-white/65 sm:text-sm">
            These cards use the exact canonical pickup hub ID stored on the booking. They do not infer a stand from proximity or estate text.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-white/80">
          <ShieldCheck className="h-4 w-4 text-emerald-300" /> Fare authority unchanged
        </span>
      </header>

      {errorMessage ? (
        <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          Stand radar unavailable: {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        {hubRows.map((row) => (
          <HubCard key={row.hub.id} {...row} />
        ))}
      </div>

      <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-xs font-semibold leading-5 text-amber-950 sm:px-6">
        <strong>Queue boundary:</strong> USVI Explorer can show paid demand and trip urgency, but current physical queue position must be confirmed by the association or stand operator until an approved queue feed is connected. Stand intelligence is not a fare input and cannot change the official USVI taxi tariff.
      </div>
    </section>
  );
}

function HubCard({
  hub,
  requested,
  paidWaiting,
  active,
  passengers,
  connectionCritical,
}: {
  hub: SttDispatchHub;
  requested: number;
  paidWaiting: number;
  active: number;
  passengers: number;
  connectionCritical: number;
}) {
  const Icon = hub.kind === "airport" ? Plane : ShipWheel;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-800">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
              {hub.kind === "airport" ? "Airport stand" : "Ferry terminal stand"}
            </div>
            <h3 className="mt-1 text-lg font-black tracking-[-.03em]">
              {hub.label}
            </h3>
          </div>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-sky-900">
          Operator-confirmed queue
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric label="Waiting" value={requested} />
        <Metric label="Paid" value={paidWaiting} />
        <Metric label="Active" value={active} />
        <Metric label="Pax" value={passengers} />
        <Metric label="≤90 min" value={connectionCritical} />
      </div>

      <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
        {hub.dispatchNote}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.11em]">
        <span className="rounded-full bg-white px-3 py-2 text-slate-600 shadow-sm">
          Queue: physical stand
        </span>
        <span className="rounded-full bg-white px-3 py-2 text-slate-600 shadow-sm">
          Pricing effect: none
        </span>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
      <div className="text-xl font-black tracking-[-.04em] text-[#043331]">{value}</div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

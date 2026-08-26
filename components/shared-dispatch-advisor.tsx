"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { BusFront, Luggage, ShieldCheck, UsersRound } from "lucide-react";

import { db } from "@/lib/firebase";
import {
  buildSttSharedDispatchGroups,
  type SharedDispatchBooking,
  type SharedDispatchDriver,
  type SharedDispatchVehicle,
} from "@/lib/shared-dispatch-grouping";

export function SharedDispatchAdvisor() {
  const [bookings, setBookings] = useState<SharedDispatchBooking[]>([]);
  const [drivers, setDrivers] = useState<SharedDispatchDriver[]>([]);
  const [vehicles, setVehicles] = useState<SharedDispatchVehicle[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeBookings = onSnapshot(
      query(collection(db, "bookings")),
      (snapshot) => {
        setBookings(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as SharedDispatchBooking[],
        );
        setErrorMessage(null);
      },
      (error) => {
        console.error("shared dispatch bookings listener error", error);
        setErrorMessage(error.message);
      },
    );

    const unsubscribeDrivers = onSnapshot(
      query(collection(db, "drivers")),
      (snapshot) => {
        setDrivers(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as SharedDispatchDriver[],
        );
      },
      (error) => {
        console.error("shared dispatch drivers listener error", error);
        setErrorMessage(error.message);
      },
    );

    const unsubscribeVehicles = onSnapshot(
      query(collection(db, "vehicles")),
      (snapshot) => {
        setVehicles(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as SharedDispatchVehicle[],
        );
      },
      (error) => {
        console.error("shared dispatch vehicles listener error", error);
        setErrorMessage(error.message);
      },
    );

    return () => {
      unsubscribeBookings();
      unsubscribeDrivers();
      unsubscribeVehicles();
    };
  }, []);

  const groups = useMemo(
    () => buildSttSharedDispatchGroups({ bookings, drivers, vehicles }),
    [bookings, drivers, vehicles],
  );

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-teal-900/10 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
            <BusFront className="h-4 w-4" /> Shared Safari / van planner
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331]">
            Combine compatible paid parties without combining their fares.
          </h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
            Suggestions require the same reviewed STT pickup stand, the same governed destination, verified payment, and a shared-service policy. Every rider keeps their own official tariff quote and payment.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-emerald-900">
          <ShieldCheck className="h-4 w-4" /> Advisory only
        </span>
      </header>

      {errorMessage ? (
        <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          Shared dispatch advisor unavailable: {errorMessage}
        </div>
      ) : null}

      <div className="space-y-4 p-4 sm:p-5">
        {groups.length ? (
          groups.map((group) => {
            const bestFit = group.fleetFits[0] ?? null;
            return (
              <article
                key={group.key}
                className="rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                      Exact-route shared candidate
                    </div>
                    <h3 className="mt-1 text-lg font-black tracking-[-.03em] text-[#043331]">
                      {group.originName} → {group.destinationName}
                    </h3>
                    {group.earliestConnectionDeadline ? (
                      <p className="mt-1 text-xs font-bold text-amber-800">
                        Earliest connection: {formatSttTime(group.earliestConnectionDeadline)}
                      </p>
                    ) : null}
                  </div>
                  <span className="w-fit rounded-full bg-sky-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-sky-900">
                    Queue confirmation required
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric icon={UsersRound} label="Paid parties" value={group.partyCount} />
                  <Metric icon={UsersRound} label="Passengers" value={group.passengers} />
                  <Metric icon={Luggage} label="Bags" value={group.luggage} />
                  <Metric icon={BusFront} label="Fleet fits" value={group.fleetFits.length} />
                </div>

                <div
                  className={`mt-4 rounded-2xl border p-4 text-xs font-semibold leading-5 ${
                    bestFit
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  {bestFit ? (
                    <>
                      <strong>Best available fit:</strong>{" "}
                      {bestFit.vehicleType === "safari" ? "Safari" : "Van"} · {bestFit.capacity} seats · {bestFit.spareSeats} spare · {bestFit.luggageCapacity} bag capacity.
                    </>
                  ) : (
                    <>
                      <strong>No current combined fit.</strong> No available certified van/Safari in the live fleet can carry this combined passenger and luggage load. Keep the parties separate or wait for an operator-confirmed vehicle.
                    </>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            No multi-party compatible groups right now. Individual paid requests remain available to the normal dispatch board.
          </div>
        )}
      </div>

      <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-xs font-semibold leading-5 text-amber-950 sm:px-6">
        <strong>Dispatch boundary:</strong> This is advisory only. The association/stand operator confirms physical queue order, passenger sequence, and final vehicle choice. The assignment server reruns payment, credentials, association, inspection, insurance, medallion, island, passenger-capacity, and luggage-capacity checks. Each rider’s official tariff quote and payment remain separate; this advisor does not recompute or combine fares.
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-[#043331]">
        <Icon className="h-4 w-4 text-teal-700" />
        <span className="text-xl font-black tracking-[-.04em]">{value}</span>
      </div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function formatSttTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

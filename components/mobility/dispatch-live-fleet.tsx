"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { ExternalLink, LocateFixed, Radio, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";
import type { RideBooking } from "@/types/mobility";

type LiveBooking = RideBooking & {
  driverLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    recordedAt?: string;
    driverId?: string;
  };
};

const ACTIVE = ["matched", "driver_en_route", "arrived", "in_progress"];

export function DispatchLiveFleet() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        setBookings(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
          })) as LiveBooking[],
        );
        setError(null);
      },
      (listenerError) => setError(listenerError.message),
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const active = useMemo(
    () => bookings.filter((booking) => ACTIVE.includes(booking.status)),
    [bookings],
  );
  const located = active.filter((booking) => booking.driverLocation);
  const fresh = located.filter(
    (booking) => locationAgeMs(booking.driverLocation?.recordedAt, now) < 60_000,
  );

  return (
    <section className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              <Radio className="h-4 w-4" /> Live fleet intelligence
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
              Active driver positions
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/65">
              Dispatch can verify which assigned drivers are publishing fresh locations and open any active position immediately.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Active" value={active.length} />
            <Metric label="Located" value={located.length} />
            <Metric label="Fresh" value={fresh.length} />
          </div>
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
        {active.length ? (
          active.map((booking) => {
            const location = booking.driverLocation;
            const age = locationAgeMs(location?.recordedAt, now);
            const freshLocation = Boolean(location && age < 60_000);
            return (
              <article
                key={booking.id}
                className="rounded-[26px] border border-slate-200 bg-[#fbfaf6] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
                      {booking.status.replaceAll("_", " ")}
                    </div>
                    <div className="mt-2 text-xl font-black tracking-[-.03em] text-[#043331]">
                      {booking.origin?.estateName || "Pickup"} → {booking.destination?.estateName || "Destination"}
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-500">
                      Driver {booking.driverId || "unassigned"}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] ${
                      freshLocation
                        ? "bg-emerald-100 text-emerald-800"
                        : location
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {freshLocation ? "Live" : location ? "Stale" : "Waiting"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SmallMetric label="Accuracy" value={location?.accuracy ? `${Math.round(location.accuracy)} m` : "—"} />
                  <SmallMetric label="Updated" value={location ? formatAge(age) : "—"} />
                  <SmallMetric label="Vehicle" value={booking.vehicleId || "—"} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {location ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-4 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white"
                    >
                      <LocateFixed className="h-4 w-4" /> Open position
                    </a>
                  ) : null}
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
                    <ShieldCheck className="h-4 w-4" /> Assigned ride
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-[26px] border border-dashed border-slate-300 p-10 text-center">
            <ExternalLink className="mx-auto h-7 w-7 text-slate-300" />
            <div className="mt-3 font-black text-[#043331]">No active fleet movement</div>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Assigned rides will appear here when drivers begin publishing locations.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/45">{label}</div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[#043331]">{value}</div>
    </div>
  );
}

function locationAgeMs(recordedAt: string | undefined, now: number) {
  if (!recordedAt) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(recordedAt).getTime();
  return Number.isFinite(timestamp) ? Math.max(0, now - timestamp) : Number.POSITIVE_INFINITY;
}

function formatAge(age: number) {
  if (!Number.isFinite(age)) return "Unknown";
  const seconds = Math.floor(age / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

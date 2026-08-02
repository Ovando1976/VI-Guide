"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { LocateFixed, Loader2, MapPin, Radio } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { db } from "@/lib/firebase";

type ActiveRide = {
  id: string;
  status?: string;
  origin?: { estateName?: string };
  destination?: { estateName?: string };
};

const TRACKABLE_STATUSES = [
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export function DriverLocationPublisher({ driverId }: { driverId: string }) {
  const [rides, setRides] = useState<ActiveRide[]>([]);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("Location sharing is off.");
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPostedRef = useRef(0);

  useEffect(() => {
    const activeQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", driverId),
    );
    return onSnapshot(
      activeQuery,
      (snapshot) => {
        const rows = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as ActiveRide)
          .filter((ride) => TRACKABLE_STATUSES.includes(ride.status ?? ""));
        setRides(rows);
      },
      (error) => setMessage(error.message),
    );
  }, [driverId]);

  const activeRide = useMemo(() => rides[0] ?? null, [rides]);

  useEffect(() => {
    if (!activeRide && sharing) stopSharing();
  }, [activeRide, sharing]);

  useEffect(() => () => stopSharing(), []);

  function stopSharing() {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setSharing(false);
    setMessage("Location sharing is off.");
  }

  function startSharing() {
    if (!activeRide) {
      setMessage("Accept a paid ride before starting live tracking.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setMessage("Location services are not available on this device.");
      return;
    }

    setSharing(true);
    setMessage("Requesting precise location access…");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => void publishPosition(activeRide.id, position),
      (error) => {
        setMessage(error.message || "Location access failed.");
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 8_000,
        timeout: 15_000,
      },
    );
  }

  async function publishPosition(
    bookingId: string,
    position: GeolocationPosition,
  ) {
    const now = Date.now();
    if (now - lastPostedRef.current < 10_000) return;
    lastPostedRef.current = now;

    try {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(bookingId)}/location`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to publish location.");
      }
      const timestamp = new Date().toISOString();
      setLastSentAt(timestamp);
      setMessage("Live location is being shared with the rider and dispatch.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to publish location.",
      );
    }
  }

  const route = activeRide
    ? `${activeRide.origin?.estateName || "Pickup"} → ${
        activeRide.destination?.estateName || "Destination"
      }`
    : "No active ride";

  return (
    <section className="mb-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
            <Radio className="h-4 w-4" /> Live tracking
          </div>
          <h2 className="mt-2 text-xl font-black tracking-[-.03em] text-[#043331]">
            {route}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {message}
          </p>
          {lastSentAt ? (
            <p className="mt-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">
              Last update {new Date(lastSentAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={sharing ? stopSharing : startSharing}
          disabled={!activeRide}
          className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[10px] font-black uppercase tracking-[.16em] text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
            sharing ? "bg-rose-600" : "bg-[#043331]"
          }`}
        >
          {sharing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Stop sharing
            </>
          ) : (
            <>
              {activeRide ? (
                <LocateFixed className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              Start live tracking
            </>
          )}
        </button>
      </div>
    </section>
  );
}

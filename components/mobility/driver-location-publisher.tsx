"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { LocateFixed, Loader2, MapPin, Radio } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
const MIN_PUBLISH_INTERVAL_MS = 10_000;
const FRESH_FIX_HEARTBEAT_MS = 45_000;

export function DriverLocationPublisher({ driverId }: { driverId: string }) {
  const [rides, setRides] = useState<ActiveRide[]>([]);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("Location sharing is off.");
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const heartbeatIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAttemptRef = useRef(0);
  const sharingRef = useRef(false);
  const activeBookingIdRef = useRef<string | null>(null);

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

  const clearTrackingResources = useCallback(() => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    if (heartbeatIdRef.current !== null) {
      clearInterval(heartbeatIdRef.current);
    }
    heartbeatIdRef.current = null;
  }, []);

  const stopSharing = useCallback(() => {
    sharingRef.current = false;
    activeBookingIdRef.current = null;
    clearTrackingResources();
    setSharing(false);
    setMessage("Location sharing is off.");
  }, [clearTrackingResources]);

  const publishPosition = useCallback(
    async (bookingId: string, position: GeolocationPosition) => {
      if (!sharingRef.current || activeBookingIdRef.current !== bookingId) return;

      const now = Date.now();
      if (now - lastAttemptRef.current < MIN_PUBLISH_INTERVAL_MS) return;
      lastAttemptRef.current = now;

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
              observedAt: new Date(position.timestamp).toISOString(),
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
          error instanceof Error
            ? `${error.message} Tracking will retry while this page stays open.`
            : "Unable to publish location. Tracking will retry while this page stays open.",
        );
      }
    },
    [],
  );

  const handleLocationError = useCallback(
    (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        sharingRef.current = false;
        activeBookingIdRef.current = null;
        clearTrackingResources();
        setSharing(false);
        setMessage(
          "Precise location permission is blocked. Allow location access in your browser settings, then start live tracking again.",
        );
        return;
      }

      const detail =
        error.code === error.TIMEOUT
          ? "A fresh GPS fix timed out."
          : "The device could not determine a fresh GPS position.";
      setMessage(`${detail} Live tracking is still on and will retry automatically.`);
    },
    [clearTrackingResources],
  );

  const requestFreshPosition = useCallback(
    (bookingId: string) => {
      if (
        !sharingRef.current ||
        activeBookingIdRef.current !== bookingId ||
        !("geolocation" in navigator)
      ) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => void publishPosition(bookingId, position),
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15_000,
        },
      );
    },
    [handleLocationError, publishPosition],
  );

  const startSharing = useCallback(() => {
    if (!activeRide) {
      setMessage("Accept a paid ride before starting live tracking.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setMessage("Location services are not available on this device.");
      return;
    }

    clearTrackingResources();
    lastAttemptRef.current = 0;
    sharingRef.current = true;
    activeBookingIdRef.current = activeRide.id;
    setSharing(true);
    setMessage("Requesting precise location access…");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => void publishPosition(activeRide.id, position),
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 8_000,
        timeout: 15_000,
      },
    );

    heartbeatIdRef.current = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false
      ) {
        requestFreshPosition(activeRide.id);
      }
    }, FRESH_FIX_HEARTBEAT_MS);
  }, [
    activeRide,
    clearTrackingResources,
    handleLocationError,
    publishPosition,
    requestFreshPosition,
  ]);

  useEffect(() => {
    if (!sharing) return;
    if (!activeRide || activeBookingIdRef.current !== activeRide.id) {
      stopSharing();
    }
  }, [activeRide, sharing, stopSharing]);

  useEffect(() => {
    if (!sharing || !activeRide) return;

    const refreshIfUsable = () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false
      ) {
        requestFreshPosition(activeRide.id);
      }
    };
    const handleVisibility = () => refreshIfUsable();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", refreshIfUsable);
    window.addEventListener("online", refreshIfUsable);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", refreshIfUsable);
      window.removeEventListener("online", refreshIfUsable);
    };
  }, [activeRide, requestFreshPosition, sharing]);

  useEffect(
    () => () => {
      sharingRef.current = false;
      activeBookingIdRef.current = null;
      clearTrackingResources();
    },
    [clearTrackingResources],
  );

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

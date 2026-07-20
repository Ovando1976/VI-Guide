"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BookingPanel } from "@/components/booking-panel";
import type { RideMode } from "@/types/mobility";
import type { EstateRecord, IslandCode } from "@/types/usvi";

const RIDE_MODES: RideMode[] = [
  "standard",
  "premium",
  "shared",
  "safari",
  "airport",
  "ferry-transfer",
  "tour",
  "delivery",
  "executive",
];

function isRideMode(value: string | null): value is RideMode {
  return Boolean(value && RIDE_MODES.includes(value as RideMode));
}

function isIslandCode(value: string | null): value is IslandCode {
  return value === "stt" || value === "stj" || value === "stx";
}

function numberInRange(value: string | null, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
}

export function MobilityBookingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estates, setEstates] = useState<EstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [fromGeoid, setFromGeoid] = useState(
    () => searchParams.get("from") ?? "",
  );
  const [toGeoid, setToGeoid] = useState(
    () => searchParams.get("to") ?? "",
  );
  const [mode, setMode] = useState<RideMode>(() => {
    const requested = searchParams.get("mode");
    return isRideMode(requested) ? requested : "standard";
  });
  const [passengers, setPassengers] = useState(() =>
    numberInRange(searchParams.get("passengers"), 1, 12),
  );
  const [luggage, setLuggage] = useState(() =>
    numberInRange(searchParams.get("luggage"), 0, 12),
  );
  const pickupLabel = searchParams.get("pickupLabel")?.trim() || undefined;
  const destinationLabel = searchParams.get("destinationLabel")?.trim() || undefined;

  const [activeIsland, setActiveIsland] = useState<IslandCode>(() => {
    const requested = searchParams.get("island");
    return isIslandCode(requested) ? requested : "stt";
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadEstates() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await fetch("/api/estates", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load estate data.");
        }

        const loaded = Array.isArray(payload?.estates) ? payload.estates : [];
        if (!loaded.length) throw new Error("No estate records were returned.");
        setEstates(loaded);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load estates.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEstates();
    return () => controller.abort();
  }, [reloadNonce]);

  useEffect(() => {
    const requested = searchParams.get("island");
    if (isIslandCode(requested)) return;
    const remembered = window.localStorage.getItem("vi-guide.active-island");
    if (isIslandCode(remembered)) setActiveIsland(remembered);
  }, [searchParams]);

  const availableEstates = useMemo(
    () => estates.filter((estate) => estate.island === activeIsland),
    [activeIsland, estates],
  );

  useEffect(() => {
    if (!estates.length) return;
    const endpoint = estates.find(
      (estate) => estate.geoid === fromGeoid || estate.geoid === toGeoid,
    );
    if (endpoint && endpoint.island !== activeIsland) {
      setActiveIsland(endpoint.island);
    }
  }, [activeIsland, estates, fromGeoid, toGeoid]);

  useEffect(() => {
    if (!estates.length || searchParams.get("from") || searchParams.get("to")) return;
    try {
      const raw = window.localStorage.getItem("vi-guide.trip-draft");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        island?: string;
        from?: string;
        to?: string;
        mode?: string;
        passengers?: number;
        luggage?: number;
      };
      const draftIsland = draft.island ?? null;
      if (!isIslandCode(draftIsland) || draftIsland !== activeIsland) return;
      const islandEstates = estates.filter((estate) => estate.island === activeIsland);
      if (draft.from && islandEstates.some((estate) => estate.geoid === draft.from)) {
        setFromGeoid(draft.from);
      }
      if (draft.to && islandEstates.some((estate) => estate.geoid === draft.to)) {
        setToGeoid(draft.to);
      }
      const draftMode = draft.mode ?? null;
      if (isRideMode(draftMode)) setMode(draftMode);
      if (typeof draft.passengers === "number") {
        setPassengers(Math.max(1, Math.min(12, Math.round(draft.passengers))));
      }
      if (typeof draft.luggage === "number") {
        setLuggage(Math.max(0, Math.min(12, Math.round(draft.luggage))));
      }
    } catch {
      window.localStorage.removeItem("vi-guide.trip-draft");
    }
  }, [activeIsland, estates, searchParams]);

  const fromEstate =
    availableEstates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate =
    availableEstates.find((estate) => estate.geoid === toGeoid) ?? null;

  function selectFrom(geoid: string) {
    setFromGeoid(geoid);
    if (geoid && geoid === toGeoid) setToGeoid("");
  }

  function selectTo(geoid: string) {
    setToGeoid(geoid);
    if (geoid && geoid === fromGeoid) setFromGeoid("");
  }

  function changeIsland(nextIsland: IslandCode) {
    setActiveIsland(nextIsland);
    window.localStorage.setItem("vi-guide.active-island", nextIsland);
    window.localStorage.removeItem("vi-guide.trip-draft");
    setFromGeoid("");
    setToGeoid("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("island", nextIsland);
    params.delete("from");
    params.delete("to");
    router.replace(`/mobility?${params.toString()}`, { scroll: false });
  }

  function swapRoute() {
    setFromGeoid(toGeoid);
    setToGeoid(fromGeoid);
  }

  return (
    <main className="min-h-screen px-4 py-6 text-[#043331] md:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600">
              VI Guide Mobility
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-[-.04em]">
              Confirm your island ride
            </h1>
          </div>
          <Link
            href={`/map?island=${activeIsland}`}
            className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em]"
          >
            Back to map
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Choose island">
          {(["stt", "stj", "stx"] as IslandCode[]).map((island) => (
            <button
              key={island}
              type="button"
              onClick={() => changeIsland(island)}
              aria-pressed={activeIsland === island}
              className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                activeIsland === island
                  ? "border-[#043331] bg-[#043331] text-white"
                  : "border-slate-300 bg-white text-[#043331] hover:border-[#0f766e]"
              }`}
            >
              {island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : "St. Croix"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-[680px] animate-pulse rounded-[36px] bg-white" />
        ) : errorMessage ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-7">
            <h2 className="text-xl font-black text-rose-900">
              Mobility data is unavailable
            </h2>
            <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((value) => value + 1)}
              className="mt-5 rounded-full bg-rose-900 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              Try again
            </button>
          </section>
        ) : (
          <BookingPanel
            estates={availableEstates}
            fromEstate={fromEstate}
            toEstate={toEstate}
            fromGeoid={fromGeoid}
            toGeoid={toGeoid}
            mode={mode}
            passengers={passengers}
            luggage={luggage}
            island={activeIsland}
            onSelectFrom={selectFrom}
            onSelectTo={selectTo}
            onChangeMode={setMode}
            onChangePassengers={(value) =>
              setPassengers(Math.max(1, Math.min(12, value || 1)))
            }
            onChangeLuggage={(value) =>
              setLuggage(Math.max(0, Math.min(12, value || 0)))
            }
            onSwapRoute={swapRoute}
            pickupLabel={pickupLabel}
            destinationLabel={destinationLabel}
          />
        )}
      </div>
    </main>
  );
}

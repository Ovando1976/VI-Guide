"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MapPinned } from "lucide-react";

import { MobilityRouteFields } from "@/components/mobility-route-fields";
import type { EstateRecord, IslandCode } from "@/types/usvi";

function isIslandCode(value: string | null): value is IslandCode {
  return value === "stt" || value === "stj" || value === "stx";
}

export function MobilitySearchGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estates, setEstates] = useState<EstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromGeoid, setFromGeoid] = useState(searchParams.get("from") ?? "");
  const [toGeoid, setToGeoid] = useState(searchParams.get("to") ?? "");
  const island: IslandCode = isIslandCode(searchParams.get("island")) ? searchParams.get("island") as IslandCode : "stt";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/estates", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Unable to load fare areas");
        setEstates(Array.isArray(payload?.estates) ? payload.estates : []);
      })
      .catch(() => setEstates([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const availableEstates = useMemo(
    () => estates.filter((estate) => estate.island === island),
    [estates, island],
  );
  const fromEstate = availableEstates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate = availableEstates.find((estate) => estate.geoid === toGeoid) ?? null;
  const routeReady = Boolean(fromEstate && toEstate && fromGeoid !== toGeoid);

  function selectFrom(geoid: string) {
    setFromGeoid(geoid);
    if (geoid === toGeoid) setToGeoid("");
  }

  function selectTo(geoid: string) {
    setToGeoid(geoid);
    if (geoid === fromGeoid) setFromGeoid("");
  }

  function swapRoute() {
    setFromGeoid(toGeoid);
    setToGeoid(fromGeoid);
  }

  function continueToBooking() {
    if (!routeReady) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("island", island);
    params.set("from", fromGeoid);
    params.set("to", toGeoid);
    router.push(`/mobility?${params.toString()}#book`);
  }

  if (loading) {
    return <div className="mx-auto mt-3 h-28 max-w-7xl animate-pulse rounded-[24px] bg-white/80" aria-hidden="true" />;
  }

  return (
    <section className="mx-auto mt-3 max-w-7xl px-4 md:px-6" aria-label="Find pickup and destination">
      <div className="rounded-[28px] border border-teal-900/10 bg-white/95 p-4 shadow-[0_18px_50px_rgba(4,51,49,.12)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
              <MapPinned className="h-4 w-4" /> Start with a place you know
            </div>
            <h2 className="mt-1 text-xl font-black tracking-[-.035em] text-[#043331] sm:text-2xl">Pickup and destination</h2>
            <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-500">Search an airport, hotel, beach, ferry terminal, town, or harbor. We only continue after both places resolve to official taxi fare areas.</p>
          </div>
          {routeReady ? (
            <button
              type="button"
              onClick={continueToBooking}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.12em] text-[#043331] shadow-sm"
            >
              Use these places <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <MobilityRouteFields
          estates={availableEstates}
          island={island}
          fromGeoid={fromGeoid}
          toGeoid={toGeoid}
          onSelectFrom={selectFrom}
          onSelectTo={selectTo}
          onSwapRoute={swapRoute}
        />

        {routeReady ? (
          <div className="mt-3 rounded-2xl bg-teal-50 px-4 py-3 text-xs font-bold text-teal-900">
            Official fare areas resolved: {fromEstate?.baseName} → {toEstate?.baseName}. Continue to the existing published-fare booking flow.
          </div>
        ) : null}
      </div>
    </section>
  );
}

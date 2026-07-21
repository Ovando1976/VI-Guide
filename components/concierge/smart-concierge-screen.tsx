"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ConciergeDiscovery } from "@/components/concierge/concierge-discovery";
import { ViConcierge } from "@/components/concierge/vi-concierge";
import type { ConciergeContext } from "@/types/concierge";
import type { IslandCode } from "@/types/usvi";

const ISLAND_NAMES: Record<IslandCode, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export function SmartConciergeScreen() {
  const params = useSearchParams();
  const island = normalizeIsland(params.get("island"));
  const prompt = params.get("prompt")?.trim() ?? "";
  const activeLens = params.get("context")?.trim() || "all";

  const context = useMemo<ConciergeContext>(
    () => ({
      island,
      islandName: ISLAND_NAMES[island],
      selectedEstate: null,
      pickup: null,
      destination: null,
      rideMode: "standard",
      passengers: 1,
      luggage: 0,
      activeLens,
      nearbyEstates: [],
    }),
    [activeLens, island],
  );

  return (
    <>
      <ConciergeDiscovery />
      <ViConcierge
        context={context}
        initiallyOpen={Boolean(prompt) || params.get("open") !== "false"}
        onSelectEstate={() => undefined}
        onSetPickup={() => undefined}
        onSetDestination={() => undefined}
      />
    </>
  );
}

function normalizeIsland(value: string | null): IslandCode {
  return value === "stj" || value === "stx" ? value : "stt";
}

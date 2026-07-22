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
  const prompt = params.get("prompt")?.trim().slice(0, 3000) ?? "";
  const activeLens = params.get("context")?.trim() || "all";
  const shouldOpen = Boolean(prompt) || params.get("open") === "true";

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
      <ConciergeDiscovery initialIsland={island} />
      <ViConcierge
        context={context}
        initialPrompt={prompt}
        initiallyOpen={shouldOpen}
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

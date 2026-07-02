import type { IslandCode, ServiceClass, TripType } from "../../types";
import {
  baseZoneFares,
  tariffSettings,
  tariffZones,
  type TariffQuote,
  type TaxiZoneId,
} from "../../data/mobility/tariffRules";

/**
 * Normalizes input strings for fuzzy matching (e.g., "W.I.C.O. Pier" -> "wico pier")
 */
function normalize(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

/**
 * Maps human-readable input to a validated TaxiZoneId.
 * Fallbacks to "general" zones if no match is found.
 */
export function inferTaxiZone(input: {
  island: IslandCode;
  label?: string;
  type?: string;
}): TaxiZoneId {
  const inputString = normalize(`${input.label ?? ""} ${input.type ?? ""}`);

  // 1. Match against Name OR Aliases
  const match = tariffZones.find((zone) => {
    if (zone.island !== input.island) return false;

    const normalizedName = normalize(zone.name);
    
    // Check if input matches name (in either direction) OR matches any alias
    const nameMatch = normalizedName.includes(inputString) || inputString.includes(normalizedName);
    const aliasMatch = zone.aliases.some((alias) => inputString.includes(normalize(alias)));

    return nameMatch || aliasMatch;
  });

  if (match) return match.id;

  // 2. Fallback by Island
  const fallbacks: Record<IslandCode, TaxiZoneId> = {
    st_thomas: "stt_general",
    st_john: "stj_general",
    st_croix: "stx_general",
    water_island: "wat_general",
  };
  
  return fallbacks[input.island] ?? "stt_general";
}


/**
 * Orchestrates the Tariff Calculation based on VITC rules.
 * Designed for auditability: every quote returns notes explaining the logic.
 */
export function calculateTariffQuote(input: {
  island: IslandCode;
  originLabel: string;
  destinationLabel: string;
  originType?: string;
  destinationType?: string;
  tripType: TripType;
  serviceClass: ServiceClass;
  passengers: number;
  luggage: number;
}): TariffQuote {
  const originZone = inferTaxiZone({
    island: input.island,
    label: input.originLabel,
    type: input.originType,
  });

  const destinationZone = inferTaxiZone({
    island: input.island,
    label: input.destinationLabel,
    type: input.destinationType,
  });

  // Calculate Base
  const officialBase = baseZoneFares[originZone]?.[destinationZone] 
                    ?? baseZoneFares[destinationZone]?.[originZone];
  
  const baseFare = officialBase ?? 15; // Default safety floor
  
  // Calculate Variables
  const passengers = Math.max(1, Math.floor(input.passengers));
  const luggage = Math.max(0, Math.floor(input.luggage));
  const passengerFee = (passengers - 1) * tariffSettings.additionalPassengerFee;
  const luggageFee = luggage * tariffSettings.luggageFeePerBag;

  // Apply Multipliers
  // Logic: (Base + Fees) * CruiseMultiplier
  const cruiseMultiplier = input.tripType === "cruise" ? tariffSettings.cruiseDemandMultiplier : 1;
  const subtotal = (baseFare + passengerFee + luggageFee) * cruiseMultiplier;

  // Private Premium Calculation
  const premiumFee = input.serviceClass === "private"
    ? Math.round(subtotal * (tariffSettings.privateServiceMultiplier - 1))
    : 0;

  const total = Math.max(tariffSettings.minimumFare, Math.round(subtotal + premiumFee));

  // Build Audit Log
  const notes: string[] = [];
  if (officialBase) notes.push("Calculated using official VITC corridor rate.");
  else notes.push("Warning: Non-standard route; used general zone rate.");
  
  if (input.tripType === "cruise") notes.push("Cruise demand adjustment applied.");
  if (input.serviceClass === "private") notes.push("Private service premium applied.");

  return {
    currency: "USD",
    island: input.island,
    originZone,
    destinationZone,
    tripType: input.tripType,
    serviceClass: input.serviceClass,
    passengers,
    luggage,
    baseFare,
    passengerFee,
    luggageFee,
    premiumFee,
    total,
    confidence: officialBase ? "official_seed" : "fallback",
    notes,
  };
}

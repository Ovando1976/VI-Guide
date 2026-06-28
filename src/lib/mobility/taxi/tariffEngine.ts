import { findTaxiZoneByName } from "./aliasMatcher";
import { taxiFareRules } from "./taxiFareRules";
import type {
  MobilityIsland,
  TaxiFareRule,
  TaxiQuoteBreakdown,
  TaxiQuoteRequest,
} from "./types";

function clampInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.floor(n));
}

function isLateNight(iso?: string, window?: { start: string; end: string }): boolean {
  if (!iso || !window) return false;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  const minutes = date.getHours() * 60 + date.getMinutes();

  const [startHour, startMinute] = window.start.split(":").map(Number);
  const [endHour, endMinute] = window.end.split(":").map(Number);

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (start <= end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

function getFareRule(
  island: MobilityIsland,
  originZoneId: string,
  destinationZoneId: string,
  serviceClass: "shared" | "private"
): TaxiFareRule | null {
  return (
    taxiFareRules.find((rule) => {
      if (rule.island !== island) return false;

      const direct =
        rule.originZoneId === originZoneId &&
        rule.destinationZoneId === destinationZoneId;

      const reverse =
        rule.originZoneId === destinationZoneId &&
        rule.destinationZoneId === originZoneId;

      const serviceMatches =
        rule.serviceClass === "either" || rule.serviceClass === serviceClass;

      return (direct || reverse) && serviceMatches;
    }) ?? null
  );
}

function fallbackQuote(input: TaxiQuoteRequest): TaxiQuoteBreakdown {
  const passengers = Math.max(1, clampInt(input.passengers, 1));
  const bags = clampInt(input.luggage, 0);
  const baseFare = 20;
  const luggageTotal = bags * 3;

  return {
    pickupZoneId: "unknown",
    dropoffZoneId: "unknown",
    pickupZoneName: input.pickupName || "Unknown pickup",
    dropoffZoneName: input.dropoffName || "Unknown dropoff",
    baseFare,
    luggageTotal,
    lateNightTotal: 0,
    exclusivityTotal: input.serviceClass === "private" ? 15 : 0,
    total: baseFare + luggageTotal + (input.serviceClass === "private" ? 15 : 0),
    currency: "USD",
    reviewStatus: "needs_review",
    source: {
      label: "Fallback estimate",
      sourceType: "manual_admin_entry",
      accessedAt: new Date().toISOString(),
    },
    assumptions: [
      "No reviewed tariff rule matched this route.",
      `${passengers} passenger(s), ${bags} bag(s).`,
    ],
  };
}

export function calculateOfficialTaxiQuote(
  input: TaxiQuoteRequest
): TaxiQuoteBreakdown | null {
  const serviceClass = input.serviceClass ?? "shared";
  const passengers = Math.max(1, clampInt(input.passengers, 1));
  const bags = clampInt(input.luggage, 0);

  const pickupZone = findTaxiZoneByName(input.island, input.pickupName);
  const dropoffZone = findTaxiZoneByName(input.island, input.dropoffName);

  if (!pickupZone || !dropoffZone) return null;

  const rule = getFareRule(input.island, pickupZone.id, dropoffZone.id, serviceClass);

  if (!rule) return null;

  let baseFare = 0;
  let exclusivityTotal = 0;

  if (rule.computationMode === "one_person_vs_two_plus_per_person") {
    baseFare =
      passengers <= 1
        ? rule.onePersonAmount ?? 0
        : (rule.twoPlusPerPersonAmount ?? rule.onePersonAmount ?? 0) * passengers;
  }

  if (rule.computationMode === "one_or_two_total_vs_three_plus_each") {
    baseFare =
      passengers <= 2
        ? rule.oneOrTwoPeopleTotalAmount ?? 0
        : (rule.threePlusPerPersonAmount ?? 0) * passengers;
  }

  if (rule.computationMode === "flat_trip_one_to_four") {
    baseFare = rule.flatTripAmount ?? 0;
  }

  if (rule.computationMode === "negotiated") {
    return {
      ruleId: rule.id,
      pickupZoneId: pickupZone.id,
      dropoffZoneId: dropoffZone.id,
      pickupZoneName: pickupZone.displayName,
      dropoffZoneName: dropoffZone.displayName,
      baseFare: 0,
      luggageTotal: 0,
      lateNightTotal: 0,
      exclusivityTotal: 0,
      total: 0,
      currency: "USD",
      reviewStatus: rule.reviewStatus,
      source: rule.source,
      assumptions: ["This private or exclusive fare is negotiated with the operator."],
    };
  }

  if (serviceClass === "private" && rule.exclusivityRule === "pay_four_passengers") {
    const perPerson =
      rule.threePlusPerPersonAmount ??
      rule.twoPlusPerPersonAmount ??
      rule.onePersonAmount ??
      0;

    exclusivityTotal = Math.max(0, 4 - passengers) * perPerson;
  }

  const luggageTotal = bags * (rule.luggagePerBagAmount ?? 0);

  const lateNightTotal = isLateNight(input.departureTime, rule.lateNightWindow)
    ? passengers * (rule.lateNightPerPersonAmount ?? 0)
    : 0;

  return {
    ruleId: rule.id,
    pickupZoneId: pickupZone.id,
    dropoffZoneId: dropoffZone.id,
    pickupZoneName: pickupZone.displayName,
    dropoffZoneName: dropoffZone.displayName,
    baseFare,
    luggageTotal,
    lateNightTotal,
    exclusivityTotal,
    total: baseFare + luggageTotal + lateNightTotal + exclusivityTotal,
    currency: "USD",
    reviewStatus: rule.reviewStatus,
    source: rule.source,
    assumptions: [
      `Resolved ${input.pickupName} to ${pickupZone.displayName}.`,
      `Resolved ${input.dropoffName} to ${dropoffZone.displayName}.`,
      rule.reviewStatus === "needs_review"
        ? "Fare is based on reviewed operational/public rate capture and still needs official tariff verification."
        : "Fare is based on reviewed tariff data.",
    ],
  };
}

export function calculateTaxiQuote(input: TaxiQuoteRequest): TaxiQuoteBreakdown {
  return calculateOfficialTaxiQuote(input) ?? fallbackQuote(input);
}

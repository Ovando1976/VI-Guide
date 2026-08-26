import type {
  RideMode,
  TaxiDispatchPolicySnapshot,
} from "@/types/mobility";

export const USVI_TAXI_SERVICE_POLICY_VERSION =
  "usvi-regulated-hybrid-v1" as const;

const SHARED_DISPATCH_MODES: ReadonlySet<RideMode> = new Set([
  "standard",
  "shared",
  "safari",
  "airport",
  "ferry-transfer",
]);

/**
 * Server-owned service semantics for the regulated USVI taxi network.
 *
 * This policy never changes the fare. Pricing remains exclusively governed by
 * the active verified official taxi tariff. It only records how dispatch should
 * treat the request.
 *
 * Standard, shared, safari, airport, and ferry-transfer requests are
 * shared-service capable. Premium/executive and other specialized requests are
 * direct requests, but they are NOT an exclusive/private charter guarantee.
 * Exclusive service requires separate dispatch confirmation under a verified
 * published rule.
 */
export function getUsviTaxiServicePolicy(
  mode: RideMode,
): TaxiDispatchPolicySnapshot {
  if (SHARED_DISPATCH_MODES.has(mode)) {
    return {
      version: USVI_TAXI_SERVICE_POLICY_VERSION,
      serviceExpectation: "shared",
      queueTreatment: "queue_compatible",
      exclusivity: "not_included",
      pricingAuthority: "official_usvi_taxi_tariff",
    };
  }

  return {
    version: USVI_TAXI_SERVICE_POLICY_VERSION,
    serviceExpectation: "direct_request",
    queueTreatment: "direct_request",
    exclusivity: "dispatch_confirmation_required",
    pricingAuthority: "official_usvi_taxi_tariff",
  };
}

export function isSharedTaxiDispatchMode(mode: RideMode) {
  return SHARED_DISPATCH_MODES.has(mode);
}

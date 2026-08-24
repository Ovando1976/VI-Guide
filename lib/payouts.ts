import {
  TAXI_PLATFORM_COMMISSION_BPS,
  splitTaxiRideAmountCents,
  taxiAmountToCents,
} from "./taxi-economics";

export function buildPayout(params: { totalFare: number }) {
  const split = splitTaxiRideAmountCents(taxiAmountToCents(params.totalFare));

  return {
    grossFare: split.grossAmountCents / 100,
    commissionRate: TAXI_PLATFORM_COMMISSION_BPS / 10_000,
    platformRevenue: split.platformCommissionCents / 100,
    driverPayout: split.driverShareCents / 100,
  };
}

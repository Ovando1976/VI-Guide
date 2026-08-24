import {
  TAXI_PLATFORM_COMMISSION_RATE,
  allocateTaxiRideCents,
  taxiCentsToDollars,
  taxiFareDollarsToCents,
} from "@/lib/taxi-commission-policy";

export function buildPayout(params: { totalFare: number }) {
  const allocation = allocateTaxiRideCents(
    taxiFareDollarsToCents(params.totalFare),
  );

  return {
    grossFare: taxiCentsToDollars(allocation.grossAmountCents),
    commissionRate: TAXI_PLATFORM_COMMISSION_RATE,
    platformRevenue: taxiCentsToDollars(allocation.platformCommissionCents),
    driverPayout: taxiCentsToDollars(allocation.driverShareCents),
  };
}

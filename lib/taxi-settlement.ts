import "server-only";

import {
  TAXI_FEE_AGREEMENT_ID,
  TAXI_PLATFORM_COMMISSION_RATE,
  allocateTaxiRideCents,
  taxiCentsToDollars,
  taxiFareDollarsToCents,
} from "@/lib/taxi-commission-policy";

export type TaxiSettlementBreakdown = {
  grossFare: number;
  commissionRate: number;
  platformRevenue: number;
  driverPayout: number;
  feeAgreementId: string;
};

export function calculateTaxiSettlement(
  grossFare: number,
): TaxiSettlementBreakdown {
  const allocation = allocateTaxiRideCents(taxiFareDollarsToCents(grossFare));

  return {
    grossFare: taxiCentsToDollars(allocation.grossAmountCents),
    commissionRate: TAXI_PLATFORM_COMMISSION_RATE,
    platformRevenue: taxiCentsToDollars(allocation.platformCommissionCents),
    driverPayout: taxiCentsToDollars(allocation.driverShareCents),
    feeAgreementId: TAXI_FEE_AGREEMENT_ID,
  };
}

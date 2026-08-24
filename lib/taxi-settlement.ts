import "server-only";

import {
  TAXI_PLATFORM_COMMISSION_BPS,
  splitTaxiRideAmountCents,
  taxiAmountToCents,
} from "./taxi-economics";

export type TaxiSettlementBreakdown = {
  grossFare: number;
  commissionRate: number;
  platformRevenue: number;
  driverPayout: number;
  feeAgreementId: string;
};

export function calculateTaxiSettlement(grossFare: number): TaxiSettlementBreakdown {
  const split = splitTaxiRideAmountCents(taxiAmountToCents(grossFare));
  const commissionRate = TAXI_PLATFORM_COMMISSION_BPS / 10_000;

  return {
    grossFare: split.grossAmountCents / 100,
    commissionRate,
    platformRevenue: split.platformCommissionCents / 100,
    driverPayout: split.driverShareCents / 100,
    feeAgreementId:
      process.env.TAXI_FEE_AGREEMENT_ID?.trim() ||
      `standard-${TAXI_PLATFORM_COMMISSION_BPS}bps`,
  };
}

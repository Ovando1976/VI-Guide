import "server-only";

const DEFAULT_COMMISSION_RATE = 0.15;
const MAX_COMMISSION_RATE = 0.5;

export type TaxiSettlementBreakdown = {
  grossFare: number;
  commissionRate: number;
  platformRevenue: number;
  driverPayout: number;
  feeAgreementId: string;
};

export function calculateTaxiSettlement(grossFare: number): TaxiSettlementBreakdown {
  const normalizedGross = money(Math.max(0, Number(grossFare) || 0));
  const commissionRate = readCommissionRate();
  const platformRevenue = money(normalizedGross * commissionRate);
  const driverPayout = money(normalizedGross - platformRevenue);

  return {
    grossFare: normalizedGross,
    commissionRate,
    platformRevenue,
    driverPayout,
    feeAgreementId:
      process.env.TAXI_FEE_AGREEMENT_ID?.trim() ||
      `pilot-${Math.round(commissionRate * 10_000)}bps`,
  };
}

function readCommissionRate() {
  const configured = Number(process.env.TAXI_PLATFORM_COMMISSION_RATE);
  if (!Number.isFinite(configured)) return DEFAULT_COMMISSION_RATE;
  return Math.min(MAX_COMMISSION_RATE, Math.max(0, configured));
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

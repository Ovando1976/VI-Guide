const BASIS_POINTS = 10_000;

export const TAXI_DRIVER_SIGNUP_FEE_CENTS = 0;
export const TAXI_PLATFORM_COMMISSION_BPS = 1_500;
export const TAXI_DRIVER_SHARE_BPS =
  BASIS_POINTS - TAXI_PLATFORM_COMMISSION_BPS;
export const TAXI_PLATFORM_COMMISSION_RATE =
  TAXI_PLATFORM_COMMISSION_BPS / BASIS_POINTS;
export const TAXI_DRIVER_SHARE_RATE = TAXI_DRIVER_SHARE_BPS / BASIS_POINTS;
export const TAXI_FEE_AGREEMENT_ID = "vi-guide-taxi-commission-1500bps-v1";

export type TaxiRideAllocation = {
  grossAmountCents: number;
  platformCommissionCents: number;
  driverShareCents: number;
};

export function taxiFareDollarsToCents(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const cents = Math.round((amount + Number.EPSILON) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : 0;
}

export function allocateTaxiRideCents(value: unknown): TaxiRideAllocation {
  const grossAmountCents = Number(value);
  if (!Number.isSafeInteger(grossAmountCents) || grossAmountCents < 0) {
    return {
      grossAmountCents: 0,
      platformCommissionCents: 0,
      driverShareCents: 0,
    };
  }

  const platformCommissionCents = Math.min(
    grossAmountCents,
    Math.round(
      (grossAmountCents * TAXI_PLATFORM_COMMISSION_BPS) / BASIS_POINTS,
    ),
  );

  return {
    grossAmountCents,
    platformCommissionCents,
    driverShareCents: grossAmountCents - platformCommissionCents,
  };
}

export function taxiCentsToDollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

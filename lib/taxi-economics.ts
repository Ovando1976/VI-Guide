export const TAXI_DRIVER_SIGNUP_FEE_CENTS = 0;
export const TAXI_PLATFORM_COMMISSION_BPS = 1_500;
export const TAXI_DRIVER_SHARE_BPS = 10_000 - TAXI_PLATFORM_COMMISSION_BPS;

const BASIS_POINTS_DENOMINATOR = 10_000;

export type TaxiRideAmountSplit = {
  grossAmountCents: number;
  platformCommissionCents: number;
  driverShareCents: number;
};

export function taxiAmountToCents(amount: number) {
  const normalized = Number.isFinite(amount) ? amount : 0;
  return Math.max(0, Math.round(normalized * 100));
}

export function splitTaxiRideAmountCents(
  grossAmountCents: number,
): TaxiRideAmountSplit {
  const normalizedGross = Math.max(
    0,
    Math.round(Number.isFinite(grossAmountCents) ? grossAmountCents : 0),
  );
  const platformCommissionCents = Math.round(
    (normalizedGross * TAXI_PLATFORM_COMMISSION_BPS) /
      BASIS_POINTS_DENOMINATOR,
  );
  const driverShareCents = normalizedGross - platformCommissionCents;

  return {
    grossAmountCents: normalizedGross,
    platformCommissionCents,
    driverShareCents,
  };
}

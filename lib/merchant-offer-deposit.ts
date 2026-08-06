export type MerchantOfferDepositSource =
  | "offer"
  | "merchant_override"
  | "manual";

export type MerchantOfferDepositResolution = {
  amountCents: number;
  source: MerchantOfferDepositSource;
  offerAmountCents: number | null;
  overridden: boolean;
};

export function resolveMerchantOfferDeposit(input: {
  hasRequestedValue: boolean;
  requestedValue: unknown;
  offerDepositCents: unknown;
}): MerchantOfferDepositResolution {
  const offerAmountCents = normalizePositiveMoney(input.offerDepositCents);
  const requestedAmountCents = input.hasRequestedValue
    ? normalizeMoney(input.requestedValue)
    : null;

  if (offerAmountCents !== null) {
    if (requestedAmountCents === null || requestedAmountCents === 0) {
      return {
        amountCents: offerAmountCents,
        source: "offer",
        offerAmountCents,
        overridden: false,
      };
    }
    if (requestedAmountCents === offerAmountCents) {
      return {
        amountCents: offerAmountCents,
        source: "offer",
        offerAmountCents,
        overridden: false,
      };
    }
    return {
      amountCents: requestedAmountCents,
      source: "merchant_override",
      offerAmountCents,
      overridden: true,
    };
  }

  return {
    amountCents: requestedAmountCents ?? 0,
    source: "manual",
    offerAmountCents: null,
    overridden: false,
  };
}

function normalizePositiveMoney(value: unknown) {
  const amount = normalizeMoney(value);
  return amount !== null && amount > 0 ? amount : null;
}

function normalizeMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.max(0, Math.min(10_000_000, Math.round(amount)));
}

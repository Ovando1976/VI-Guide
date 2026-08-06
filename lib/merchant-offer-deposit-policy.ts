export function merchantOfferDepositError(input: {
  amountCents: unknown;
  offerPriceCents: unknown;
}) {
  const amount = normalizeMoney(input.amountCents);
  const price = normalizePositiveMoney(input.offerPriceCents);
  if (amount === null || price === null) return null;
  return amount > price
    ? "The deposit cannot exceed the verified offer price."
    : null;
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

export type MerchantOfferDemandRecord = {
  requestCount?: unknown;
  lastRequestedAt?: unknown;
};

export function normalizeMerchantOfferRequestCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0
    ? Math.min(count, Number.MAX_SAFE_INTEGER - 1)
    : 0;
}

export function merchantOfferDemandPatch(
  record: MerchantOfferDemandRecord,
  now: Date = new Date(),
) {
  const requestCount = normalizeMerchantOfferRequestCount(record.requestCount);
  return {
    requestCount: requestCount + 1,
    lastRequestedAt: now.toISOString(),
  };
}

export function merchantOfferDemandSummary(
  records: MerchantOfferDemandRecord[],
) {
  return records.reduce(
    (summary, record) => {
      const requestCount = normalizeMerchantOfferRequestCount(record.requestCount);
      summary.requests += requestCount;
      if (requestCount > 0) summary.offersWithDemand += 1;
      if (requestCount > summary.highestRequestCount) {
        summary.highestRequestCount = requestCount;
      }
      return summary;
    },
    {
      requests: 0,
      offersWithDemand: 0,
      highestRequestCount: 0,
    },
  );
}

export function normalizeMerchantOfferLastRequestedAt(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

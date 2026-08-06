import assert from "node:assert/strict";

import { resolveMerchantOfferForBooking } from "../lib/merchant-offer-booking";

const now = new Date("2026-08-05T18:30:00.000Z");
const record = {
  status: "active",
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  kind: "tour",
  island: "stt",
  title: "Sunset island tour",
  summary:
    "A guided sunset experience with scenic overlooks and local history.",
  inclusions: "Guide\nBottled water",
  terms: "Advance reservation required.",
  priceCents: 12900,
  compareAtCents: 15900,
  depositCents: 5000,
  validFrom: "2026-08-01",
  validThrough: "2026-12-31",
};

assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "offer_abc123",
    record,
    now,
  }),
  {
    ok: true,
    snapshot: {
      offerId: "offer_abc123",
      offerTitle: "Sunset island tour",
      offerPriceCents: 12900,
      offerCompareAtCents: 15900,
      offerDepositCents: 5000,
      listingId: "island-tour-one",
      listingName: "Island Tour One",
      kind: "tour",
      island: "stt",
      validFrom: "2026-08-01",
      validThrough: "2026-12-31",
    },
  },
);

assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "bad id",
    record,
    now,
  }),
  { ok: false, error: "Choose a valid VI Guide offer.", status: 400 },
);
assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "offer_missing",
    record: null,
    now,
  }),
  { ok: false, error: "This VI Guide offer was not found.", status: 404 },
);
assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "offer_paused",
    record: { ...record, status: "paused" },
    now,
  }),
  {
    ok: false,
    error: "This VI Guide offer is not currently bookable.",
    status: 409,
  },
);
assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "offer_scheduled",
    record: { ...record, validFrom: "2026-08-06" },
    now,
  }),
  {
    ok: false,
    error: "This VI Guide offer is not currently bookable.",
    status: 409,
  },
);
assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "offer_expired",
    record: {
      ...record,
      validFrom: "2026-07-01",
      validThrough: "2026-08-04",
    },
    now,
  }),
  {
    ok: false,
    error: "This VI Guide offer is not currently bookable.",
    status: 409,
  },
);
assert.deepEqual(
  resolveMerchantOfferForBooking({
    offerId: "offer_invalid_price",
    record: { ...record, priceCents: 1 },
    now,
  }),
  {
    ok: false,
    error: "This VI Guide offer is not currently bookable.",
    status: 409,
  },
);

console.log("Merchant offer booking tests passed.");

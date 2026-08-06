import assert from "node:assert/strict";

import {
  canTransitionMerchantOffer,
  formatMerchantOfferMoney,
  merchantOfferListingAllowed,
  merchantOfferPublicState,
  merchantOfferToday,
  normalizeMerchantOffer,
  normalizeMerchantOfferId,
} from "../lib/merchant-offers";

const now = new Date("2026-08-05T18:30:00.000Z");
assert.equal(merchantOfferToday(now), "2026-08-05");
assert.equal(
  merchantOfferToday(new Date("2026-08-06T01:00:00.000Z")),
  "2026-08-05",
);

const valid = normalizeMerchantOffer(
  {
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
    validFrom: "2026-08-05",
    validThrough: "2026-12-31",
  },
  now,
);
if (!valid.ok) throw new Error(valid.error);
assert.equal(valid.ok, true);
assert.equal(valid.offer.priceCents, 12900);
assert.equal(valid.offer.compareAtCents, 15900);
assert.equal(valid.offer.depositCents, 5000);

assert.deepEqual(
  normalizeMerchantOffer(
    {
      ...valid.offer,
      compareAtCents: 10000,
    },
    now,
  ),
  {
    ok: false,
    error: "The original price must be greater than the offer price.",
  },
);
assert.deepEqual(
  normalizeMerchantOffer(
    {
      ...valid.offer,
      depositCents: 13000,
    },
    now,
  ),
  {
    ok: false,
    error: "The deposit cannot exceed the offer price.",
  },
);
assert.deepEqual(
  normalizeMerchantOffer(
    {
      ...valid.offer,
      validFrom: "2026-08-04",
    },
    now,
  ),
  {
    ok: false,
    error: "The offer start date cannot be before today in the USVI.",
  },
);
assert.equal(
  normalizeMerchantOffer(
    {
      ...valid.offer,
      validFrom: "2026-08-01",
      validThrough: "2026-08-31",
    },
    now,
    { allowStarted: true },
  ).ok,
  true,
);
assert.deepEqual(
  normalizeMerchantOffer(
    {
      ...valid.offer,
      validFrom: "2026-07-01",
      validThrough: "2026-08-04",
    },
    now,
    { allowStarted: true },
  ),
  {
    ok: false,
    error: "Expired offers cannot be edited or reactivated.",
  },
);
assert.deepEqual(
  normalizeMerchantOffer(
    {
      ...valid.offer,
      validThrough: "2028-12-31",
    },
    now,
  ),
  {
    ok: false,
    error: "An offer cannot remain open for more than two years.",
  },
);

assert.equal(canTransitionMerchantOffer("draft", "active"), true);
assert.equal(canTransitionMerchantOffer("active", "paused"), true);
assert.equal(canTransitionMerchantOffer("paused", "active"), true);
assert.equal(canTransitionMerchantOffer("archived", "active"), false);
assert.equal(canTransitionMerchantOffer("draft", "paused"), false);

assert.equal(
  merchantOfferListingAllowed({
    role: "merchant",
    listingIds: ["listing-one"],
    listingId: "listing-one",
  }),
  true,
);
assert.equal(
  merchantOfferListingAllowed({
    role: "merchant",
    listingIds: ["listing-one"],
    listingId: "listing-two",
  }),
  false,
);
assert.equal(
  merchantOfferListingAllowed({
    role: "admin",
    listingIds: [],
    listingId: "listing-two",
  }),
  true,
);
assert.equal(
  merchantOfferListingAllowed({
    role: "dispatcher",
    listingIds: [],
    listingId: "listing-two",
  }),
  false,
);

assert.equal(
  merchantOfferPublicState(
    {
      status: "active",
      validFrom: "2026-08-05",
      validThrough: "2026-08-31",
    },
    now,
  ),
  "live",
);
assert.equal(
  merchantOfferPublicState(
    {
      status: "active",
      validFrom: "2026-08-06",
      validThrough: "2026-08-31",
    },
    now,
  ),
  "scheduled",
);
assert.equal(
  merchantOfferPublicState(
    {
      status: "active",
      validFrom: "2026-07-01",
      validThrough: "2026-08-04",
    },
    now,
  ),
  "expired",
);
assert.equal(
  merchantOfferPublicState(
    {
      status: "paused",
      validFrom: "2026-08-05",
      validThrough: "2026-08-31",
    },
    now,
  ),
  "unavailable",
);

assert.equal(normalizeMerchantOfferId("offer_abc123"), "offer_abc123");
assert.equal(normalizeMerchantOfferId("bad id"), "");
assert.equal(formatMerchantOfferMoney(12900), "$129");
assert.equal(formatMerchantOfferMoney(12950), "$129.50");

console.log("Merchant offer tests passed.");

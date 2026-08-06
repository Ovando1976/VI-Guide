import assert from "node:assert/strict";

import {
  merchantOfferRequestDocumentId,
  merchantOfferRequestQuotaAllows,
  merchantOfferRequestQuotaDocumentId,
} from "../lib/merchant-offer-request-id";

const beforeMidnightAtlantic = new Date("2026-08-06T01:30:00.000Z");
const base = {
  offerId: "offer_abc123",
  email: "Guest@Example.com",
  startDate: "2026-08-20",
  endDate: "2026-08-22",
  preferredTime: "2:30 PM",
  adults: 2,
  children: 1,
  offerPriceCents: 12900,
  offerDepositCents: 5000,
  now: beforeMidnightAtlantic,
};

const first = merchantOfferRequestDocumentId(base);
assert.match(first, /^offer_request_[a-f0-9]{40}$/);
assert.equal(
  first,
  merchantOfferRequestDocumentId({
    ...base,
    email: " guest@example.com ",
    preferredTime: "  2:30   PM ",
  }),
);
assert.notEqual(
  first,
  merchantOfferRequestDocumentId({ ...base, startDate: "2026-08-21" }),
);
assert.notEqual(
  first,
  merchantOfferRequestDocumentId({ ...base, adults: 3 }),
);
assert.notEqual(
  first,
  merchantOfferRequestDocumentId({ ...base, offerPriceCents: 13900 }),
);
assert.notEqual(
  first,
  merchantOfferRequestDocumentId({ ...base, offerDepositCents: 6000 }),
);
assert.notEqual(
  first,
  merchantOfferRequestDocumentId({
    ...base,
    now: new Date("2026-08-06T04:30:00.000Z"),
  }),
);

const quota = merchantOfferRequestQuotaDocumentId({
  email: base.email,
  now: beforeMidnightAtlantic,
});
assert.match(quota, /^offer_email_[a-f0-9]{40}$/);
assert.equal(
  quota,
  merchantOfferRequestQuotaDocumentId({
    email: " guest@example.com ",
    now: beforeMidnightAtlantic,
  }),
);
assert.notEqual(
  quota,
  merchantOfferRequestQuotaDocumentId({
    email: base.email,
    now: new Date("2026-08-06T04:30:00.000Z"),
  }),
);
assert.equal(merchantOfferRequestQuotaAllows(0), true);
assert.equal(merchantOfferRequestQuotaAllows(9), true);
assert.equal(merchantOfferRequestQuotaAllows(10), false);
assert.equal(merchantOfferRequestQuotaAllows("not-a-number"), true);

console.log("Merchant offer request ID tests passed.");

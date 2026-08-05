import assert from "node:assert/strict";

import { merchantOfferRequestDocumentId } from "../lib/merchant-offer-request-id";

const beforeMidnightAtlantic = new Date("2026-08-06T01:30:00.000Z");
const base = {
  offerId: "offer_abc123",
  email: "Guest@Example.com",
  startDate: "2026-08-20",
  endDate: "2026-08-22",
  preferredTime: "2:30 PM",
  adults: 2,
  children: 1,
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
  merchantOfferRequestDocumentId({
    ...base,
    now: new Date("2026-08-06T04:30:00.000Z"),
  }),
);

console.log("Merchant offer request ID tests passed.");

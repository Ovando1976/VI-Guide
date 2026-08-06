import assert from "node:assert/strict";

import {
  MAX_PARTNER_STATUS_LOOKUPS_PER_EMAIL_DAY,
  partnerStatusLookupDayFingerprint,
  partnerStatusLookupQuotaAllows,
} from "../lib/partners/partner-application-status-intake";

const first = partnerStatusLookupDayFingerprint({
  email: " Business@Example.com ",
  dayKey: "2026-08-05",
});
const second = partnerStatusLookupDayFingerprint({
  email: "business@example.com",
  dayKey: "2026-08-05",
});
assert.equal(first, second);
assert.match(first, /^[a-f0-9]{64}$/);
assert.notEqual(
  first,
  partnerStatusLookupDayFingerprint({
    email: "business@example.com",
    dayKey: "2026-08-06",
  }),
);
assert.equal(partnerStatusLookupQuotaAllows(0), true);
assert.equal(
  partnerStatusLookupQuotaAllows(
    MAX_PARTNER_STATUS_LOOKUPS_PER_EMAIL_DAY - 1,
  ),
  true,
);
assert.equal(
  partnerStatusLookupQuotaAllows(MAX_PARTNER_STATUS_LOOKUPS_PER_EMAIL_DAY),
  false,
);
assert.equal(partnerStatusLookupQuotaAllows("invalid", 2), true);
assert.equal(partnerStatusLookupQuotaAllows(2, 2), false);

console.log("Partner status lookup quota tests passed.");

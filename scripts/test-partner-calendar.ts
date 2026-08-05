import assert from "node:assert/strict";

import { partnerTerritoryDayKey } from "../lib/partners/partner-calendar";

assert.equal(
  partnerTerritoryDayKey(new Date("2026-08-06T02:30:00.000Z")),
  "2026-08-05",
);
assert.equal(
  partnerTerritoryDayKey(new Date("2026-08-06T03:59:59.999Z")),
  "2026-08-05",
);
assert.equal(
  partnerTerritoryDayKey(new Date("2026-08-06T04:00:00.000Z")),
  "2026-08-06",
);

console.log("Partner USVI calendar tests passed.");

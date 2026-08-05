import assert from "node:assert/strict";

import { USVI_GOVERNORS } from "../data/heritage/usvi-governors";
import { VIRGIN_ISLANDS_GOVERNORS } from "../data/heritage/virgin-islands-governors";
import { canonicalGovernorAnchorId } from "../lib/heritage/governor-anchor-aliases";

const canonicalIds = new Set(
  VIRGIN_ISLANDS_GOVERNORS.map((governor) => governor.id),
);
const unresolved = USVI_GOVERNORS.filter(
  (governor) => !canonicalIds.has(canonicalGovernorAnchorId(governor.id)),
).map((governor) => governor.id);

assert.deepEqual(
  unresolved,
  [],
  `Governor search records without canonical page anchors: ${unresolved.join(", ")}`,
);

assert.equal(
  canonicalGovernorAnchorId("morris-fidanque-de-castro"),
  "morris-f-de-castro",
);
assert.equal(
  canonicalGovernorAnchorId("cyril-emmanuel-king-acting"),
  "cyril-e-king-acting",
);
assert.equal(
  canonicalGovernorAnchorId("cyril-emmanuel-king-elected"),
  "cyril-e-king-elected",
);
assert.equal(
  canonicalGovernorAnchorId("juan-francisco-luis"),
  "juan-f-luis",
);
assert.equal(
  canonicalGovernorAnchorId("roy-lester-schneider"),
  "roy-l-schneider",
);

console.log("Governor search anchor tests passed.");

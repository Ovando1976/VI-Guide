import assert from "node:assert/strict";

import {
  ACTIVITY_COVERAGE_SOURCES,
  BOOKABLE_EXPERIENCES,
  getActivityCoverage,
} from "../lib/bookable-experiences";
import { CAR_RENTAL_OPERATORS } from "../lib/car-rentals";
import { USVI_EVENTS } from "../lib/events";
import {
  BUSINESS_COVERAGE_SUBMISSION_HREF,
  MARKET_COVERAGE_POLICY,
  MARKET_COVERAGE_SOURCES,
} from "../lib/market-coverage";

const islands = MARKET_COVERAGE_POLICY.requiredIslands;

assert.ok(
  BOOKABLE_EXPERIENCES.length >= 42,
  "Activity catalog unexpectedly shrank",
);
assert.ok(
  BOOKABLE_EXPERIENCES.filter((item) => item.category === "scuba").length >= 11,
  "Scuba coverage unexpectedly shrank",
);
assert.ok(
  BOOKABLE_EXPERIENCES.filter(
    (item) => item.category === "sailing" || item.category === "boat-charter",
  ).length >= 9,
  "Sailing and charter coverage unexpectedly shrank",
);
for (const category of [
  "fishing",
  "jet-ski",
  "paddleboard",
  "horseback",
  "food-tour",
] as const) {
  assert.ok(
    BOOKABLE_EXPERIENCES.some((item) => item.category === category),
    `Expanded activity coverage missing: ${category}`,
  );
}

assert.ok(
  CAR_RENTAL_OPERATORS.length >= 39,
  "Rental catalog unexpectedly shrank",
);
assert.ok(
  CAR_RENTAL_OPERATORS.filter((item) => item.island === "stt").length >= 15,
  "St. Thomas rental coverage unexpectedly shrank",
);
assert.ok(
  CAR_RENTAL_OPERATORS.filter((item) => item.island === "stj").length >= 18,
  "St. John rental coverage unexpectedly shrank",
);
assert.ok(
  CAR_RENTAL_OPERATORS.filter((item) => item.island === "stx").length >= 6,
  "St. Croix rental coverage unexpectedly shrank",
);
assert.ok(USVI_EVENTS.length >= 8, "Event catalog unexpectedly shrank");

for (const island of islands) {
  const activityOperators = new Set(
    BOOKABLE_EXPERIENCES.filter((item) => item.island === island).map(
      (item) => item.operator,
    ),
  );
  assert.ok(
    activityOperators.size >=
      MARKET_COVERAGE_POLICY.minimumActivityOperatorsPerIsland,
    `${island} needs more verified activity operators`,
  );

  const rentalOperators = CAR_RENTAL_OPERATORS.filter(
    (item) => item.island === island,
  );
  assert.ok(
    rentalOperators.length >=
      MARKET_COVERAGE_POLICY.minimumRentalOperatorsPerIsland,
    `${island} needs more verified rental operators`,
  );
}

const activityCategories = new Set(
  BOOKABLE_EXPERIENCES.map((item) => item.category),
);
for (const category of MARKET_COVERAGE_POLICY.requiredActivityCategories) {
  assert.ok(
    activityCategories.has(category),
    `Missing activity category: ${category}`,
  );
}

for (const item of BOOKABLE_EXPERIENCES) {
  assert.ok(item.operator.trim(), `${item.id} needs an operator`);
  assert.match(
    item.sourceUrl,
    /^https?:\/\//,
    `${item.id} needs a source URL`,
  );
  assert.match(
    item.verifiedAt,
    /^\d{4}-\d{2}-\d{2}$/,
    `${item.id} needs verifiedAt`,
  );
}

for (const item of CAR_RENTAL_OPERATORS) {
  assert.ok(item.name.trim(), `${item.id} needs an operator name`);
  assert.ok(item.location.trim(), `${item.id} needs a location`);
  assert.ok(item.sourceLabel.trim(), `${item.id} needs a source label`);
  assert.ok(item.vehicleTypes.length > 0, `${item.id} needs a fleet description`);
  assert.match(item.website, /^https?:\/\//, `${item.id} needs a source URL`);
  assert.match(
    item.verifiedAt,
    /^\d{4}-\d{2}-\d{2}$/,
    `${item.id} needs verifiedAt`,
  );
}

assert.equal(
  new Set(BOOKABLE_EXPERIENCES.map((item) => item.id)).size,
  BOOKABLE_EXPERIENCES.length,
  "Activity IDs must be unique",
);
assert.equal(
  new Set(CAR_RENTAL_OPERATORS.map((item) => item.id)).size,
  CAR_RENTAL_OPERATORS.length,
  "Rental IDs must be unique",
);

assert.ok(ACTIVITY_COVERAGE_SOURCES.length >= 4);
assert.ok(
  MARKET_COVERAGE_SOURCES.some((source) => source.inventory === "events"),
);
assert.ok(
  MARKET_COVERAGE_SOURCES.some((source) => source.inventory === "activities"),
);
assert.ok(
  MARKET_COVERAGE_SOURCES.some((source) => source.inventory === "car-rentals"),
);
assert.ok(
  MARKET_COVERAGE_SOURCES.some(
    (source) =>
      source.inventory === "car-rentals" && source.authority === "destination",
  ),
  "Rental coverage needs a territory destination source",
);
assert.ok(BUSINESS_COVERAGE_SUBMISSION_HREF.startsWith("/merchant"));
assert.equal(getActivityCoverage().length, 3);

console.log("USVI Explorer market coverage contracts passed.");

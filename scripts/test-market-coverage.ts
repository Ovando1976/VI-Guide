import assert from "node:assert/strict";

import {
  ACCOMMODATIONS,
  RESTORED_ACCOMMODATIONS,
} from "../lib/accommodations";
import {
  ACTIVITY_COVERAGE_SOURCES,
  BOOKABLE_EXPERIENCES,
  CURRENT_DESTINATION_ACTIVITY_OPERATORS,
  getActivityCoverage,
} from "../lib/bookable-experiences-restored";
import { CAR_RENTAL_OPERATORS } from "../lib/car-rentals";
import {
  RESTORED_BEACH_NAMES,
  RESTORED_BEACH_RECORDS,
} from "../lib/directory-data/beach-restoration";
import { getBeaches } from "../lib/directory-data/loader";
import { USVI_EVENTS } from "../lib/events";
import { HISTORIC_SITE_CORRECTION_IDS } from "../lib/historic-sites/corrections";
import { getHistoricSites } from "../lib/historic-sites";
import {
  BUSINESS_COVERAGE_SUBMISSION_HREF,
  MARKET_COVERAGE_POLICY,
  MARKET_COVERAGE_SOURCES,
} from "../lib/market-coverage";

const islands = MARKET_COVERAGE_POLICY.requiredIslands;

assert.ok(
  BOOKABLE_EXPERIENCES.length >= 62,
  "Activity catalog unexpectedly shrank",
);
assert.ok(
  BOOKABLE_EXPERIENCES.filter((item) => item.category === "scuba").length >= 12,
  "Scuba coverage unexpectedly shrank",
);
assert.ok(
  BOOKABLE_EXPERIENCES.filter(
    (item) => item.category === "sailing" || item.category === "boat-charter",
  ).length >= 12,
  "Sailing and charter coverage unexpectedly shrank",
);
for (const category of [
  "fishing",
  "jet-ski",
  "paddleboard",
  "horseback",
  "food-tour",
  "cultural",
  "atv",
  "land-tour",
] as const) {
  assert.ok(
    BOOKABLE_EXPERIENCES.some((item) => item.category === category),
    `Expanded activity coverage missing: ${category}`,
  );
}

const activityOperatorNames = new Set(
  BOOKABLE_EXPERIENCES.map((item) => item.operator),
);
for (const operator of CURRENT_DESTINATION_ACTIVITY_OPERATORS) {
  assert.ok(
    activityOperatorNames.has(operator),
    `Current destination-guide operator missing: ${operator}`,
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
assert.ok(USVI_EVENTS.length >= 18, "Event catalog unexpectedly shrank");

const beaches = getBeaches();
const beachNames = new Set(beaches.map((beach) => beach.name));
assert.ok(
  beaches.length >= 75,
  "Beach directory unexpectedly shrank below restored territory coverage",
);
assert.ok(
  beaches.filter((beach) => beach.island === "stt").length >= 26,
  "St. Thomas beach coverage unexpectedly shrank",
);
assert.ok(
  beaches.filter((beach) => beach.island === "stj").length >= 23,
  "St. John beach coverage unexpectedly shrank",
);
assert.ok(
  beaches.filter((beach) => beach.island === "stx").length >= 26,
  "St. Croix beach coverage unexpectedly shrank",
);
for (const name of RESTORED_BEACH_NAMES) {
  assert.ok(beachNames.has(name), `Restored beach missing from directory: ${name}`);
}
for (const beach of RESTORED_BEACH_RECORDS) {
  assert.match(beach.sourceUrl, /^https?:\/\//, `${beach.id} needs a source URL`);
  assert.ok(beach.sourceLabel.trim(), `${beach.id} needs a source label`);
  assert.match(
    beach.verifiedAt,
    /^\d{4}-\d{2}-\d{2}$/,
    `${beach.id} needs verifiedAt`,
  );
  assert.ok(beach.sourceUrls.length > 0, `${beach.id} needs source provenance`);
  assert.ok(
    beach.heroImage.startsWith("/images/places/fallbacks/"),
    `${beach.id} must use a truthful generic visual until an exact-location image is reviewed`,
  );
}
assert.equal(
  new Set(beaches.map((beach) => beach.id)).size,
  beaches.length,
  "Beach IDs must be unique",
);
assert.equal(
  new Set(beaches.map((beach) => beach.slug)).size,
  beaches.length,
  "Beach slugs must be unique",
);

const accommodationNames = new Set(ACCOMMODATIONS.map((item) => item.name));
assert.ok(
  ACCOMMODATIONS.length >= 60,
  "Accommodation catalog unexpectedly shrank below restored territory coverage",
);
assert.ok(
  ACCOMMODATIONS.filter((item) => item.island === "stt").length >= 30,
  "St. Thomas stay coverage unexpectedly shrank",
);
assert.ok(
  ACCOMMODATIONS.filter((item) => item.island === "stj").length >= 11,
  "St. John stay coverage unexpectedly shrank",
);
assert.ok(
  ACCOMMODATIONS.filter((item) => item.island === "stx").length >= 18,
  "St. Croix stay coverage unexpectedly shrank",
);
for (const name of [
  "The Saint Resort",
  "The Westin St. John Resort Villas",
  "Estate Lindholm",
  "St. John Inn",
  "Sea Shore Allure",
  "Cruz Bay Boutique Hotel",
  "Concordia Eco Resort",
  "Cinnamon Bay Beach & Campground",
  "Grapetree Bay Hotel & Villas",
  "The Waves Cane Bay",
]) {
  assert.ok(
    accommodationNames.has(name),
    `Restored accommodation missing from catalog: ${name}`,
  );
}
for (const stay of RESTORED_ACCOMMODATIONS) {
  assert.ok(stay.sourceLabel?.trim(), `${stay.id} needs a source label`);
  assert.match(stay.sourceUrl ?? "", /^https?:\/\//, `${stay.id} needs a source URL`);
  assert.match(
    stay.verifiedAt ?? "",
    /^\d{4}-\d{2}-\d{2}$/,
    `${stay.id} needs verifiedAt`,
  );
  assert.ok(
    (stay.sourceUrls?.length ?? 0) > 0,
    `${stay.id} needs source provenance`,
  );
  assert.equal(
    stay.imageStatus,
    "pending",
    `${stay.id} exact-location image must stay pending until reviewed`,
  );
  assert.ok(
    stay.heroImage?.startsWith("/images/places/fallbacks/"),
    `${stay.id} must use a truthful generic visual until an exact-location image is reviewed`,
  );
}
assert.ok(
  ACCOMMODATIONS.some((item) => item.category === "campground"),
  "Accommodation coverage must include the Cinnamon Bay campground category",
);
assert.equal(
  new Set(ACCOMMODATIONS.map((item) => item.id)).size,
  ACCOMMODATIONS.length,
  "Accommodation IDs must be unique",
);
assert.equal(
  new Set(ACCOMMODATIONS.map((item) => item.slug)).size,
  ACCOMMODATIONS.length,
  "Accommodation slugs must be unique",
);

const historicSites = getHistoricSites();
const historicNames = new Set(historicSites.map((site) => site.name));
assert.ok(
  historicSites.length >= 230,
  "Historic catalog unexpectedly shrank below the restored 230-record baseline",
);
for (const name of [
  "99 Steps",
  "Annaberg Sugar Plantation",
  "Fort Christian",
  "Fort Frederik",
  "Fort Christiansværn",
]) {
  assert.ok(historicNames.has(name), `Core historic landmark missing: ${name}`);
}
for (const correctionId of HISTORIC_SITE_CORRECTION_IDS) {
  assert.ok(
    historicSites.some((site) => site.id === correctionId),
    `Governed historic correction target missing: ${correctionId}`,
  );
}
for (const site of historicSites) {
  const publicText = [
    site.name,
    site.description,
    site.shortDescription,
    site.location ?? "",
    ...site.aliases,
    ...site.nrhpOtherNames,
    ...site.tags,
  ].join(" ");
  assert.doesNotMatch(
    publicText,
    /\uFFFD/,
    `${site.id} contains a damaged replacement character`,
  );
}
const bethlehemSugarFactory = historicSites.find(
  (site) => site.id === "bethlehem-sugar-factory",
);
assert.ok(bethlehemSugarFactory, "Bethlehem Sugar Factory must remain in catalog");
assert.equal(bethlehemSugarFactory.island, "stx");
assert.match(bethlehemSugarFactory.description, /St\. Croix/);
assert.ok(bethlehemSugarFactory.tags.includes("STX"));
assert.ok(!bethlehemSugarFactory.tags.includes("STT"));
const barracksNo2 = historicSites.find((site) => site.id === "barracks-no-2");
assert.ok(barracksNo2?.aliases.includes("Enlisted Men's Barracks No. 2"));
const marcelliSchool = historicSites.find(
  (site) => site.id === "evelyn-e-marcelli-elementary-school",
);
assert.ok(marcelliSchool?.aliases.includes("Marine and Strangers' Hospital"));
assert.equal(
  new Set(historicSites.map((site) => site.id)).size,
  historicSites.length,
  "Historic IDs must be unique",
);
assert.equal(
  new Set(historicSites.map((site) => site.slug)).size,
  historicSites.length,
  "Historic slugs must be unique",
);

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
  assert.ok(item.location.trim(), `${item.id} needs a location`);
  assert.ok(item.sourceLabel.trim(), `${item.id} needs a source label`);
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

assert.ok(ACTIVITY_COVERAGE_SOURCES.length >= 7);
assert.ok(
  MARKET_COVERAGE_SOURCES.some((source) => source.inventory === "events"),
);
assert.ok(
  MARKET_COVERAGE_SOURCES.filter(
    (source) =>
      source.inventory === "activities" && source.authority === "destination",
  ).length >= 5,
  "Activity coverage needs current destination sources for all three islands",
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

console.log(
  `USVI Explorer market coverage contracts passed, including ${beaches.length} beaches, ${ACCOMMODATIONS.length} stays, and ${historicSites.length} historic records.`,
);

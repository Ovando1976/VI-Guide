import assert from "node:assert/strict";

import {
  RESTORED_BEACH_NAMES,
  RESTORED_BEACH_RECORDS,
} from "../lib/directory-data/beach-restoration";
import { getBeaches } from "../lib/directory-data/loader";

const beaches = getBeaches();
const beachNames = new Set(beaches.map((beach) => beach.name));

assert.ok(beaches.length >= 75, "Beach directory unexpectedly shrank below restored territory coverage");
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

assert.equal(
  new Set(beaches.map((beach) => beach.id)).size,
  beaches.length,
  "Beach IDs must remain unique",
);
assert.equal(
  new Set(beaches.map((beach) => beach.slug)).size,
  beaches.length,
  "Beach slugs must remain unique",
);

for (const name of RESTORED_BEACH_NAMES) {
  assert.ok(beachNames.has(name), `Restored beach missing from directory: ${name}`);
}

for (const name of [
  "Sapphire Beach",
  "Hull Bay Beach",
  "Secret Harbour Beach",
  "Great Lameshur Bay",
  "Leinster Bay Beach",
  "Great Cruz Bay Beach",
  "Cramer's Park Beach",
  "Mermaid Beach at The Buccaneer",
  "Protestant Cay Beach",
  "Tamarind Reef Bay Beach",
] as const) {
  assert.ok(beachNames.has(name), `Required territory beach missing: ${name}`);
}

for (const beach of beaches) {
  assert.ok(beach.name.trim(), `${beach.id} needs a name`);
  assert.ok(beach.description.trim(), `${beach.id} needs a description`);
  assert.ok(beach.heroImage.trim(), `${beach.id} needs a visual`);
  assert.ok(["stt", "stj", "stx"].includes(beach.island), `${beach.id} needs a valid island`);
}

for (const beach of RESTORED_BEACH_RECORDS) {
  assert.match(beach.sourceUrl, /^https?:\/\//, `${beach.id} needs a source URL`);
  assert.ok(beach.sourceLabel.trim(), `${beach.id} needs a source label`);
  assert.match(beach.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${beach.id} needs verifiedAt`);
  assert.ok(beach.sourceUrls.length > 0, `${beach.id} needs source provenance`);
  assert.ok(
    beach.heroImage.startsWith("/images/places/fallbacks/"),
    `${beach.id} must use a truthful generic visual until an exact-location image is reviewed`,
  );
}

console.log(
  `USVI Explorer beach coverage contracts passed for ${beaches.length} beaches (${beaches.filter((beach) => beach.island === "stt").length} STT / ${beaches.filter((beach) => beach.island === "stj").length} STJ / ${beaches.filter((beach) => beach.island === "stx").length} STX).`,
);

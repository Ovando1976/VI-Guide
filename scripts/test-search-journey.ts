import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const searchPage = source("app/search/page.tsx");
const directoryCard = source("components/directory/directory-card.tsx");

assert.match(searchPage, /ViPublicHeader/);
assert.match(searchPage, /actionLabel="Ask Concierge"/);
assert.match(searchPage, /secondaryLabel="Living Map"/);
assert.match(searchPage, /Search · whole territory/);
assert.match(searchPage, /DirectoryCard/);
assert.match(searchPage, /item=\{result\.item\}/);
assert.match(searchPage, /KIND_CONFIG\[result\.kind\]\.href\(result\.item\.slug\)/);
assert.match(searchPage, /Search · \$\{KIND_CONFIG\[result\.kind\]\.label\}/);
assert.doesNotMatch(searchPage, /function DirectoryResultCard/);

assert.match(searchPage, /searchEverything\(query, selectedKind, island\)/);
assert.match(searchPage, /scoreText/);
assert.match(searchPage, /buildSearchMapHref/);
assert.match(searchPage, /KINDS\.map/);
assert.match(searchPage, /params\.set\("q", query\)/);
assert.match(searchPage, /params\.set\("kind", entry\.value\)/);
assert.match(searchPage, /params\.set\("island", island\)/);
assert.match(searchPage, /TERRITORY_TIMELINE_EVENTS/);
assert.match(searchPage, /USVI_GOVERNORS/);

assert.match(directoryCard, /GooglePlacePhoto/);
assert.match(directoryCard, /SavePlaceButton/);
assert.match(directoryCard, /AddToJourneyButton/);
assert.match(directoryCard, /label="Map"/);
assert.match(directoryCard, /label="Ride"/);
assert.match(directoryCard, /label="Ask VI"/);
assert.match(directoryCard, /Open the story/);

console.log("VI Guide shared search discovery contracts passed.");

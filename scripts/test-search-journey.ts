import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const searchPage = source("app/search/page.tsx");
const directoryCard = source("components/directory/directory-card.tsx");
const eventsPage = source("app/events/page.tsx");
const eventDetail = source("app/events/[slug]/page.tsx");
const eventData = source("lib/events.ts");
const communityData = source("lib/community-stories.ts");
const travelKnowledge = source("lib/travel-knowledge.ts");

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
assert.match(searchPage, /value: "events"/);
assert.match(searchPage, /getUpcomingEvents\(\)/);
assert.match(searchPage, /type: "event"/);
assert.match(searchPage, /EventResultCard/);
assert.match(searchPage, /href=\{`\/events\/\$\{event\.slug\}`\}/);

assert.match(searchPage, /value: "community"/);
assert.match(searchPage, /COMMUNITY_STORIES/);
assert.match(searchPage, /type: "community"/);
assert.match(searchPage, /CommunityResultCard/);
assert.match(searchPage, /href=\{`\/community\/\$\{story\.slug\}`\}/);
assert.match(searchPage, /Community field note/);
assert.match(searchPage, /selectedKind === "community"/);
assert.match(searchPage, /params\.set\("lens", "places"\)/);

assert.match(travelKnowledge, /COMMUNITY_STORIES/);
assert.match(travelKnowledge, /COMMUNITY_BY_PLACE/);
assert.match(travelKnowledge, /Community field note:/);
assert.match(travelKnowledge, /community field note/);
for (const placeName of ["Charlotte Amalie", "Cruz Bay", "Christiansted"]) {
  assert.ok(communityData.includes(placeName), `Community dataset missing ${placeName}`);
}

assert.match(eventsPage, /Events · verified sources/);
assert.match(eventsPage, /getUpcomingEvents\(\)/);
assert.match(eventsPage, /Official Visit USVI calendar/);
assert.match(eventsPage, /EVENT_CATEGORY_LABELS/);
assert.match(eventsPage, /EVENT_ISLAND_LABELS/);
assert.match(eventsPage, /secondaryHref="\/trips"/);
assert.match(eventsPage, /Plan with Concierge/);

assert.match(eventDetail, /generateStaticParams/);
assert.match(eventDetail, /getEventBySlug/);
assert.match(eventDetail, /AddToJourneyButton/);
assert.match(eventDetail, /kind: "event"/);
assert.match(eventDetail, /Open Living Map/);
assert.match(eventDetail, /Open official listing/);
assert.match(eventDetail, /secondaryHref="\/trips"/);
assert.match(eventDetail, /Plan with Concierge/);

for (const sourceToken of [
  "St. Thomas Restaurant Week",
  "Victory Run/Walk",
  "Wall2Wall Sprint Triathlon & Try-A-Tri",
  "National Public Lands Day",
  "Virgin Islands–Puerto Rico Friendship Day",
  "Paradise Jam",
  "Crucian Christmas Festival",
]) {
  assert.ok(eventData.includes(sourceToken), `Events dataset missing ${sourceToken}`);
}
assert.match(eventData, /sourceUrl:/);
assert.match(eventData, /verifiedAt:/);
assert.match(eventData, /getUpcomingEvents/);

assert.match(directoryCard, /GooglePlacePhoto/);
assert.match(directoryCard, /SavePlaceButton/);
assert.match(directoryCard, /AddToJourneyButton/);
assert.match(directoryCard, /label="Map"/);
assert.match(directoryCard, /label="Ride"/);
assert.match(directoryCard, /label="Ask VI"/);
assert.match(directoryCard, /Open the story/);

console.log("VI Guide shared Search, Community, Concierge grounding, and Events discovery contracts passed.");

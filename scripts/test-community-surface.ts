import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { COMMUNITY_STORIES } from "@/lib/community-stories";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const home = source("app/page.tsx");
const homeLiveStatus = source("components/home/home-live-status.tsx");
const hub = source("app/community/page.tsx");
const detail = source("app/community/[postId]/page.tsx");

assert.ok(COMMUNITY_STORIES.length >= 3, "Community should ship with published field notes");
assert.deepEqual(
  new Set(COMMUNITY_STORIES.map((story) => story.island)),
  new Set(["stt", "stj", "stx"]),
  "Community should begin with at least one field note for each main island",
);

for (const story of COMMUNITY_STORIES) {
  assert.ok(story.sourceUrl.startsWith("https://"), `${story.slug} should have an authoritative source URL`);
  assert.ok(story.mapHref.startsWith(`/map?island=${story.island}`), `${story.slug} should preserve island context in its map handoff`);
  assert.ok(story.paragraphs.length >= 3, `${story.slug} should contain substantive traveler context`);
}

assert.match(homeLiveStatus, /href: "\/community"/);
assert.match(homeLiveStatus, /Local field notes/);
assert.match(homeLiveStatus, /Know the place before you go/);
assert.match(homeLiveStatus, /tag: "Context"/);
assert.doesNotMatch(homeLiveStatus, /Warm, breezy/);
assert.doesNotMatch(homeLiveStatus, /label: "Island outlook"/);
assert.match(home, /Search beaches, stays, food, events, history, local stories…/);

assert.match(hub, /COMMUNITY_STORIES\.map/);
assert.match(hub, /Published field notes/);
assert.match(hub, /Read field notes/);
assert.match(hub, /Local publishing is live/);
assert.doesNotMatch(hub, /Local publishing is opening deliberately/);

assert.match(detail, /getCommunityStory/);
assert.match(detail, /generateStaticParams/);
assert.match(detail, /notFound\(\)/);
assert.match(detail, /AddToJourneyButton/);
assert.match(detail, /Open Living Map/);
assert.match(detail, /Ask Concierge/);
assert.match(detail, /My Trip/);
assert.match(detail, /Open source/);
assert.doesNotMatch(detail, /This story is not published yet/);

console.log("VI Guide Community published field-note contracts passed.");

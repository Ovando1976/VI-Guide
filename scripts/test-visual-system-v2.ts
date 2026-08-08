import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const layout = source("app/layout.tsx");
const homePage = source("app/page.tsx");
const homeConcierge = source("components/home/home-concierge-hub.tsx");
const mapPage = source("app/map/page.tsx");
const tripsPage = source("app/trips/page.tsx");
const conciergePage = source("app/concierge/page.tsx");
const communityPage = source("app/community/page.tsx");
const communityPostPage = source("app/community/[postId]/page.tsx");
const visualLayer = source("app/experience-system.css");
const header = source("components/brand/vi-public-header.tsx");
const navigation = source("components/app-navigation.tsx");
const brand = source("components/brand/vi-brand-mark.tsx");
const mapWorkspace = source("components/explorer/territory-map-workspace.tsx");
const mapStoryRail = source("components/explorer/territory-intelligence-rail.tsx");
const directoryCard = source("components/directory/directory-card.tsx");
const detailShell = source("components/place/premium-detail-shell.tsx");
const placeActionBar = source("components/place/place-action-bar.tsx");

assert.match(layout, /experience-system\.css/);
assert.match(layout, /themeColor: "#032f2d"/);

assert.match(homePage, /QUICK\.map\(\(\{ label, detail, href, image, alt, icon: Icon \}\)/);
assert.match(homePage, /src=\{image\}/);
assert.match(homePage, /alt=\{alt\}/);
assert.match(homeConcierge, /PROMPTS\.map\(\(\{ label, href, image, alt, icon: Icon \}\)/);
assert.match(homeConcierge, /One-tap idea/);
assert.match(homeConcierge, /king-christian-hotel\.jpg/);

assert.match(mapPage, /ViPublicHeader/);
assert.match(mapPage, /VI Guide Living Map/);
assert.match(mapPage, /connected day/);
assert.match(mapPage, /Open trip/);
assert.match(mapPage, /Ask Concierge/);

assert.match(mapWorkspace, /territory-map-stage/);
assert.match(mapWorkspace, /Explore the island, not a dashboard/);
assert.match(mapWorkspace, /Choose a map lens/);
assert.match(mapWorkspace, /Select a marker to turn the map into a trip decision/);
assert.match(mapWorkspace, /Browse the island by estate/);

assert.match(mapStoryRail, /territory-story-rail/);
assert.match(mapStoryRail, /Local story/);
assert.match(mapStoryRail, /Your movement line/);
assert.match(mapStoryRail, /Nearby island areas/);

assert.match(directoryCard, /directory-story-card/);
assert.match(directoryCard, /VI Guide verified/);
assert.match(directoryCard, /Open the story/);
assert.match(directoryCard, /SavePlaceButton/);
assert.match(directoryCard, /AddToJourneyButton/);

assert.match(detailShell, /place-story-page/);
assert.match(detailShell, /place-story-hero/);
assert.match(detailShell, /PlaceActionBar/);
assert.match(placeActionBar, /place-decision-bar/);
assert.match(placeActionBar, /Decide what happens next/);
assert.match(placeActionBar, /Ask Concierge/);
assert.match(placeActionBar, /Book \/ request/);

assert.match(tripsPage, /Your island story/);
assert.match(tripsPage, /Readiness protected/);
assert.match(tripsPage, /Map connected/);
assert.match(tripsPage, /Concierge aware/);

assert.match(conciergePage, /VI Concierge intelligence/);
assert.match(conciergePage, /Ask once/);
assert.match(conciergePage, /Open Living Map/);
assert.match(conciergePage, /concierge-workspace/);

assert.match(communityPage, /Community · local context/);
assert.match(communityPage, /Know the islands/);
assert.match(communityPage, /Not another feed\. A local intelligence layer\./);
assert.match(communityPage, /href="\/map"/);
assert.match(communityPage, /ISLAND_STORIES\.map/);
assert.match(communityPostPage, /This story is not published yet\./);
assert.match(communityPostPage, /ViPublicHeader/);
assert.match(communityPostPage, /href="\/map"/);

assert.match(visualLayer, /developer-oriented workflow masthead/);
assert.match(visualLayer, /map-customer-page/);
assert.match(visualLayer, /concierge-product-page/);
assert.match(visualLayer, /territory-map-stage/);
assert.match(visualLayer, /territory-story-rail/);
assert.match(visualLayer, /place-story-hero/);

assert.match(header, /Virgin Islands travel OS/);
assert.match(navigation, /app-nav__item--map/);
assert.match(brand, /vi-brand-mark/);

console.log("VI Guide visible traveler visual-system contracts passed.");

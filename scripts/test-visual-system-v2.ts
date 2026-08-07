import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const layout = source("app/layout.tsx");
const mapPage = source("app/map/page.tsx");
const tripsPage = source("app/trips/page.tsx");
const conciergePage = source("app/concierge/page.tsx");
const visualLayer = source("app/experience-system.css");
const header = source("components/brand/vi-public-header.tsx");
const navigation = source("components/app-navigation.tsx");
const brand = source("components/brand/vi-brand-mark.tsx");

assert.match(layout, /experience-system\.css/);
assert.match(layout, /themeColor: "#032f2d"/);

assert.match(mapPage, /ViPublicHeader/);
assert.match(mapPage, /VI Guide Living Map/);
assert.match(mapPage, /connected day/);
assert.match(mapPage, /Open trip/);
assert.match(mapPage, /Ask Concierge/);

assert.match(tripsPage, /Your island story/);
assert.match(tripsPage, /Readiness protected/);
assert.match(tripsPage, /Map connected/);
assert.match(tripsPage, /Concierge aware/);

assert.match(conciergePage, /VI Concierge intelligence/);
assert.match(conciergePage, /Ask once/);
assert.match(conciergePage, /Open Living Map/);
assert.match(conciergePage, /concierge-workspace/);

assert.match(visualLayer, /developer-oriented workflow masthead/);
assert.match(visualLayer, /map-customer-page/);
assert.match(visualLayer, /concierge-product-page/);

assert.match(header, /Virgin Islands travel OS/);
assert.match(navigation, /app-nav__item--map/);
assert.match(brand, /vi-brand-mark/);

console.log("VI Guide visible traveler visual-system contracts passed.");

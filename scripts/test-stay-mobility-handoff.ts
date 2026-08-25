import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stayPage = fs.readFileSync(
  path.join(root, "app/accommodations/[slug]/page.tsx"),
  "utf8",
);
const stayActionCard = fs.readFileSync(
  path.join(root, "components/stay-action-card.tsx"),
  "utf8",
);
const directoryDetail = fs.readFileSync(
  path.join(root, "components/directory/directory-detail-screen.tsx"),
  "utf8",
);
const placeActionBar = fs.readFileSync(
  path.join(root, "components/place/place-action-bar.tsx"),
  "utf8",
);
const rideLinks = fs.readFileSync(
  path.join(root, "lib/mobility/ride-links.ts"),
  "utf8",
);
const mobilityScreen = fs.readFileSync(
  path.join(root, "components/mobility-booking-screen.tsx"),
  "utf8",
);
const accommodationSearch = fs.readFileSync(
  path.join(root, "lib/accommodations/search.ts"),
  "utf8",
);
const verifiedEstateMappings = fs.readFileSync(
  path.join(root, "lib/accommodations/verified-estate-geoids.ts"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Stay mobility handoff contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ['new URLSearchParams({\n    island: item.island,\n    destination: item.name,', "stay detail carries island and property name"],
  ['source: "stay"', "stay detail explicitly identifies the Stays handoff source"],
  ['rideParams.set("to", item.estateGeoid)', "stay detail uses Mobility's canonical destination geoid key"],
  ['rideParams.set("toLat", String(item.lat))', "stay detail preserves latitude as traveler context"],
  ['rideParams.set("toLng", String(item.lng))', "stay detail preserves longitude as traveler context"],
  ['rideHref={rideHref}', "stay action card receives the resolved property ride handoff"],
  ['bookingHref: listingHref', "journey stop booking continuity remains intact"],
  ['PremiumDetailShell', "stay detail remains in the shared premium detail shell"],
] as const) {
  expectSource(stayPage, value, label);
}

for (const [value, label] of [
  ['rideHref: string', "stay action card requires an explicit ride destination"],
  ['href={rideHref}', "airport or ferry ride CTA uses the property-specific handoff"],
  ['kind: "accommodation"', "stay booking request type remains unchanged"],
  ['return `/book?${params.toString()}`', "stay booking request continues through the shared booking flow"],
  ['Plan with concierge', "Concierge planning continuity remains available"],
] as const) {
  expectSource(stayActionCard, value, label);
}

for (const [value, label] of [
  ['if (item.estateGeoid) params.set("to", item.estateGeoid)', "place and beach details start with the exact canonical destination GEOID"],
  ['const mobilityRideParams = rideHref?.startsWith("/mobility")', "place action bar reads the exact incoming Mobility destination context"],
  ['estateGeoid: mobilityRideParams?.get("to")', "place action bar preserves the canonical destination GEOID when rebuilding the ride link"],
] as const) {
  expectSource(value.startsWith("if (item.estateGeoid)") ? directoryDetail : placeActionBar, value, label);
}
for (const [value, label] of [
  ['resolveMobilityRideSource(', "shared detail actions resolve a truthful Mobility source"],
  ['incoming === "stay"', "shared detail actions preserve explicit stay attribution"],
  ['incoming === "historic"', "shared detail actions preserve explicit heritage attribution"],
  ['normalized === "stay" || normalized === "accommodation"', "stay and accommodation detail kinds map to Stays"],
  ['normalized === "historic" || normalized === "heritage"', "historic and heritage detail kinds map to Heritage"],
  ['source: mobilityRideSource', "rebuilt detail ride links carry the resolved source"],
] as const) {
  expectSource(placeActionBar, value, label);
}
expectSource(
  rideLinks,
  'if (target.estateGeoid?.trim()) params.set("to", target.estateGeoid.trim().slice(0, 180))',
  "shared ride-link builder forwards canonical estate GEOIDs to Mobility",
);

for (const [value, label] of [
  ['searchParams.get("to")', "Mobility still consumes the canonical destination geoid key"],
  ['searchParams.get("destinationName") ?? searchParams.get("destination")', "Mobility still accepts an exact official estate-name handoff"],
  ['namedMatches.length === 1', "Mobility requires an unambiguous exact official estate-name match"],
  ['case "living-map":', "Mobility identifies Living Map handoffs"],
  ['return "Destination from Living Map"', "Mobility labels Living Map destinations accurately"],
  ['case "beach":', "Mobility identifies beach handoffs"],
  ['return "Destination from Beaches"', "Mobility labels beach destinations accurately"],
  ['case "place":', "Mobility identifies Explore/place handoffs"],
  ['return "Destination from Explore"', "Mobility labels Explore destinations accurately"],
  ['case "stay":', "Mobility identifies stay handoffs"],
  ['return "Destination from Stays"', "Mobility labels stay destinations accurately"],
  ['case "historic":', "Mobility identifies heritage handoffs"],
  ['return "Destination from Heritage"', "Mobility labels heritage destinations accurately"],
  ['case "planner":', "Mobility identifies planner handoffs"],
  ['return "Destination from My Trip"', "Mobility labels planner destinations as My Trip"],
  ['case "concierge":', "Mobility recognizes explicit Concierge handoffs"],
  ['return "Destination from VI Concierge"', "Mobility only claims Concierge when the source says Concierge"],
  ['return hasTrip ? "Destination from My Trip" : "Destination selected for your ride"', "Mobility uses a truthful neutral fallback and honors trip continuity"],
  ['secondaryHref="/trips"', "Mobility keeps My Trip in the persistent header"],
  ['secondaryLabel="My Trip"', "Mobility labels the persistent trip action correctly"],
] as const) {
  expectSource(mobilityScreen, value, label);
}

for (const [value, label] of [
  ['queryCoordinate(', "Mobility must not resolve tariff estates from coordinates"],
  ['nearestEstate(', "Mobility must not select the nearest tariff estate"],
  ['estateName.includes(requestedName)', "Mobility must not accept partial estate-name matches"],
  ['requestedName.includes(estateName)', "Mobility must not accept reverse partial estate-name matches"],
] as const) {
  if (mobilityScreen.includes(value)) {
    throw new Error(`Stay mobility handoff contract failed: ${label}`);
  }
}

expectSource(accommodationSearch, "verifiedAccommodationEstateGeoid", "accommodation search applies verified estate mappings");
for (const [value, label] of [
  ['"Secret Harbour Beach Resort"', "Secret Harbour mapping is explicit"],
  ['"Elysian Beach Resort"', "Elysian mapping is explicit"],
  ['"Margaritaville Vacation Club - St. Thomas"', "Margaritaville mapping is explicit"],
  ['"Sapphire Beach Resort and Marina"', "Sapphire mapping is explicit"],
  ['estateGeoid: "7803058400"', "Nazareth canonical GEOID is pinned"],
  ['estateGeoid: "7803072500"', "Smith Bay canonical GEOID is pinned"],
] as const) {
  expectSource(verifiedEstateMappings, value, label);
}
for (const unresolved of ["Charlotte Amalie", "Lindbergh Bay", "Magens Bay", "East End", "Estate Bakkeroe", "Estate Contant", "Estate Shoys"]) {
  if (verifiedEstateMappings.includes(`\"${unresolved}\"`)) {
    throw new Error(`Stay mobility handoff contract failed: unresolved mapping was auto-approved: ${unresolved}`);
  }
}

if (stayPage.includes('rideParams.set("toGeoid"')) {
  throw new Error("Stay mobility handoff contract failed: obsolete toGeoid parameter returned");
}

console.log("USVI Explorer stay/place-to-Mobility handoff contracts passed.");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const heritageDetail = fs.readFileSync(
  path.join(root, "app/historic/[slug]/page.tsx"),
  "utf8",
);
const mobilityScreen = fs.readFileSync(
  path.join(root, "components/mobility-booking-screen.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Heritage mobility handoff contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ['new URLSearchParams({\n    island: site.island,\n    destination: site.name,', "heritage detail carries island and destination name"],
  ['rideParams.set("to", site.estateGeoid)', "heritage detail uses Mobility's canonical destination geoid key"],
  ['rideParams.set("toLat", String(site.lat))', "heritage detail preserves latitude as traveler context"],
  ['rideParams.set("toLng", String(site.lng))', "heritage detail preserves longitude as traveler context"],
  ['PremiumDetailShell', "heritage detail remains in the premium traveler shell"],
  ['context=heritage', "heritage Concierge context remains intact"],
  ['kind: "historic"', "historic journey-stop identity remains intact"],
  ['mapHref,\n        rideHref,', "map and Mobility actions remain connected"],
] as const) {
  expectSource(heritageDetail, value, label);
}

for (const [value, label] of [
  ['searchParams.get("to")', "Mobility consumes canonical destination geoid"],
  ['searchParams.get("destinationName") ?? searchParams.get("destination")', "Mobility accepts an exact official estate-name handoff"],
  ['namedMatches.length === 1', "Mobility requires an unambiguous exact official estate-name match"],
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
    throw new Error(`Heritage mobility handoff contract failed: ${label}`);
  }
}

if (heritageDetail.includes('rideParams.set("toGeoid"')) {
  throw new Error("Heritage mobility handoff contract failed: obsolete toGeoid parameter returned");
}

console.log("USVI Explorer heritage-to-Mobility handoff contracts passed.");

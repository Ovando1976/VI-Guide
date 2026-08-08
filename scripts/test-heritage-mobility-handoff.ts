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
  ['rideParams.set("toLat", String(site.lat))', "heritage detail keeps latitude fallback"],
  ['rideParams.set("toLng", String(site.lng))', "heritage detail keeps longitude fallback"],
  ['PremiumDetailShell', "heritage detail remains in the premium traveler shell"],
  ['context=heritage', "heritage Concierge context remains intact"],
  ['kind: "historic"', "historic journey-stop identity remains intact"],
  ['mapHref,\n        rideHref,', "map and Mobility actions remain connected"],
] as const) {
  expectSource(heritageDetail, value, label);
}

for (const [value, label] of [
  ['searchParams.get("to")', "Mobility consumes canonical destination geoid"],
  ['searchParams.get("destinationName") ?? searchParams.get("destination")', "Mobility accepts destination-name fallback"],
  ['queryCoordinate(searchParams, "toLat")', "Mobility accepts latitude fallback"],
  ['queryCoordinate(searchParams, "toLng")', "Mobility accepts longitude fallback"],
] as const) {
  expectSource(mobilityScreen, value, label);
}

if (heritageDetail.includes('rideParams.set("toGeoid"')) {
  throw new Error("Heritage mobility handoff contract failed: obsolete toGeoid parameter returned");
}

console.log("VI Guide heritage-to-Mobility handoff contracts passed.");

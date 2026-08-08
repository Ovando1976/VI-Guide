import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/fishing/page.tsx"), "utf8");
const explorer = fs.readFileSync(
  path.join(root, "components/fishing/fishing-explorer.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Fishing shared shell contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "Fishing uses shared VI Guide public chrome"],
  ['actionHref="/map"', "shared header keeps Living Map handoff"],
  ['actionLabel="Open Living Map"', "shared header labels the map action clearly"],
  ['secondaryHref="/concierge?prompt=', "shared header keeps Concierge handoff"],
  ["FishingExplorer", "existing Fishing explorer remains mounted"],
] as const) {
  expectSource(page, value, label);
}

for (const [value, label] of [
  ["FISHING_DISCLAIMER", "current-regulations warning remains visible"],
  ["FISHING_SPECIES", "species catalog remains intact"],
  ['href="/map"', "existing in-explorer Map action remains intact"],
  ['href="/map?concierge=open"', "existing in-explorer Concierge/map action remains intact"],
  ["Check current regulations before every trip", "regulatory caution remains explicit"],
  ["Protected", "protected-species status remains visible"],
  ["Rules apply", "restricted-species status remains visible"],
] as const) {
  expectSource(explorer, value, label);
}

console.log("VI Guide Fishing shared-shell contracts passed.");

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
  ['secondaryLabel="Ask VI Concierge"', "shared header owns the Concierge action label"],
  ["FishingExplorer", "existing Fishing explorer remains mounted"],
] as const) {
  expectSource(page, value, label);
}

for (const [value, label] of [
  ["FISHING_DISCLAIMER", "current-regulations warning remains visible"],
  ["FISHING_SPECIES", "species catalog remains intact"],
  ["U.S. Virgin Islands Fisher Guide", "Fishing hero keeps its domain identity"],
  ["Check current regulations before every trip", "regulatory caution remains explicit"],
  ["Protected", "protected-species status remains visible"],
  ["Rules apply", "restricted-species status remains visible"],
  ["Territory coverage", "territory scope remains visible"],
] as const) {
  expectSource(explorer, value, label);
}

for (const [value, label] of [
  ['href="/map"', "Fishing explorer must not duplicate the shared Map action"],
  ['href="/map?concierge=open"', "Fishing explorer must not keep the stale map-query Concierge action"],
  ['from "next/link"', "Fishing explorer must not retain navigation-only Link chrome"],
] as const) {
  if (explorer.includes(value)) {
    throw new Error(`Fishing shared shell contract failed: ${label}`);
  }
}

console.log("VI Guide Fishing shared-shell contracts passed.");

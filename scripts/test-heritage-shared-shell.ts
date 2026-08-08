import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layout = fs.readFileSync(path.join(root, "app/heritage/layout.tsx"), "utf8");
const hub = fs.readFileSync(path.join(root, "app/heritage/page.tsx"), "utf8");
const governors = fs.readFileSync(path.join(root, "app/heritage/governors/page.tsx"), "utf8");
const timeline = fs.readFileSync(path.join(root, "app/heritage/timeline/page.tsx"), "utf8");
const library = fs.readFileSync(
  path.join(root, "app/heritage/library-of-congress/page.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Heritage shared shell contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "Heritage family uses shared VI Guide public chrome"],
  ['actionHref="/map?filter=history"', "shared header keeps Heritage Map handoff"],
  ['secondaryHref="/concierge?context=heritage"', "shared header keeps Heritage Guide handoff"],
  ['secondaryLabel="Ask Heritage Guide"', "shared header exposes Heritage Guide clearly"],
] as const) {
  expectSource(layout, value, label);
}

for (const [source, value, label] of [
  [hub, 'getTravelKnowledge("historic")', "Heritage hub still uses the historic travel catalog"],
  [hub, "HeritageExplorer", "Heritage hub explorer remains intact"],
  [hub, "HeritageConcierge", "Heritage hub Concierge remains intact"],
  [governors, "GovernorTimelineExplorer", "Governors explorer remains intact"],
  [governors, "GovernorAnchorBridge", "Governor anchor/search bridge remains intact"],
  [timeline, "TerritoryTimelineExplorer", "territory timeline remains intact"],
  [library, "/api/heritage/library-of-congress", "Library of Congress live collection endpoint remains intact"],
  [library, "MAX_COLLECTION_PAGES", "Library of Congress complete collection loading remains intact"],
] as const) {
  expectSource(source, value, label);
}

console.log("VI Guide Heritage shared-shell contracts passed.");

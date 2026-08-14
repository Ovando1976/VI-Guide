import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layout = fs.readFileSync(path.join(root, "app/intelligence/layout.tsx"), "utf8");
const hub = fs.readFileSync(path.join(root, "app/intelligence/page.tsx"), "utf8");
const stThomas = fs.readFileSync(
  path.join(root, "app/intelligence/st-thomas/page.tsx"),
  "utf8",
);
const stJohn = fs.readFileSync(
  path.join(root, "app/intelligence/st-john/page.tsx"),
  "utf8",
);
const stCroix = fs.readFileSync(
  path.join(root, "app/intelligence/st-croix/page.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Intelligence shared shell contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "Intelligence family uses shared USVI Explorer public chrome"],
  ['actionHref="/map"', "shared header keeps Living Map handoff"],
  ['actionLabel="Open Living Map"', "shared header labels the Living Map action"],
  ['secondaryHref="/concierge?prompt=', "shared header keeps VI Concierge handoff"],
] as const) {
  expectSource(layout, value, label);
}

for (const [source, value, label] of [
  [hub, 'href: "/heritage"', "territory intelligence keeps Heritage module"],
  [hub, 'href: "/fishing"', "territory intelligence keeps Fishing module"],
  [hub, 'href: "/search"', "territory intelligence keeps Search module"],
  [hub, 'href: "/concierge"', "territory intelligence keeps Concierge module"],
  [stThomas, 'href: "/mobility?island=stt"', "St. Thomas keeps Mobility handoff"],
  [stThomas, 'href="/planner?island=stt"', "St. Thomas keeps Planner handoff"],
  [stJohn, 'href: "/mobility?island=stj"', "St. John keeps Mobility handoff"],
  [stJohn, 'href="/planner?island=stj"', "St. John keeps Planner handoff"],
  [stCroix, 'href: "/mobility?island=stx"', "St. Croix keeps Mobility handoff"],
  [stCroix, 'href="/planner?island=stx"', "St. Croix keeps Planner handoff"],
  [stCroix, 'href: "/fishing?island=stx"', "St. Croix keeps fishing intelligence"],
] as const) {
  expectSource(source, value, label);
}

console.log("USVI Explorer Intelligence shared-shell contracts passed.");

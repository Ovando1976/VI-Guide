import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { geographicIndexItems } from "../src/data/core/geographicIndex";

const letter = (process.argv[2] || "A").toUpperCase();

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

const rows = geographicIndexItems
  .filter((item) => clean(item.name).toUpperCase().startsWith(letter))
  .sort((a, b) => clean(a.name).localeCompare(clean(b.name)));

const output = [
  `# Geographic Cleanup — ${letter}`,
  "",
  `Records: ${rows.length}`,
  "",
  "| Name | Source | Type | Island | Coord Status | ID | Notes |",
"|---|---|---|---|---|---|---|",
...rows.map((item) =>
  `| ${item.name} | ${item.source} | ${item.featureType || item.type || ""} | ${
    item.island || "missing"
  } | ${item.coordinateStatus || "missing"} | \`${item.id}\` | ${
    item.coordinateNotes || item.canonicalNotes || ""
  } |`,
),
].join("\n");

const path = resolve(`generated/geographic-cleanup-${letter}.md`);
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, output);

console.log(`Wrote ${path}`);
console.log(`Records beginning with ${letter}: ${rows.length}`);
import fs from "node:fs";
import path from "node:path";
import { generatedEstateArchiveTargets } from "../../src/data/historyGraph/extractionTargets/generatedEstateArchiveTargets.ts";

const OUT_DIR = "src/data/historyGraph/extractionBatches";

function cleanEstateName(target) {
  return String(target.estateName ?? "")
    .replace(/^Estate\s+/i, "")
    .trim();
}

function firstLetter(target) {
  return cleanEstateName(target).charAt(0).toUpperCase();
}

const batches = [
  ["batch-001-priority-st-thomas", (t) => t.island === "st_thomas"],
  ["batch-002-priority-st-john", (t) => t.island === "st_john"],
  ["batch-003-st-croix-a-c", (t) => t.island === "st_croix" && /^[A-C]$/.test(firstLetter(t))],
  ["batch-004-st-croix-d-h", (t) => t.island === "st_croix" && /^[D-H]$/.test(firstLetter(t))],
  ["batch-005-st-croix-i-p", (t) => t.island === "st_croix" && /^[I-P]$/.test(firstLetter(t))],
  ["batch-006-st-croix-r-z", (t) => t.island === "st_croix" && /^[R-Z]$/.test(firstLetter(t))],
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [name, filter] of batches) {
  const targets = generatedEstateArchiveTargets.filter(filter);

  const exportName = name.replaceAll("-", "_");

  const body = `// Auto-generated extraction batch.
// Each target must receive: owner_chain, aliases, quarter, acreage, boundaries, transfers, citations, confidence, modern continuity notes.

export const ${exportName} = ${JSON.stringify(targets, null, 2)} as const;
`;

  fs.writeFileSync(path.join(OUT_DIR, `${name}.ts`), body);
  console.log(`${name}: ${targets.length}`);
}

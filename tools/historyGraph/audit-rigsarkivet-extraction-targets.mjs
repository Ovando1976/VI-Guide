import { rigsarkivetExtractionTargets } from "../../src/data/historyGraph/index.ts";

const targets = [...rigsarkivetExtractionTargets].sort(
  (a, b) => a.priority - b.priority || a.estateName.localeCompare(b.estateName),
);

console.log("Rigsarkivet extraction target registry");
console.log("======================================");
console.log(`Targets: ${targets.length}`);

for (const target of targets) {
  console.log(`\n#${target.priority} ${target.estateName}`);
  console.log(`Status: ${target.status}`);
  console.log(`Island: ${target.island}`);
  console.log(`Series: ${target.series}`);
  if (target.dateRange) console.log(`Date range: ${target.dateRange}`);
  console.log(`Search names: ${target.searchNames.join(", ")}`);
  console.log(`Goal: ${target.extractionGoal}`);
  console.log(`Expected fields: ${target.expectedFields.join(", ")}`);
  console.log(`Notes: ${target.notes}`);
}

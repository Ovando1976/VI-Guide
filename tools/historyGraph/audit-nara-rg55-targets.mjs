import { naraRg55ExtractionTargets } from "../../src/data/historyGraph/index.ts";

const targets = naraRg55ExtractionTargets.filter(Boolean);

console.log("NARA RG 55 extraction target registry");
console.log("=====================================");
console.log(`Targets: ${targets.length}`);

for (const target of targets) {
  console.log(`\n#${target.priority} ${target.estateName}`);
  console.log(`Status: ${target.status}`);
  console.log(`Entry: ${target.entry}`);
  if (target.box) console.log(`Box: ${target.box}`);
  console.log(`Series: ${target.series}`);
  console.log(`Goal: ${target.goal}`);
  console.log(`Expected fields: ${target.expectedFields.join(", ")}`);
}

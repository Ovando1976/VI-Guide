import { usviRecorderExtractionTargets } from "../../src/data/historyGraph/index.ts";

const targets = usviRecorderExtractionTargets.filter(Boolean);
const workflow = ["open", "in_progress", "extracted", "verified", "blocked"];

console.log("USVI Recorder status workflow audit");
console.log("===================================");
console.log(`Targets: ${targets.length}`);

console.log("\nBy status:");
for (const status of workflow) {
  console.log(`- ${status}: ${targets.filter((t) => t.status === status).length}`);
}

console.log("\nWorkflow board:");
for (const status of workflow) {
  const items = targets.filter((t) => t.status === status);
  console.log(`\n${status.toUpperCase()} (${items.length})`);
  for (const target of items) {
    console.log(`#${target.priority} ${target.estateName}`);
    console.log(`  Goal: ${target.goal}`);
  }
}

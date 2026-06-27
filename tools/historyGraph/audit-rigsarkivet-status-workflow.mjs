import { rigsarkivetExtractionTargets } from "../../src/data/historyGraph/index.ts";

const targets = rigsarkivetExtractionTargets.filter(Boolean);

const workflow = ["open", "in_progress", "extracted", "verified", "blocked"];
const priorities = [1, 2, 3, 4, 5];

console.log("Rigsarkivet status workflow audit");
console.log("=================================");
console.log(`Targets: ${targets.length}`);

console.log("\nBy status:");
for (const status of workflow) {
  const items = targets.filter((target) => target.status === status);
  console.log(`- ${status}: ${items.length}`);
}

console.log("\nBy priority and status:");
for (const priority of priorities) {
  const items = targets.filter((target) => target.priority === priority);
  if (!items.length) continue;

  console.log(`\nPriority ${priority}: ${items.length}`);
  for (const status of workflow) {
    const count = items.filter((target) => target.status === status).length;
    if (count) console.log(`- ${status}: ${count}`);
  }
}

console.log("\nWorkflow board:");
for (const status of workflow) {
  const items = targets.filter((target) => target.status === status);
  console.log(`\n${status.toUpperCase()} (${items.length})`);
  for (const target of items.sort((a, b) => a.priority - b.priority)) {
    console.log(`#${target.priority} ${target.estateName}`);
    console.log(`  Goal: ${target.extractionGoal}`);
  }
}

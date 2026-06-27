import { naraRg55ExtractionTargets } from "../../src/data/historyGraph/index.ts";

const targets = naraRg55ExtractionTargets.filter(Boolean);
const workflow = ["open", "in_progress", "extracted", "verified", "blocked"];
const priorities = [1, 2, 3, 4, 5];

console.log("NARA RG 55 status workflow audit");
console.log("=================================");
console.log(`Targets: ${targets.length}`);

console.log("\nBy status:");
for (const status of workflow) {
  console.log(`- ${status}: ${targets.filter((t) => t.status === status).length}`);
}

console.log("\nBy priority and status:");
for (const priority of priorities) {
  const items = targets.filter((t) => t.priority === priority);
  if (!items.length) continue;

  console.log(`\nPriority ${priority}: ${items.length}`);
  for (const status of workflow) {
    const count = items.filter((t) => t.status === status).length;
    if (count) console.log(`- ${status}: ${count}`);
  }
}

console.log("\nWorkflow board:");
for (const status of workflow) {
  const items = targets.filter((t) => t.status === status);
  console.log(`\n${status.toUpperCase()} (${items.length})`);
  for (const target of items) {
    console.log(`#${target.priority} ${target.estateName} | Entry ${target.entry} | Box ${target.box ?? "n/a"}`);
    console.log(`  Goal: ${target.goal}`);
  }
}

import { annasRetreatProbateTargets } from "../../../src/data/history/probate/index.ts";

console.log(`Anna's Retreat probate targets: ${annasRetreatProbateTargets.length}`);

for (const item of annasRetreatProbateTargets) {
  console.log(`\n${item.id} [${item.confidence}]`);
  console.log(`Office: ${item.office}`);
  console.log(`Date range: ${item.dateRange}`);
  console.log(`Families: ${item.familyNames.join(", ")}`);
  console.log(`People: ${item.personNames.join(", ")}`);
  console.log(`Estates: ${item.estates.join(", ")}`);
  console.log(`Goal: ${item.researchGoal}`);
}

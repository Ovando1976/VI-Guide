import { annasRetreatMatriklerTargets } from "../../../src/data/history/matrikler/index.ts";

console.log(`Anna's Retreat/Tutu Matrikler targets: ${annasRetreatMatriklerTargets.length}`);

for (const item of annasRetreatMatriklerTargets) {
  console.log(`\n${item.year} ${item.estateName} [${item.confidence}]`);
  console.log(`Quarter: ${item.quarter}`);
  console.log(`Historical names: ${item.historicalNames.join(", ")}`);
  console.log(`Owners: ${item.ownerNames.length ? item.ownerNames.join(", ") : "not extracted yet"}`);
  console.log(`Neighbors: ${item.neighboringEstates.join(", ")}`);
}

import { originalEstateOwnerMatches } from "../../src/data/history/estates/index.ts";

console.log(`Original estate owner matches: ${originalEstateOwnerMatches.length}`);

for (const item of originalEstateOwnerMatches) {
  console.log(`\n${item.currentEstateName} [${item.confidence}]`);
  console.log(`Island: ${item.island}`);
  console.log(`Historical names: ${item.historicalNames.join(", ")}`);
  console.log(`Earliest owners: ${item.earliestOwners.join(", ")}`);
}

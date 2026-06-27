import { estateFirstRecords } from "../../src/data/historyGraph/index.ts";

const records = estateFirstRecords.filter(Boolean);

console.log(`Estate-first records: ${records.length}`);

for (const estate of records) {
  console.log(`\n${estate.canonicalName} [${estate.evidenceStatus}]`);
  console.log(`Island: ${estate.island}`);
  console.log(`Names: ${estate.historicalNames.join(", ")}`);
  console.log(`Owner events: ${estate.ownerChain.length}`);
  console.log(`Next pulls: ${estate.nextPulls.length}`);
}

import { batchOneEstateEvidence } from "../../src/data/history/estates/index.ts";

console.log(`Batch 1 evidence items: ${batchOneEstateEvidence.length}`);

const byConfidence = {};
for (const item of batchOneEstateEvidence) {
  byConfidence[item.confidence] = (byConfidence[item.confidence] || 0) + 1;
}

console.log("Confidence:", byConfidence);

for (const item of batchOneEstateEvidence) {
  console.log(`\n${item.modernEstateName} [${item.confidence}]`);
  console.log(`Claim: ${item.claim}`);
  console.log(`Historical names: ${item.historicalNames.join(", ")}`);
  console.log(`People: ${item.people.length ? item.people.join(", ") : "none yet"}`);
}

import { hammerFarmEvidence } from "../../src/data/history/estates/index.ts";

console.log(`Hammer Farm evidence items: ${hammerFarmEvidence.length}`);

for (const item of hammerFarmEvidence) {
  console.log(`\n${item.modernEstateName} [${item.confidence}]`);
  console.log(`Claim: ${item.claim}`);
  console.log(`Historical names: ${item.historicalNames.join(", ")}`);
  console.log(`People: ${item.people.length ? item.people.join(", ") : "none yet"}`);
  console.log(`Source: ${item.sourceLabel}`);
}

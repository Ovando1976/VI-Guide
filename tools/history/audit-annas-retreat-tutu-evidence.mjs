import { annasRetreatTutuEvidence } from "../../src/data/history/estates/index.ts";

console.log(`Anna's Retreat / Tutu evidence items: ${annasRetreatTutuEvidence.length}`);

for (const item of annasRetreatTutuEvidence) {
  console.log(`\n${item.modernEstateName} [${item.confidence}]`);
  console.log(`Claim: ${item.claim}`);
  console.log(`Historical names: ${item.historicalNames.join(", ")}`);
  console.log(`People/clues: ${item.people.length ? item.people.join(", ") : "none yet"}`);
  console.log(`Source: ${item.sourceLabel}`);
}

import { batchOneEstateEvidence } from "../../src/data/history/estates/index.ts";

const promotable = batchOneEstateEvidence.filter((item) =>
  ["confirmed", "high"].includes(item.confidence) &&
  item.people.length > 0 &&
  item.modernMatches.length > 0
);

const unresolved = batchOneEstateEvidence.filter((item) => item.confidence === "unresolved");

console.log(`Promotable evidence items: ${promotable.length}`);
console.log(`Unresolved evidence items: ${unresolved.length}`);

console.log("\nPROMOTABLE:");
for (const item of promotable) {
  console.log(`- ${item.modernEstateName}: ${item.claim}`);
}

console.log("\nUNRESOLVED:");
for (const item of unresolved) {
  console.log(`- ${item.modernEstateName}: ${item.claim}`);
}

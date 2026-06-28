import { enrichedKnoxEarlyEstateLinks } from "../../src/data/history/generated/knoxEarlyEstateLinks.enriched.ts";

const linked = enrichedKnoxEarlyEstateLinks.filter((x) => x.modernEstateName);
const unresolved = enrichedKnoxEarlyEstateLinks.filter((x) => !x.modernEstateName);

console.log(`Enriched early estate links: ${enrichedKnoxEarlyEstateLinks.length}`);
console.log(`Linked: ${linked.length}`);
console.log(`Unresolved: ${unresolved.length}`);

console.log("\nLINKED:");
for (const item of linked) {
  console.log(`- ${item.colonistName}: ${item.originalEstateName} → ${item.modernEstateName} [${item.confidence}]`);
}

console.log("\nUNRESOLVED:");
for (const item of unresolved) {
  console.log(`- ${item.colonistName}: ${item.originalEstateName}`);
}

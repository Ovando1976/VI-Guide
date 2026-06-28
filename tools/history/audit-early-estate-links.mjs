import { knoxEarlyEstateLinks } from "../../src/data/history/generated/knoxEarlyEstateLinks.ts";

const linked = knoxEarlyEstateLinks.filter((x) => x.modernEstateName);
const unresolved = knoxEarlyEstateLinks.filter((x) => !x.modernEstateName);

console.log(`Early estate links: ${knoxEarlyEstateLinks.length}`);
console.log(`Linked to modern estate: ${linked.length}`);
console.log(`Unresolved historical-only: ${unresolved.length}`);

console.log("\nLINKED:");
for (const item of linked) {
  console.log(`- ${item.colonistName}: ${item.originalEstateName} → ${item.modernEstateName}`);
}

console.log("\nUNRESOLVED:");
for (const item of unresolved) {
  console.log(`- ${item.colonistName}: ${item.originalEstateName}`);
}

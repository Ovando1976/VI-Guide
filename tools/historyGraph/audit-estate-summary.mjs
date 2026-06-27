import { estateFirstRecords } from "../../src/data/historyGraph/index.ts";

const records = estateFirstRecords.filter(Boolean);

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

const byStatus = countBy(records, (item) => item.evidenceStatus);
const byIsland = countBy(records, (item) => item.island);

console.log("Estate-first summary audit");
console.log("==========================");
console.log(`Total records: ${records.length}`);

console.log("\nBy evidence status:");
for (const [status, count] of Object.entries(byStatus)) {
  console.log(`- ${status}: ${count}`);
}

console.log("\nBy island:");
for (const [island, count] of Object.entries(byIsland)) {
  console.log(`- ${island}: ${count}`);
}

console.log("\nBy island and status:");
for (const island of Object.keys(byIsland).sort()) {
  const islandRecords = records.filter((item) => item.island === island);
  const islandStatus = countBy(islandRecords, (item) => item.evidenceStatus);

  console.log(`\n${island}:`);
  for (const [status, count] of Object.entries(islandStatus)) {
    console.log(`- ${status}: ${count}`);
  }
}

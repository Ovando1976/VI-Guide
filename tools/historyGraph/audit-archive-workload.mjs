import { estateFirstRecords } from "../../src/data/historyGraph/index.ts";

const records = estateFirstRecords.filter(Boolean);
const workload = new Map();

for (const estate of records) {
  for (const pull of estate.nextPulls ?? []) {
    const archive = pull.archive ?? "unknown";
    const current = workload.get(archive) ?? {
      archive,
      count: 0,
      estates: new Set(),
    };

    current.count += 1;
    current.estates.add(estate.canonicalName);
    workload.set(archive, current);
  }
}

const rows = [...workload.values()].sort((a, b) => b.count - a.count);

console.log("Archive workload audit");
console.log("======================");
console.log(`Archives: ${rows.length}`);
console.log(`Total pulls: ${rows.reduce((sum, row) => sum + row.count, 0)}`);

for (const row of rows) {
  console.log(`\n${row.archive}`);
  console.log(`Pulls: ${row.count}`);
  console.log(`Estates: ${[...row.estates].sort().join(", ")}`);
}

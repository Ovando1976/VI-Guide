import { estateFirstRecords } from "../../src/data/historyGraph/index.ts";

const records = estateFirstRecords.filter(Boolean);
const pulls = records.flatMap((estate) =>
  (estate.nextPulls ?? []).map((pull) => ({ estate, pull })),
);

console.log("Estate archival next-pulls audit");
console.log("================================");
console.log(`Total next pulls: ${pulls.length}`);

for (const { estate, pull } of pulls) {
  console.log(`\n- ${estate.canonicalName} (${estate.island})`);
  console.log(`  Archive: ${pull.archive ?? "unknown"}`);
  if (pull.series) console.log(`  Series: ${pull.series}`);
  if (pull.entry) console.log(`  Entry: ${pull.entry}`);
  if (pull.box) console.log(`  Box: ${pull.box}`);
  if (pull.item) console.log(`  Item: ${pull.item}`);
  if (pull.note) console.log(`  Note: ${pull.note}`);
}

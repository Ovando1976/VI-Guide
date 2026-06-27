import { estateFirstRecords } from "../../src/data/historyGraph/index.ts";

const targetNames = [
  "Lameshur",
  "Catherineberg / Jockumsdahl / Hammer Farm",
  "Cinnamon Bay",
  "Mary Point",
  "Perforce",
];

const records = estateFirstRecords
  .filter(Boolean)
  .filter((estate) => targetNames.includes(estate.canonicalName));

console.log("Rigsarkivet batch audit");
console.log("=======================");
console.log(`Target records: ${records.length}`);

for (const estate of records) {
  const rigsarkivetPulls = (estate.nextPulls ?? []).filter(
    (pull) => pull.archive === "Rigsarkivet",
  );

  console.log(`\n${estate.canonicalName} [${estate.evidenceStatus}]`);
  console.log(`Island: ${estate.island}`);
  console.log(`Names: ${estate.historicalNames.join(", ")}`);
  console.log(`Owner events: ${estate.ownerChain.length}`);
  console.log(`Rigsarkivet pulls: ${rigsarkivetPulls.length}`);

  for (const pull of rigsarkivetPulls) {
    if (pull.series) console.log(`- Series: ${pull.series}`);
    if (pull.entry) console.log(`  Entry: ${pull.entry}`);
    if (pull.box) console.log(`  Box: ${pull.box}`);
    if (pull.item) console.log(`  Item: ${pull.item}`);
    if (pull.note) console.log(`  Note: ${pull.note}`);
  }
}

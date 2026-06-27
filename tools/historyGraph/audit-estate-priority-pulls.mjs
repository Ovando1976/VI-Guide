import { estateFirstRecords } from "../../src/data/historyGraph/index.ts";

const records = estateFirstRecords.filter(Boolean);

const statusWeight = {
  needs_archival_pull: 1,
  probable: 2,
  confirmed: 3,
};

const archiveWeight = {
  "NARA RG 55": 1,
  Rigsarkivet: 2,
  "Moravian Archives": 3,
  "USVI Recorder": 4,
};

const pulls = records.flatMap((estate) =>
  (estate.nextPulls ?? []).map((pull) => ({
    estate: estate.canonicalName,
    island: estate.island,
    evidenceStatus: estate.evidenceStatus,
    archive: pull.archive ?? "unknown",
    series: pull.series ?? "",
    entry: pull.entry ?? "",
    box: pull.box ?? "",
    item: pull.item ?? "",
    note: pull.note ?? "",
    priority:
      (statusWeight[estate.evidenceStatus] ?? 9) * 10 +
      (archiveWeight[pull.archive] ?? 9),
  })),
).sort((a, b) => a.priority - b.priority || a.estate.localeCompare(b.estate));

console.log("Estate archival priority audit");
console.log("==============================");
console.log(`Total priority pulls: ${pulls.length}`);

for (const [index, pull] of pulls.entries()) {
  console.log(`\n#${index + 1} ${pull.estate} (${pull.island})`);
  console.log(`Status: ${pull.evidenceStatus}`);
  console.log(`Archive: ${pull.archive}`);
  if (pull.series) console.log(`Series: ${pull.series}`);
  if (pull.entry) console.log(`Entry: ${pull.entry}`);
  if (pull.box) console.log(`Box: ${pull.box}`);
  if (pull.item) console.log(`Item: ${pull.item}`);
  if (pull.note) console.log(`Note: ${pull.note}`);
}

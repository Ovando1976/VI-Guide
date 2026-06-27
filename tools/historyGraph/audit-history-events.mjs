import {
  promotedEstateEvents,
  rigsarkivetBatchEvents,
  naraRg55BatchEvents,
  moravianBatchEvents,
  usviRecorderBatchEvents,
} from "../../src/data/historyGraph/index.ts";

const events = promotedEstateEvents.filter(Boolean);

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

console.log("History event audit");
console.log("===================");
console.log(`Events: ${events.length}`);
console.log(`Promoted events: ${promotedEstateEvents.length}`);
console.log(`Rigsarkivet batch events: ${rigsarkivetBatchEvents.length}`);
console.log(`NARA RG55 batch events: ${naraRg55BatchEvents.length}`);
console.log(`Moravian batch events: ${moravianBatchEvents.length}`);
console.log(`USVI Recorder batch events: ${usviRecorderBatchEvents.length}`);

console.log("\nBy type:");
for (const [type, count] of Object.entries(countBy(events, (event) => event.type))) {
  console.log(`- ${type}: ${count}`);
}

console.log("\nBy evidence status:");
for (const [status, count] of Object.entries(countBy(events, (event) => event.evidenceStatus))) {
  console.log(`- ${status}: ${count}`);
}

console.log("\nEvents:");
for (const event of events) {
  console.log(`\n- ${event.label}`);
  console.log(`  Estate: ${event.estateName}`);
  console.log(`  Type: ${event.type}`);
  console.log(`  Status: ${event.evidenceStatus}`);
  if (event.personOrInstitution) console.log(`  Person/Institution: ${event.personOrInstitution}`);
}

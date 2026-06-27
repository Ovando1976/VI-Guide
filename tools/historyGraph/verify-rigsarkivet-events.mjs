import { rigsarkivetBatchEvents } from "../../src/data/historyGraph/index.ts";

const events = rigsarkivetBatchEvents.filter(Boolean);

const failures = [];

for (const event of events) {
  if (!event.id) failures.push("Missing event id");
  if (!event.estateCanonicalId) failures.push(`${event.id}: missing estateCanonicalId`);
  if (!event.estateName) failures.push(`${event.id}: missing estateName`);
  if (!event.type) failures.push(`${event.id}: missing type`);
  if (!event.evidenceStatus) failures.push(`${event.id}: missing evidenceStatus`);
  if (!Array.isArray(event.sourceRefs) || event.sourceRefs.length === 0) {
    failures.push(`${event.id}: missing sourceRefs`);
  }
}

console.log("Rigsarkivet event verification");
console.log("==============================");
console.log(`Events checked: ${events.length}`);
console.log(`Failures: ${failures.length}`);

if (failures.length) {
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

console.log("All Rigsarkivet batch events passed structural verification.");

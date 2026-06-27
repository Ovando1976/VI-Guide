import { archivalResearchTargets } from "../../src/data/historyGraph/index.ts";

console.log(`Archival research targets: ${archivalResearchTargets.length}`);

for (const target of archivalResearchTargets) {
  console.log(`\n${target.title}`);
  console.log(`Status: ${target.status}`);
  console.log(`Priority: ${target.priority}`);
  console.log(`Repository: ${target.repository}`);
  console.log(`Date range: ${target.dateRange}`);
  console.log(`Terms: ${target.searchTerms.join(", ")}`);
}

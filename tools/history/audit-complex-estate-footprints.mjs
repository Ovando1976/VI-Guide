import { complexEstateFootprints } from "../../src/data/history/estates/index.ts";

console.log(`Complex estate footprints: ${complexEstateFootprints.length}`);

for (const item of complexEstateFootprints) {
  console.log(`\n${item.name} [${item.confidence}]`);
  console.log(`Island: ${item.island}`);
  console.log(`Historical components: ${item.componentHistoricalNames.join(", ")}`);
  console.log(`Modern related estates: ${item.relatedModernEstates.join(", ")}`);
  console.log(`People: ${item.knownPeople.join(", ")}`);
}

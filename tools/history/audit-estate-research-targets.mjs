import { estateResearchTargets } from "../../src/data/history/estates/index.ts";

console.log(`Estate research targets: ${estateResearchTargets.length}`);

for (const target of estateResearchTargets) {
  console.log(`\n${target.modernEstateName}`);
  console.log(`Island: ${target.island}`);
  console.log(`Priority: ${target.priority}`);
  console.log(`Status: ${target.status}`);
  console.log(`Question: ${target.researchQuestion}`);
}

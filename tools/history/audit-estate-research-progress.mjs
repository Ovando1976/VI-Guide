import {
  estateResearchBatches,
  estateResearchProgress,
} from "../../src/data/history/estates/index.ts";

console.log("Estate research progress");
console.log(estateResearchProgress);

for (const batch of estateResearchBatches) {
  console.log(`\n${batch.name} [${batch.status}]`);
  console.log(`Count: ${batch.estates.length}`);
  for (const estate of batch.estates) {
    console.log(`- ${estate}`);
  }
}

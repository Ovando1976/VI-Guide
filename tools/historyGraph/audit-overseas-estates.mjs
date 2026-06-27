import {
  overseasEstateSeed,
  overseasEstateSourceFamilies,
} from "../../src/data/historyGraph/index.ts";

console.log(`Overseas estate canonical seeds: ${overseasEstateSeed.length}`);
console.log(`Overseas source families: ${overseasEstateSourceFamilies.length}`);

for (const estate of overseasEstateSeed) {
  console.log(`\n${estate.canonicalName}`);
  console.log(`Island: ${estate.island}`);
  console.log(`Aliases: ${estate.aliasNames.map((x) => x.name).join(", ")}`);
}

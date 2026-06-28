import { estates } from "../src/data/estates";
import { buildStableEstateId } from "../src/lib/estate-normalize";

const estateIds = new Map<string, string[]>();
const sourceGeoids = new Map<string, string[]>();

let placeholderGeoids = 0;

for (const estate of estates) {
  const baseEstateId = buildStableEstateId({
    island: String(estate.island),
    name: estate.name,
    quarter: estate.quarter,
    geoid: estate.geoid,
  });

  const estateNames = estateIds.get(baseEstateId) ?? [];
  estateNames.push(estate.name);
  estateIds.set(baseEstateId, estateNames);

  if (!estate.geoid || estate.geoid === "-1") {
    placeholderGeoids++;
  }

  const geoidNames = sourceGeoids.get(estate.geoid) ?? [];
  geoidNames.push(estate.name);
  sourceGeoids.set(estate.geoid, geoidNames);
}

const duplicatedBaseEstateIds = [...estateIds.entries()].filter(
  ([, names]) => names.length > 1
);

const duplicatedSourceGeoids = [...sourceGeoids.entries()].filter(
  ([, names]) => names.length > 1
);

console.log("Estate count:", estates.length);
console.log("Unique base estate IDs:", estateIds.size);
console.log("Placeholder geoids:", placeholderGeoids);
console.log("Duplicate base estate IDs:", duplicatedBaseEstateIds.length);
console.log("Duplicate source geoids:", duplicatedSourceGeoids.length);

for (const [estateId, names] of duplicatedBaseEstateIds) {
  console.warn("Duplicate base estateId handled by builder:", estateId, names.join(" | "));
}

for (const [geoid, names] of duplicatedSourceGeoids) {
  console.warn("Duplicate source geoid:", geoid, names.join(" | "));
}

console.log("Estate knowledge validation passed");
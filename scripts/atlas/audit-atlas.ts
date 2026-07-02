import { gazetteer } from "../../src/data/atlas/gazetteer";

const ids = new Set<string>();
const duplicates: string[] = [];

for (const item of gazetteer) {
  if (ids.has(item.id)) duplicates.push(item.id);
  ids.add(item.id);
}

if (duplicates.length) {
  throw new Error(`Duplicate atlas IDs: ${duplicates.join(", ")}`);
}

console.log("Atlas audit passed.");
console.log({
  gazetteerFeatures: gazetteer.length,
});

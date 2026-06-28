import { geographicIndex } from "../../src/data/core/geographicIndex.ts";

const items =
  Array.isArray(geographicIndex) ? geographicIndex :
  Array.isArray(geographicIndex.items) ? geographicIndex.items :
  Object.values(geographicIndex).find(Array.isArray) ?? [];

const targets = [
  "Doppels",
  "Dyppel",
  "Iversen",
  "Oliandus",
  "Domine",
  "Parsons Estate",
  "Parson",
  "Parsons",
];

function haystack(item) {
  return [
    item.id,
    item.name,
    item.canonicalName,
    item.displayName,
    item.baseName,
    item.estateName,
    item.description,
    ...(item.aliases ?? []),
    ...(item.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

for (const target of targets) {
  const q = target.toLowerCase();
  const matches = items
    .filter((item) => haystack(item).includes(q))
    .slice(0, 20);

  console.log(`\nQUERY: ${target}`);
  console.log(`MATCHES: ${matches.length}`);

  for (const item of matches) {
    console.log(`- ${item.name || item.displayName} | ${item.type} | ${item.category} | ${item.estateName || ""}`);
    if (item.description) console.log(`  ${String(item.description).slice(0, 240)}`);
  }
}

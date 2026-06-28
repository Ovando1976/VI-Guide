import { originalStThomasColonists1678 } from "../../../src/data/history/colonists/index.ts";
import { historicalAliasIndex } from "../../../src/data/history/aliases/index.ts";

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function aliasTerms(record) {
  return [
    record.modernName,
    ...(record.historicalNames ?? []),
    ...(record.proprietorNames ?? []),
    ...(record.frenchNames ?? []),
    ...(record.dutchNames ?? []),
    ...(record.danishNames ?? []),
    ...(record.englishNames ?? []),
  ];
}

let found = 0;

for (const colonist of originalStThomasColonists1678) {
  const needle = normalize(colonist.canonicalName);

  const matches = historicalAliasIndex.filter((alias) =>
    aliasTerms(alias).some((term) => {
      const hay = normalize(term);
      if (hay === needle) return true;

      const needleParts = needle.split(" ").filter(Boolean);
      const hayParts = hay.split(" ").filter(Boolean);

      // Avoid false positives like "Cornelius Jansen" matching modern estate "Jansen".
      if (hayParts.length === 1 && needleParts.length > 1) return false;

      return hay.includes(needle) || needle.includes(hay);
    }),
  );

  if (!matches.length) continue;

  found += matches.length;
  console.log(`\n${colonist.number}. ${colonist.canonicalName}`);
  for (const match of matches) {
    console.log(`- ${match.modernName} [${match.confidence}]`);
  }
}

console.log(`\nColonist alias candidate matches: ${found}`);

import fs from "node:fs";
import path from "node:path";
import { knoxEarlyEstateLinks } from "../../src/data/history/generated/knoxEarlyEstateLinks.ts";
import { findHistoricalAliasMatch } from "../../src/data/history/aliases/index.ts";

const OUT = path.join(
  process.cwd(),
  "src/data/history/generated/knoxEarlyEstateLinks.enriched.ts",
);

const enriched = knoxEarlyEstateLinks.map((link) => {
  const match =
    findHistoricalAliasMatch(link.originalEstateName || "") ||
    findHistoricalAliasMatch(link.colonistName || "");

  if (!match) return link;

  return {
    ...link,
    modernEstateName: match.modernName,
    confidence: match.confidence,
    historicalAliases: match.historicalNames,
    evidence: `${link.evidence} Matched through Historical Alias Index: ${match.modernName}.`,
  };
});

const output = `import type { KnoxEarlyEstateLink } from "./knoxEarlyEstateLinks";

export const enrichedKnoxEarlyEstateLinks: KnoxEarlyEstateLink[] = ${JSON.stringify(
  enriched,
  null,
  2,
)};
`;

fs.writeFileSync(OUT, output);
console.log(`Wrote ${OUT}`);
console.log(`Linked: ${enriched.filter((x) => x.modernEstateName).length}`);
console.log(`Unresolved: ${enriched.filter((x) => !x.modernEstateName).length}`);

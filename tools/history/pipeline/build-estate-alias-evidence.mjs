import fs from "node:fs";
import path from "node:path";
import { knoxEarlyEstateLinks } from "../../../src/data/history/generated/knoxEarlyEstateLinks.ts";
import { historicalAliasIndex } from "../../../src/data/history/aliases/index.ts";

const OUT = path.join(
  process.cwd(),
  "src/data/history/generated/estateAliasEvidence.ts",
);

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function allAliasTerms(alias) {
  return [
    alias.modernName,
    ...(alias.historicalNames ?? []),
    ...(alias.proprietorNames ?? []),
    ...(alias.frenchNames ?? []),
    ...(alias.dutchNames ?? []),
    ...(alias.danishNames ?? []),
    ...(alias.englishNames ?? []),
  ].filter(Boolean);
}

const evidence = [];

for (const link of knoxEarlyEstateLinks) {
  const targets = [
    link.colonistName,
    link.originalEstateName,
  ].filter(Boolean);

  for (const alias of historicalAliasIndex) {
    const terms = allAliasTerms(alias);

    const matchedTerm = terms.find((term) => {
      const nTerm = normalize(term);
      return targets.some((target) => {
        const nTarget = normalize(target);
        return (
          nTarget &&
          nTerm &&
          (nTarget.includes(nTerm) || nTerm.includes(nTarget))
        );
      });
    });

    if (!matchedTerm) continue;

    evidence.push({
      id: `evidence-${normalize(link.colonistName).replaceAll(" ", "-")}-${normalize(alias.modernName).replaceAll(" ", "-")}`,
      targetName: link.colonistName,
      normalizedTargetName: normalize(link.colonistName),
      proposedModernName: alias.modernName,
      sourceId: alias.sources?.[0]?.source ?? "source-geographic-dictionary-usvi",
      sourceTitle: alias.sources?.[0]?.source ?? "Geographic Dictionary of the Virgin Islands",
      sourcePages: alias.sources?.[0]?.pages,
      evidenceText: `${link.colonistName} / ${link.originalEstateName} matched alias term "${matchedTerm}" for modern estate "${alias.modernName}".`,
      evidenceType: "alias_chain",
      confidence: alias.confidence,
      notes: alias.notes,
    });
  }
}

const output = `import type { HistoricalEvidenceItem } from "../pipeline";

export const estateAliasEvidence: HistoricalEvidenceItem[] = ${JSON.stringify(
  evidence,
  null,
  2,
)};
`;

fs.writeFileSync(OUT, output);
console.log(`Wrote ${OUT}`);
console.log(`Evidence items: ${evidence.length}`);

for (const item of evidence) {
  console.log(`- ${item.targetName} → ${item.proposedModernName} [${item.confidence}]`);
}

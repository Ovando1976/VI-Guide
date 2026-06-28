import { mergedEstateExtractions } from "../../src/data/historyGraph/extracted/index.ts";

const records = mergedEstateExtractions.filter((r) =>
  r.citations.some((c) => c.page || c.image || c.url) ||
  r.ownerChain.some((e) => e.citation?.page || e.citation?.image || e.citation?.url) ||
  r.transferEvidence.some((e) => e.citation?.page || e.citation?.image || e.citation?.url)
);

console.log("Page/Image-level evidence audit");
console.log("===============================");
console.log(`Records with page/image/url evidence: ${records.length}`);

for (const r of records) {
  console.log(`- ${r.estateName} (${r.estateCanonicalId})`);
}

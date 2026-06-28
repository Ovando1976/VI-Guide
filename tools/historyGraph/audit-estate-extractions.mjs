import { mergedEstateExtractions } from "../../src/data/historyGraph/extracted/index.ts";

const total = mergedEstateExtractions.length;
const byStatus = Object.groupBy(mergedEstateExtractions, (record) => record.status);

const withOwnerChain = mergedEstateExtractions.filter((r) => r.ownerChain.length > 0).length;
const ownerChainItems = mergedEstateExtractions.reduce((sum, r) => sum + r.ownerChain.length, 0);

const withCitations = mergedEstateExtractions.filter((r) => r.citations.length > 0).length;
const citationItems = mergedEstateExtractions.reduce((sum, r) => sum + r.citations.length, 0);

const withTransferEvidence = mergedEstateExtractions.filter((r) => r.transferEvidence.length > 0).length;
const transferEvidenceItems = mergedEstateExtractions.reduce((sum, r) => sum + r.transferEvidence.length, 0);

const withNeighboringEstates = mergedEstateExtractions.filter((r) => r.neighboringEstates.length > 0).length;

console.log("Estate extraction audit");
console.log("=======================");
console.log(`Total: ${total}`);
console.log(`With owner chain: ${withOwnerChain} records / ${ownerChainItems} items`);
console.log(`With citations: ${withCitations} records / ${citationItems} items`);
console.log(`With transfer evidence: ${withTransferEvidence} records / ${transferEvidenceItems} items`);
console.log(`With neighboring estates: ${withNeighboringEstates}`);

console.log("\nBy status:");
for (const [status, records] of Object.entries(byStatus)) {
  console.log(`- ${status}: ${records?.length ?? 0}`);
}

import fs from "node:fs";
import { generatedEstateArchiveTargets } from "../../src/data/historyGraph/extractionTargets/generatedEstateArchiveTargets.ts";

const jsonFile = "src/data/historyGraph/extracted/generatedEstateExtractions.json";
const tsFile = "src/data/historyGraph/extracted/generatedEstateExtractions.ts";

function toExtraction(target) {
  return {
    estateCanonicalId: target.estateCanonicalId,
    estateName: target.estateName,
    island: target.island,
    status: "open",
    aliases: target.searchNames ?? [],
    quarter: null,
    acreage: null,
    boundaries: [],
    neighboringEstates: [],
    ownerChain: [],
    transferEvidence: [],
    modernContinuityNotes: [],
    researchNotes: [target.extractionGoal ?? target.goal ?? ""],
    citations: [],
    confidence: "unverified"
  };
}

const records = generatedEstateArchiveTargets.map(toExtraction);

fs.writeFileSync(jsonFile, JSON.stringify(records, null, 2) + "\n");

fs.writeFileSync(
  tsFile,
  `import records from "./generatedEstateExtractions.json";
import type { EstateExtractionRecord } from "./estateExtractionTypes";

export const generatedEstateExtractions = records as EstateExtractionRecord[];
`
);

console.log(`Wrote ${records.length} extraction shells.`);
console.log(jsonFile);
console.log(tsFile);

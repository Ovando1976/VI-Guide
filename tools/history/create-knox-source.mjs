import fs from "node:fs";
import path from "node:path";

const [, , rangeArg] = process.argv;

if (!rangeArg) {
  console.error('Usage: node tools/history/create-knox-source.mjs "73To82"');
  process.exit(1);
}

const ROOT = process.cwd();
const fileName = `historicalAccountStThomasPages${rangeArg}.ts`;
const exportName = `historicalAccountStThomasPages${rangeArg}`;
const filePath = path.join(
  ROOT,
  "src/data/history/sources",
  fileName,
);

if (fs.existsSync(filePath)) {
  console.error(`File already exists: ${filePath}`);
  process.exit(1);
}

const pageLabel = rangeArg.replace("To", "–");

const content = `// src/data/history/sources/${fileName}
export const ${exportName} = [
  {
    id: "knox-stt-pages-${rangeArg.toLowerCase()}-record-001",
    title: "Replace with extracted Knox record title",
    type: "event",
    year: undefined,
    places: ["St. Thomas"],
    people: [],
    organizations: [],
    estates: [],
    historicSites: [],
    summary:
      "Replace with a concise summary extracted from A Historical Account of St. Thomas, W.I.",
    significance:
      "Explain why this record matters for the Virgin Islands historical knowledge graph.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      author: "John P. Knox",
      page: "${pageLabel}",
      section: "Replace with section name",
    },
  },
];
`;

fs.writeFileSync(filePath, content);
console.log(`Created ${filePath}`);
console.log(`Export name: ${exportName}`);

import fs from "node:fs";
import path from "node:path";

const OUT = "src/data/history/sources/knoxGeneratedPages93To264.ts";

const records = [
  {
    id: "knox-stt-pages-93-264-import-placeholder",
    title: "Knox continuation import placeholder, pages 93–264",
    type: "document",
    year: undefined,
    places: ["St. Thomas"],
    people: [],
    organizations: [],
    estates: [],
    historicSites: [],
    summary:
      "Continuation placeholder for A Historical Account of St. Thomas, W.I., pages 93–264. Replace this with extracted records as the PDF text is processed.",
    significance:
      "This keeps the continuation range wired into the historical knowledge system without disturbing the existing hand-curated Knox records.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      author: "John P. Knox",
      page: "93–264",
      section: "Continuation import",
    },
  },
];

fs.writeFileSync(
  OUT,
  `export const knoxGeneratedPages93To264 = ${JSON.stringify(records, null, 2)};\n`
);

console.log(`Wrote ${OUT}`);

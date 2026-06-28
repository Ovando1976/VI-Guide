import fs from "node:fs";
import path from "node:path";

const OCR = path.join(
  process.cwd(),
  "docs/history/knox/ocr-text/batch-253-262.txt",
);

const OUT = path.join(
  process.cwd(),
  "src/data/history/generated/knoxAppendixAColonists.ts",
);

const SOURCE_RECORD_ID =
  "knox-ocr-253-262-006-1678-appendix-a-lists-st-thomas-colonists-and-estate-holders";

const raw = fs.readFileSync(OCR, "utf8");

const page255To256 = raw
  .split("--- PAGE 255 ---")[1]
  .split("The eight other names could not be made out")[0]
  .replace(/\s+/g, " ")
  .replace(/APPENDIX\.?\s*A\.?/i, "")
  .replace(/Names of Colonists on St\. Thomas, 1678, and those who were en-\s*titled to estates:/i, "")
  .trim();

const namePattern =
  /(?:^|\s)(\d{1,2})[\.,]?\s+(.+?)(?=\s+\d{1,2}[\.,]?\s+|$)/g;

const byNumber = new Map();
let match;

while ((match = namePattern.exec(page255To256))) {
  const number = Number(match[1]);

  let name = match[2]
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Remove OCR/page spillover.
  name = name
    .replace(/\s+248\s+APPENDIX\.?$/i, "")
    .replace(/\s+APPENDIX\.?$/i, "")
    .replace(/\s+The eight other names.*$/i, "")
    .replace(/--- PAGE\s+\d+\s+---/gi, " ")
    .replace(/[.;:,'’]+$/g, "")
    .replace(/\bComelius\b/g, "Cornelius")
    .replace(/^Jan\.\s+/i, "Jan ")
    .replace(/^Wilhelm\.\s+/i, "Wilhelm ")
    .replace(/^Robben\.\s+/i, "Robben ")
    .replace(/^Parsons\.\s+Estate$/i, "Parsons Estate")
    .replace(/^Jacob Thoma\.$/i, "Jacob Thoma")
    .trim();

  if (!name || number < 1 || number > 52) continue;

  byNumber.set(number, {
    id: `appendix-a-1678-colonist-${String(number).padStart(3, "0")}`,
    number,
    name,
    island: "st_thomas",
    year: 1678,
    category: "colonist_estate_holder",
    sourceRecordId: SOURCE_RECORD_ID,
    source: {
      title: "A Historical Account of St. Thomas, W.I.",
      author: "John P. Knox",
      pages: number <= 44 ? "255" : "256",
      appendix: "A",
    },
  });
}

const colonists = [...byNumber.values()].sort((a, b) => a.number - b.number);

const output = `export const knoxAppendixAColonists = ${JSON.stringify(
  colonists,
  null,
  2,
)} as const;

export const knoxAppendixAUnreadableColonistCount = 8;

export type KnoxAppendixAColonist = (typeof knoxAppendixAColonists)[number];
`;

fs.writeFileSync(OUT, output);

console.log(`Extracted ${colonists.length} readable Appendix A colonists.`);
console.log(`Unreadable/mutilated names: 8`);
console.log(`Wrote ${OUT}`);
console.log(colonists.map((c) => `${c.number}. ${c.name}`).join("\n"));

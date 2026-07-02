// @ts-nocheck

import { readFileSync, writeFileSync } from "node:fs";

const JSON_PATH = "src/data/history/generated/rigsarkivetMapsAndDrawings.json";
const TS_PATH = "src/data/history/generated/rigsarkivetMapsAndDrawings.ts";

function clean(value: unknown) {
  return String(value || "")
    .replaceAll("&aring;", "å")
    .replaceAll("&Aring;", "Å")
    .replaceAll("&aelig;", "æ")
    .replaceAll("&AElig;", "Æ")
    .replaceAll("&oslash;", "ø")
    .replaceAll("&Oslash;", "Ø")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

const manualOverrides: Record<string, string> = {
  "337 8": "Map of St. Croix, 1898, drawn by E. E.",
  "337 10": "Town Map of Christiansted, St. Croix, 1856, drawn by Christian Ludvig Schellerup",
  "337 11": "Town Map of Frederiksted, St. Croix, 1863, draftsman unknown",
  "337 12": "Town Map of Frederiksted, St. Croix, 1856, by Christian Ludvig Schellerup",
  "337 16": "Map of St. Thomas Harbor, with inset coastal profile of the entrance, surveyed 1851, printed 1853, drawn by G. B. Lawrance",
  "337 17": "Map of the Town of St. Thomas, 1871, drawn by Th. Thorsen",
  "337 33": "Map of the Danish West Indies, Puerto Rico, and the British Virgin Islands, with inset map of St. Thomas Harbor, 1849, corrected to 1894, draftsman unknown",
  "337 34": "Map of St. Thomas Harbor, with inset coastal profile of the entrance, surveyed 1851, corrected in 1864, 1873, 1875, and 1885, drawn by G. B. Lawrance and Nares",
  "337 35": "Photograph of the Harbor in Charlotte Amalie, St. Thomas, undated",
  "337 36": "Map of St. Croix, printed 1894, issued 1906, drawn by L. F. von Wimpffen and A. Klakring",
  "337 38": "Map of St. Croix with Proposed Railway Marked in Red, prepared 1794, printed 1799, with later addition, drawn by Peter Lotharius Oxholm",
  "337 39": "Photograph of the Gendarmerie Barracks at the Harbor in Charlotte Amalie, St. Thomas, undated, after 1874",
  "337 40": "Map of St. Croix with Inset Map of Christiansted Harbor and Six Coastal Profiles of the North Coast, 1856, drawn by John Parsons",
  "337 41": "Map of St. Croix with Inset Map of Christiansted Harbor and Six Coastal Profiles of the North Coast, with later annotations probably concerning a proposed railway, 1856, drawn by John Parsons",
  "337 42": "Map of St. Croix with Inset Map of Christiansted Harbor and Six Coastal Profiles of the North Coast, with later annotations probably concerning a proposed railway, 1856, drawn by John Parsons",
  "337 233": "Map of the Atlantic with Transatlantic Telegraph Line, prepared 1852, originally printed 1854, corrected 1859–1861, drawn by P. Daussy",
  "337 234": "Plate Explaining the Route of the Transatlantic Telegraph Line, undated, written by Albert Balestrini",
  "337 407": "Kingshill Police and Military Station, Site Plan, 1882, drawn by J. Andersen",
  "337 408": "Map of the Northwesternmost Part of St. Croix, Roads and Watercourses, 1891, drawn by Anders Peter Jørgensen",
  "337 409": "Leveling Survey of the Middle Gut in Charlotte Amalie, St. Thomas, undated, draftsman unknown",
};

const replacements: Array<[RegExp, string]> = [
  [/\bpå\b/gi, "on"],
  [/\bi\b/gi, "in"],
  [/\bog\b/gi, "and"],
  [/\bmed\b/gi, "with"],
  [/\baf\b/gi, "of"],
  [/\bby St\. Croix\b/gi, "of St. Croix"],
  [/\bby St\. Thomas\b/gi, "of St. Thomas"],
  [/\bby north coast\b/gi, "of the north coast"],
  [/\bby harbor entrance\b/gi, "of the harbor entrance"],
  [/\bseks\b/gi, "six"],
  [/\bdet\b/gi, "the"],
  [/\bAtlanten\b/gi, "the Atlantic"],
  [/\bvandløb\b/gi, "watercourses"],
  [/\bmidterste gut\b/gi, "middle gut"],
  [/\bprojekteret railway\b/gi, "proposed railway"],
  [/\banført med rødt\b/gi, "marked in red"],
  [/\befter\b/gi, "after"],
  [/\bhvor\b/gi, "where"],
  [/\bblev bygget\b/gi, "was built"],
  [/\bangående\b/gi, "concerning"],
  [/\bpåtænkt railway\b/gi, "proposed railway"],
  [/\borindelig\b/gi, "originally"],
  [/\boprindelig\b/gi, "originally"],
  [/\bSurveyed\b/g, "surveyed"],
  [/\bPrepared\b/g, "prepared"],
  [/\bMap of the harbor in Christiansted\b/gi, "Map of Christiansted Harbor"],
  [/\bMap of the harbor in Charlotte Amalie\b/gi, "Map of Charlotte Amalie Harbor"],
  [/\bthe harbor in Charlotte Amalie\b/gi, "the harbor in Charlotte Amalie"],
  [/\bSt\. Thomas by 1871\b/gi, "the town of St. Thomas, 1871"],
  [/\bPuerto Rico and the British\b/gi, "Puerto Rico, and the British"],
  [/\bL\. F\. von Wimpffen and A\. Klakring\b/g, "L. F. von Wimpffen and A. Klakring"],
];

function titleCaseStart(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function polish(value: string) {
  let title = clean(value);

  for (const [pattern, replacement] of replacements) {
    title = title.replace(pattern, replacement);
  }

  title = title
    .replace(/\s+,/g, ",")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\bof the harbor in Christiansted\b/gi, "of Christiansted Harbor")
    .replace(/\bMap of Christiansted Harbor\b/gi, "Map of Christiansted Harbor")
    .replace(/\bMap of St\. Croix, inset is Map of Christiansted Harbor\b/gi, "Map of St. Croix with inset map of Christiansted Harbor")
    .replace(/\balso six coastal profiles of the north coast\b/gi, "and six coastal profiles of the north coast")
    .replace(/\bthe the\b/gi, "the")
    .replace(/\band and\b/gi, "and")
    .replace(/\bof of\b/gi, "of")
    .replace(/\bin in\b/gi, "in")
    .replace(/\son\s+the harbor\s+in/gi, "at the harbor in")
    .replace(/\s+/g, " ")
    .trim();

  return titleCaseStart(title);
}

function description(record: any) {
  const pieces = [
    record.englishTitle || record.displayTitle,
    record.yearLabel ? `Date: ${record.yearLabel}.` : "",
    record.creator ? `Creator: ${record.creator}.` : "",
    record.places?.length ? `Associated places: ${record.places.join(", ")}.` : "",
    record.imageIds?.length ? `Images/pages: ${record.imageIds.length}.` : "",
    record.viewerItemId ? `Rigsarkivet viewer item: ${record.viewerItemId}.` : "",
  ].filter(Boolean);

  return pieces.join(" ");
}

const records = JSON.parse(readFileSync(JSON_PATH, "utf8"));

const updated = records.map((record: any) => {
  const originalTitle = clean(record.originalTitle || record.title);
  const override = manualOverrides[record.archiveRef];
  const englishTitle = override || polish(record.englishTitle || record.displayTitle || originalTitle);

  return {
    ...record,
    title: originalTitle,
    originalTitle,
    englishTitle,
    displayTitle: englishTitle,
    englishDescription: description({
      ...record,
      originalTitle,
      englishTitle,
      displayTitle: englishTitle,
    }),
  };
});

writeFileSync(JSON_PATH, JSON.stringify(updated, null, 2) + "\n");

const ts = `/* Auto-generated archive data. */
/* eslint-disable */

export const rigsarkivetMapsAndDrawings = ${JSON.stringify(updated, null, 2)} as const;

export type RigsarkivetMapAndDrawing = typeof rigsarkivetMapsAndDrawings[number];
`;

writeFileSync(TS_PATH, ts);

console.log(`Polished ${updated.length} English titles.`);
console.log("\nSample:");
for (const record of updated.slice(0, 20)) {
  console.log(`${record.archiveRef}`);
  console.log(`DA: ${record.originalTitle}`);
  console.log(`EN: ${record.englishTitle}`);
  console.log("");
}

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const IN_JSON =
  "generated/rigsarkivet/st-thomas-landslister-1688-1718/st-thomas-landslister-pages.json";

const OUT_JSON =
  "generated/rigsarkivet/st-thomas-landslister-1688-1718/st-thomas-landslister-number-index.json";

const OUT_TS = "src/data/history/sources/stThomasLandLists1688_1718.ts";

const OUT_MD = "reports/estate-history/st-thomas-landslister-number-index.md";

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9æøå]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumbers(value) {
  const text = clean(value);
  return [...new Set(text.match(/\b\d{1,4}\b/g) || [])];
}

function parseResident(raw) {
  const text = clean(raw);
  const parts = text.split(",").map(clean).filter(Boolean);
  const explicitNumbers = parts.filter((part) => /^\d{1,4}$/.test(part));
  const fallbackNumbers = extractNumbers(text).slice(-1);
  const numbers = explicitNumbers.length ? explicitNumbers : fallbackNumbers;

  const nameParts = parts.filter((part) => !/^\d{1,4}$/.test(part));
  const name = clean(nameParts[0] || text.replace(/\b\d{1,4}\b/g, ""));
  const role = clean(nameParts.slice(1).join(", "));

  return {
    raw: text,
    name,
    role,
    numbers,
    normalizedName: normalize(name),
    normalizedRole: normalize(role),
  };
}

function termsOfInterest(text) {
  const normalized = normalize(text);
  const terms = [
    "rian",
    "ryan",
    "weron",
    "veron",
    "véron",
    "bovoni",
    "boleoni",
    "bovani",
    "bovony",
    "franskmand",
    "frenchman",
    "frenchman bay",
  ];

  return terms.filter((term) => normalized.includes(normalize(term)));
}

const pages = JSON.parse(readFileSync(IN_JSON, "utf8"));

const records = [];

for (const page of pages) {
  if (page.error) continue;

  const pageNumber = page.source?.page || page.page;
  const pageNumbers = extractNumbers(page.plantationNumberLine);
  const residents = (page.residents || []).map(parseResident);

  if (residents.length) {
    for (const resident of residents) {
      const numbers = resident.numbers.length ? resident.numbers : pageNumbers;

      for (const number of numbers) {
        records.push({
          id: `st-thomas-landlist-${pageNumber}-${number}-${records.length + 1}`,
          year: clean(page.year),
          islandName: clean(page.islandName),
          plantationNumber: number,
          plantationNumberLine: clean(page.plantationNumberLine),
          residentName: resident.name,
          residentRole: resident.role,
          residentRaw: resident.raw,
          page: pageNumber,
          url: page.source?.url,
          proofread: Boolean(page.proofread),
          comments: page.comments || [],
          termsOfInterest: termsOfInterest(
            [
              page.plantationNumberLine,
              resident.raw,
              ...(page.comments || []),
              page.rawText || "",
            ].join(" ")
          ),
        });
      }
    }
  } else if (pageNumbers.length) {
    for (const number of pageNumbers) {
      records.push({
        id: `st-thomas-landlist-${pageNumber}-${number}-${records.length + 1}`,
        year: clean(page.year),
        islandName: clean(page.islandName),
        plantationNumber: number,
        plantationNumberLine: clean(page.plantationNumberLine),
        residentName: "",
        residentRole: "",
        residentRaw: "",
        page: pageNumber,
        url: page.source?.url,
        proofread: Boolean(page.proofread),
        comments: page.comments || [],
        termsOfInterest: termsOfInterest(
          [
            page.plantationNumberLine,
            ...(page.comments || []),
            page.rawText || "",
          ].join(" ")
        ),
      });
    }
  }
}

const byNumber = {};

for (const record of records) {
  byNumber[record.plantationNumber] ||= {
    plantationNumber: record.plantationNumber,
    years: [],
    names: [],
    roles: [],
    pages: [],
    termsOfInterest: [],
    records: [],
  };

  const bucket = byNumber[record.plantationNumber];
  bucket.records.push(record);

  for (const [key, value] of [
    ["years", record.year],
    ["names", record.residentName],
    ["roles", record.residentRole],
    ["pages", record.page],
  ]) {
    if (value && !bucket[key].includes(value)) bucket[key].push(value);
  }

  for (const term of record.termsOfInterest) {
    if (!bucket.termsOfInterest.includes(term)) {
      bucket.termsOfInterest.push(term);
    }
  }
}

const index = Object.values(byNumber).sort(
  (a, b) => Number(a.plantationNumber) - Number(b.plantationNumber),
);

mkdirSync(path.dirname(OUT_JSON), { recursive: true });
mkdirSync(path.dirname(OUT_TS), { recursive: true });
mkdirSync(path.dirname(OUT_MD), { recursive: true });

writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      source: {
        project: "Dansk Vestindien",
        archiveCreator:
          "Vestindisk-Guineisk Kompagni, Bogholderen, St. Thomas og St. Jan",
        archiveSeries: "Landslister for St. Thomas",
        content: "1688–1718",
        pictureSeriesId: 1514,
      },
      generatedAt: new Date().toISOString(),
      records,
      index,
    },
    null,
    2,
  ),
);

writeFileSync(
  OUT_TS,
  `export type StThomasLandListRecord1688_1718 = {
  id: string;
  year: string;
  islandName: string;
  plantationNumber: string;
  plantationNumberLine: string;
  residentName: string;
  residentRole: string;
  residentRaw: string;
  page: number;
  url?: string;
  proofread: boolean;
  comments: string[];
  termsOfInterest: string[];
};

export type StThomasLandListNumberIndex1688_1718 = {
  plantationNumber: string;
  years: string[];
  names: string[];
  roles: string[];
  pages: number[];
  termsOfInterest: string[];
  records: StThomasLandListRecord1688_1718[];
};

export const stThomasLandListRecords1688_1718 = ${JSON.stringify(records, null, 2)} satisfies StThomasLandListRecord1688_1718[];

export const stThomasLandListNumberIndex1688_1718 = ${JSON.stringify(index, null, 2)} satisfies StThomasLandListNumberIndex1688_1718[];

export function getStThomasLandListRecordsByNumber(plantationNumber: string | number) {
  const target = String(plantationNumber);

  return stThomasLandListRecords1688_1718.filter(
    (record) => record.plantationNumber === target,
  );
}

export function searchStThomasLandListRecords(query: string) {
  const target = query.toLowerCase();

  return stThomasLandListRecords1688_1718.filter((record) =>
    [
      record.plantationNumber,
      record.plantationNumberLine,
      record.residentName,
      record.residentRole,
      record.residentRaw,
      ...record.comments,
      ...record.termsOfInterest,
    ]
      .join(" ")
      .toLowerCase()
      .includes(target),
  );
}
`,
);

const interesting = records.filter((record) => record.termsOfInterest.length);

writeFileSync(
  OUT_MD,
  [
    "# St. Thomas Land Lists Number Index, 1688–1718",
    "",
    `Records: ${records.length}`,
    `Plantation numbers: ${index.length}`,
    `Records with terms of interest: ${interesting.length}`,
    "",
    "## Terms of interest hits",
    "",
    ...interesting.slice(0, 300).map(
      (record) =>
        `- ${record.year}, no. ${record.plantationNumber}, page ${record.page}: ${
          record.residentRaw || record.plantationNumberLine
        } — ${record.termsOfInterest.join(", ")}`,
    ),
    "",
  ].join("\n"),
);

console.log({
  records: records.length,
  plantationNumbers: index.length,
  interesting: interesting.length,
  json: OUT_JSON,
  ts: OUT_TS,
  report: OUT_MD,
});

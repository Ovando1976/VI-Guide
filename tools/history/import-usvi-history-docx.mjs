import fs from "node:fs";
import path from "node:path";
import mammoth from "mammoth";

const ROOT = process.cwd();

const INPUT =
  process.argv[2] || path.join(ROOT, "docs/history/USVI History.docx");

const OUT_DIR = path.join(ROOT, "src/data/history/generated");
const OUT_JSON = path.join(OUT_DIR, "usviHistoryExtract.json");
const OUT_TS = path.join(OUT_DIR, "usviHistoryExtract.ts");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitParagraphs(text) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function includesAny(text, variants) {
  const haystack = normalizeText(text);
  return variants.some((variant) => haystack.includes(normalizeText(variant)));
}

function detectYear(paragraph) {
  const text = String(paragraph || "").trim();

  const startsWithYear = text.match(/^(16\d{2}|17\d{2}|18\d{2}|19\d{2}|20\d{2})\b/);
  if (startsWithYear) return Number(startsWithYear[1]);

  const monthDateYear = text.match(
    /^(?:Jan\.?|Feb\.?|March|April|May|June|July|Aug\.?|Sept\.?|Oct\.?|Nov\.?|Dec\.?)\s+\d{1,2}\.?\s+(16\d{2}|17\d{2}|18\d{2}|19\d{2}|20\d{2})\b/i,
  );
  if (monthDateYear) return Number(monthDateYear[1]);

  const yearRange = text.match(
    /\b(16\d{2}|17\d{2}|18\d{2}|19\d{2}|20\d{2})\s*[–-]\s*(16\d{2}|17\d{2}|18\d{2}|19\d{2}|20\d{2})\b/,
  );
  if (yearRange) return Number(yearRange[1]);

  const years = [...text.matchAll(/\b(16\d{2}|17\d{2}|18\d{2}|19\d{2}|20\d{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((year) => year !== 2017);

  return years[0] ?? null;
}

function detectPlaces(text) {
  const placeMap = {
    "St. Thomas": ["St. Thomas", "Saint Thomas", "St Thomas", "St. Thomas"],
    "St. John": ["St. John", "Saint John", "St John", "St. John"],
    "St. Croix": ["St. Croix", "Saint Croix", "St Croix", "St. Croix"],
    "Charlotte Amalie": ["Charlotte Amalie"],
    "Fort Christian": ["Fort Christian"],
    "Hassel Island": ["Hassel Island"],
    Havensight: ["Havensight"],
    "Long Bay": ["Long Bay", "Longbay"],
    "Magens Bay": ["Magens Bay", "Magen's Bay"],
    Christiansted: ["Christiansted"],
    Frederiksted: ["Frederiksted"],
    "Coral Bay": ["Coral Bay"],
    "Cruz Bay": ["Cruz Bay"],
    "Salt River": ["Salt River"],
    "Water Island": ["Water Island"],
    "Estate Tutu": ["Estate Tutu", "Tutu"],
    "Estate Magens Bay": ["Estate Magens Bay", "Magens Bay Estate"],
    "Estate Lower Love": ["Estate Lower Love", "Lower Love"],
    "Estate Mon Bijou": ["Estate Mon Bijou", "Mon Bijou"],
    "Estate Nazareth": ["Estate Nazareth", "Nazareth"],
    "Emancipation Park": ["Emancipation Park"],
    "Dronningens Gade": ["Dronningens Gade", "Queen’s Street", "Queen's Street"],
    "Prinsens Tværgade": ["Prinsens Tværgade", "Prince’s Cross Street", "Prince's Cross Street"],
    Strandstræde: ["Strandstræde", "Beach Alley"],
    "Royal Dane Mall": ["Royal Dane Mall"],
    "A.H. Riise Mall": ["A.H. Riise Mall", "AH Riise Mall"],
  };

  return Object.entries(placeMap)
    .filter(([, variants]) => includesAny(text, variants))
    .map(([canonical]) => canonical);
}

function detectPeople(text) {
  const people = [
    "Erik Smit",
    "Jørgen Iversen Dyppel",
    "John Gottlieb",
    "General Buddhoe",
    "Peter von Scholten",
    "Mary Thomas",
    "Axeline Salomon",
    "Queen Agnes",
    "Mathilda McBean",
    "David Hamilton Jackson",
    "Camille Pissarro",
    "Edward Wilmot Blyden",
    "Casper Holstein",
    "Hubert Henry Harrison",
    "William H. Hastie",
    "Morris F. deCastro",
    "Cyril E. King",
    "Juan Luis",
    "Melvin H. Evans",
    "Alexander Farrelly",
    "Ralph M. Paiewonsky",
  ];

  return people.filter((person) =>
    text.toLowerCase().includes(person.toLowerCase()),
  );
}

function detectOrganizations(text) {
  const organizationMap = {
    "Danish West India & Guinea Company": [
      "Danish West India & Guinea Company",
      "Danish West India Company",
    ],
    "East Asiatic Company": ["East Asiatic Company", "ØK"],
    "West Indian Company": ["West Indian Company", "West Indian Co.", "WICO"],
    "Hamburg-American Line": [
      "Hamburg-American Line",
      "Hamburg-American",
      "Hamburg-American fleet",
    ],
    "Danish Plantation Company": [
      "Danish Plantation Co.",
      "Danish Plantation Company",
    ],
    "Bethlehem Factory": ["Bethlehem Factory"],
    "Virgin Islands Port Authority": ["Virgin Islands Port Authority", "Port Authority"],
    "Virgin Islands Water and Power Authority": [
      "Virgin Islands Water and Power Authority",
      "WAPA",
    ],
    "University of the Virgin Islands": [
      "University of the Virgin Islands",
      "College of the Virgin Islands",
      "UVI",
    ],
    "National Park Service": ["National Park Service"],
    "The Herald": ["The Herald"],
    "Daily News": ["Daily News"],
    "WSTA": ["WSTA"],
    "Pan Am": ["Pan Am", "Pan American"],
    "Hess Oil": ["Hess Oil", "Hess Oil Virgin Islands Corp."],
  };

  return Object.entries(organizationMap)
    .filter(([, variants]) => includesAny(text, variants))
    .map(([canonical]) => canonical);
}

function detectEstates(text) {
  const estateMap = {
    "Estate Tutu": ["Estate Tutu", "Tutu"],
    "Magens Bay Estate": ["Magens Bay Estate", "Estate Magens Bay"],
    "Estate Lower Love": ["Estate Lower Love", "Lower Love"],
    "Estate Mon Bijou": ["Estate Mon Bijou", "Mon Bijou"],
    "Estate Nazareth": ["Estate Nazareth", "Nazareth"],
    "Sugar Estate": ["Sugar Estate"],
    "Estate Bovoni": ["Estate Bovoni", "Bovoni"],
    "Estate Frydenhoj": ["Estate Frydenhoj", "Frydenhoj"],
    "Estate Frenchman's Bay": ["Estate Frenchman's Bay", "Frenchman's Bay"],
    "Estate Louisenhoj": ["Estate Louisenhoj", "Louisenhoj"],
    "Estate Contant": ["Estate Contant", "Contant"],
    "Estate Gramboko": ["Estate Gramboko", "Gramboko"],
    "Estate Fountain Valley": ["Estate Fountain Valley", "Fountain Valley"],
    "Estate Davis Bay": ["Estate Davis Bay", "Davis Bay"],
    "Estate Lower Love": ["Estate Lower Love", "Lower Love"],
  };

  return Object.entries(estateMap)
    .filter(([, variants]) => includesAny(text, variants))
    .map(([canonical]) => canonical);
}

function detectHistoricSites(text) {
  const siteMap = {
    "Fort Christian": ["Fort Christian"],
    "Fort Frederik": ["Fort Frederik"],
    "Fortsberg": ["Fortsberg", "Fort Berg"],
    "Government House": ["Government House"],
    "Emancipation Park": ["Emancipation Park"],
    "Hassel Island": ["Hassel Island"],
    "Pissarro Building": ["Pissarro building", "Pissarro Building"],
    "Bluebeard's Castle": ["Bluebeard's Castle", "Bluebeards Castle"],
    "Blackbeard's Castle": ["Blackbeard's Castle", "Blackbeards Castle"],
    "Charlotte Amalie High School": ["Charlotte Amalie High School"],
    "Reichhold Center for the Arts": ["Reichhold Center for the Arts"],
    "Cyril E. King Airport": ["Cyril E. King Airport", "St. Thomas airport"],
    "Salt River": ["Salt River"],
    "Virgin Islands National Park": ["Virgin Islands National Park"],
  };

  return Object.entries(siteMap)
    .filter(([, variants]) => includesAny(text, variants))
    .map(([canonical]) => canonical);
}

function classify(paragraph) {
  const lower = paragraph.toLowerCase();

  if (lower.includes("hurricane")) return "hurricane";
  if (lower.includes("governor")) return "government";
  if (lower.includes("slave") || lower.includes("emancipation")) return "emancipation";
  if (lower.includes("strike") || lower.includes("labor") || lower.includes("worker")) return "labor";
  if (lower.includes("port") || lower.includes("harbor") || lower.includes("dock")) return "maritime";
  if (lower.includes("carnival")) return "culture";
  if (lower.includes("school") || lower.includes("college") || lower.includes("university")) return "education";
  if (lower.includes("airport") || lower.includes("road") || lower.includes("pier")) return "infrastructure";
  if (lower.includes("population")) return "population";

  return "event";
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Missing input file: ${INPUT}`);
    console.error(`Usage: node tools/history/import-usvi-history-docx.mjs "/path/to/USVI History.docx"`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const result = await mammoth.extractRawText({ path: INPUT });
  const paragraphs = splitParagraphs(result.value);

  const records = paragraphs
    .map((paragraph, index) => {
      const year = detectYear(paragraph);
      const title =
        year !== null
          ? `${year}: ${paragraph.slice(0, 80).replace(/[.:;,-]\s*$/, "")}`
          : paragraph.slice(0, 80).replace(/[.:;,-]\s*$/, "");

      return {
        id: `usvi-history-${String(index + 1).padStart(4, "0")}-${slugify(title).slice(0, 60)}`,
        type: classify(paragraph),
        year,
        title,
        summary: paragraph,
        places: detectPlaces(paragraph),
        people: detectPeople(paragraph),
        organizations: detectOrganizations(paragraph),
        estates: detectEstates(paragraph),
        historicSites: detectHistoricSites(paragraph),
        source: {
          title: "USVI History",
          file: path.basename(INPUT),
          paragraph: index + 1,
        },
      };
    })
    .filter((record) => record.summary.length > 20);

  fs.writeFileSync(OUT_JSON, JSON.stringify(records, null, 2));

  fs.writeFileSync(
    OUT_TS,
    `export type UsviHistoryExtractRecord = {
  id: string;
  type: string;
  year: number | null;
  title: string;
  summary: string;
  places: string[];
  people: string[];
  organizations: string[];
  estates: string[];
  historicSites: string[];
  source: {
    title: string;
    file: string;
    paragraph: number;
  };
};

export const usviHistoryExtract = ${JSON.stringify(records, null, 2)} satisfies UsviHistoryExtractRecord[];
`,
  );

  console.log(`Extracted ${records.length} records`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_TS}`);

  if (result.messages.length) {
    console.log("Mammoth messages:");
    for (const message of result.messages) {
      console.log(`- ${message.type}: ${message.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
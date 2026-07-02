// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const HISTORIC_FILE = path.join(ROOT, "src/data/historicSites.ts");
const PLACEHOLDER_DIR = path.join(ROOT, "public/images/historicSite/placeholders");
const BACKUP_DIR = path.join(ROOT, "reports/backups");
const REPORT_FILE = path.join(
  ROOT,
  "reports/created-remaining-historic-site-placeholders.json"
);

const REMAINING = [
  {
    index: 10,
    name: "Columbus Landing Site",
    island: "st_croix",
    beforePath: "/images/historicSite/nrhp-stx-columbus-landing-site.jpg",
  },
  {
    index: 11,
    name: "Danish West India and Guinea Company Warehouse",
    island: "st_croix",
    beforePath: "/images/historicSite/nrhp-stx-danish-west-india-and-guinea-company-warehouse.jpg",
  },
  {
    index: 29,
    name: "Estate Niesky",
    island: "st_thomas",
    beforePath: "/images/historicSite/nrhp-stt-estate-niesky.jpg",
  },
  {
    index: 33,
    name: "Estate St. John",
    island: "st_croix",
    beforePath: "/images/historicSite/nrhp-stx-estate-st-john.jpg",
  },
  {
    index: 37,
    name: "Friedensfeld Midlands Moravian Church and Manse",
    island: "st_croix",
    beforePath: "/images/historicSite/nrhp-stx-friedensfeld-midlands-moravian-church-and-manse.jpg",
  },
  {
    index: 39,
    name: "Ft. Frederik of US Virgin Islands",
    island: "st_croix",
    beforePath: "/images/historicSite/nrhp-stx-ft-frederik-of-us-virgin-islands.jpg",
  },
  {
    index: 41,
    name: "Hamburg-America Shipping Line Administrative Offices",
    island: "st_thomas",
    beforePath: "/images/historicSite/nrhp-stt-hamburg-america-shipping-line-administrative-offices.jpg",
  },
  {
    index: 45,
    name: "Jossie Gut Historic District",
    island: "st_john",
    beforePath: "/images/historicSite/nrhp-stj-jossie-gut-historic-district.jpg",
  },
  {
    index: 47,
    name: "La Grande Princesse School",
    island: "st_croix",
    beforePath: "/images/historicSite/nrhp-stx-la-grande-princesse-school.jpg",
  },
  {
    index: 54,
    name: "More Hill Historic District",
    island: "st_john",
    beforePath: "/images/historicSite/nrhp-stj-more-hill-historic-district.jpg",
  },
  {
    index: 55,
    name: "New Herrnhut Moravian Church",
    island: "st_thomas",
    beforePath: "/images/historicSite/nrhp-stt-new-herrnhut-moravian-church.jpg",
  },
  {
    index: 59,
    name: "Rustenberg Plantation South Historic District",
    island: "st_john",
    beforePath: "/images/historicSite/nrhp-stj-rustenberg-plantation-south-historic-district.jpg",
  },
  {
    index: 67,
    name: "Tutu Plantation House",
    island: "st_thomas",
    beforePath: "/images/historicSite/nrhp-stt-tutu-plantation-house.jpg",
  },
];

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slug(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[’‘]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function islandLabel(island: string) {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  return "U.S. Virgin Islands";
}

function xmlEscape(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars = 30) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;

    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);

  return lines.slice(0, 4);
}

function makeSvg(name: string, island: string) {
  const lines = wrapText(name, 34);
  const escapedIsland = xmlEscape(islandLabel(island));

  const titleLines = lines
    .map((line, index) => {
      const y = 330 + index * 56;
      return `<text x="600" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="700" fill="#3b2a17">${xmlEscape(line)}</text>`;
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${xmlEscape(name)}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5e6c8"/>
      <stop offset="55%" stop-color="#ead1a0"/>
      <stop offset="100%" stop-color="#cfa86a"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#fff8df" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#8f5f2f" stop-opacity="0.16"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#paper)"/>
  <rect x="38" y="38" width="1124" height="724" rx="34" fill="url(#glow)" stroke="#7a4a22" stroke-width="5"/>
  <path d="M155 198 C300 130 443 218 594 160 C742 104 880 166 1032 124" fill="none" stroke="#7a4a22" stroke-width="7" opacity="0.25"/>
  <path d="M162 612 C322 538 472 650 612 584 C752 518 890 580 1038 520" fill="none" stroke="#7a4a22" stroke-width="7" opacity="0.22"/>
  <circle cx="600" cy="190" r="68" fill="none" stroke="#6f3f1d" stroke-width="8" opacity="0.5"/>
  <path d="M600 136 L614 188 L668 190 L624 220 L640 272 L600 242 L560 272 L576 220 L532 190 L586 188 Z" fill="#7a4a22" opacity="0.5"/>
  <text x="600" y="270" text-anchor="middle" font-family="Georgia, serif" font-size="25" letter-spacing="4" fill="#6f3f1d">HISTORIC SITE</text>
  ${titleLines}
  <text x="600" y="610" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" fill="#5c3b1d">${escapedIsland}</text>
  <text x="600" y="668" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#7a4a22" opacity="0.82">Placeholder image · replace with site photography when available</text>
</svg>
`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function main() {
  if (!existsSync(HISTORIC_FILE)) {
    throw new Error(`Missing file: ${HISTORIC_FILE}`);
  }

  mkdirSync(PLACEHOLDER_DIR, { recursive: true });
  mkdirSync(BACKUP_DIR, { recursive: true });

  const backupFile = path.join(
    BACKUP_DIR,
    `historicSites.remaining-placeholders.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  let text = readFileSync(HISTORIC_FILE, "utf8");
  copyFileSync(HISTORIC_FILE, backupFile);

  const applied = [];
  const skipped = [];

  for (const item of REMAINING) {
    const placeholderName = `${slug(item.name)}.svg`;
    const absPlaceholder = path.join(PLACEHOLDER_DIR, placeholderName);
    const publicPath = `/images/historicSite/placeholders/${placeholderName}`;

    writeFileSync(absPlaceholder, makeSvg(item.name, item.island));

    const beforeLiteral = JSON.stringify(item.beforePath);
    const afterLiteral = JSON.stringify(publicPath);

    const occurrences = (
      text.match(new RegExp(escapeRegExp(beforeLiteral), "g")) || []
    ).length;

    if (occurrences < 1) {
      skipped.push({
        ...item,
        publicPath,
        reason: "before_path_not_found",
      });
      continue;
    }

    text = text.replace(new RegExp(escapeRegExp(beforeLiteral), "g"), afterLiteral);

    applied.push({
      ...item,
      publicPath,
      placeholderFile: path.relative(ROOT, absPlaceholder),
      occurrences,
    });
  }

  writeFileSync(HISTORIC_FILE, text);

  writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, HISTORIC_FILE),
        backupFile: path.relative(ROOT, backupFile),
        placeholderDir: path.relative(ROOT, PLACEHOLDER_DIR),
        attempted: REMAINING.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Remaining historic site placeholders created.");
  console.log(`Attempted: ${REMAINING.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

  console.table(
    applied.map((item) => ({
      index: item.index,
      name: item.name,
      image: item.publicPath,
      occurrences: item.occurrences,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();

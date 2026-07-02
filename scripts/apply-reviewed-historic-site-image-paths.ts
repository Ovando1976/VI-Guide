// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import * as historicModule from "../src/data/historicSites";

const ROOT = process.cwd();

const HISTORIC_FILE = path.join(ROOT, "src/data/historicSites.ts");
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-reviewed-historic-site-image-paths.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const historicSites =
  historicModule.historicSites ||
  historicModule.HISTORIC_SITES ||
  historicModule.default ||
  Object.values(historicModule).find((value) => Array.isArray(value));

if (!Array.isArray(historicSites)) {
  throw new Error("Could not find historicSites array export in src/data/historicSites.ts");
}

const REVIEWED_IMAGE_UPDATES = [
  {
    index: 1,
    name: "Bethlehem Middle Works Historic District",
    beforePath: "/images/historicSite/nrhp-stx-bethlehem-middle-works-historic-district.jpg",
    afterPath: "/images/dictionary/bethlehem.svg",
  },
  {
    index: 4,
    name: "Catherineberg-Jockumsdahl-Herman Farm",
    beforePath: "/images/historicSite/nrhp-stj-catherineberg-jockumsdahl-herman-farm.jpg",
    afterPath: "/images/dictionary/catherineberg.svg",
  },
  {
    index: 13,
    name: "Diamond School",
    beforePath: "/images/historicSite/nrhp-stx-diamond-school.jpg",
    afterPath: "/images/dictionary/diamond.svg",
  },
  {
    index: 14,
    name: "Emmaus Moravian Church and Manse",
    beforePath: "/images/historicSite/nrhp-stj-emmaus-moravian-church-and-manse.jpg",
    afterPath: "/images/dictionary/emmaus.svg",
  },
  {
    index: 19,
    name: "Estate Butler's Bay",
    beforePath: "/images/historicSite/nrhp-stx-estate-butlers-bay.jpg",
    afterPath: "/images/estate/butlers-bay.svg",
  },
  {
    index: 20,
    name: "Estate Carolina Sugar Plantation",
    beforePath: "/images/historicSite/nrhp-stj-estate-carolina-sugar-plantation.jpg",
    afterPath: "/images/dictionary/carolina.svg",
  },
  {
    index: 23,
    name: "Estate Hogansborg",
    beforePath: "/images/historicSite/nrhp-stx-estate-hogansborg.jpg",
    afterPath: "/images/dictionary/hogensborg.svg",
  },
  {
    index: 24,
    name: "Estate Judith's Fancy",
    beforePath: "/images/historicSite/nrhp-stx-estate-judiths-fancy.jpg",
    afterPath: "/images/dictionary/judiths-fancy.svg",
  },
  {
    index: 34,
    name: "Fort Frederick",
    beforePath: "/images/historicSite/nrhp-stx-fort-frederick.jpg",
    afterPath: "/images/historicSite/fort-frederik.jpg",
  },
  {
    index: 38,
    name: "Friedensthal Mission",
    beforePath: "/images/historicSite/nrhp-stx-friedensthal-mission.jpg",
    afterPath: "/images/estate/friedensthal.svg",
  },
  {
    index: 40,
    name: "Green Kay",
    beforePath: "/images/historicSite/nrhp-stx-green-kay.jpg",
    afterPath: "/images/dictionary/green-cay.svg",
  },
  {
    index: 43,
    name: "Hassel Island Historic District (Boundary Increase)",
    beforePath: "/images/historicSite/nrhp-stt-hassel-island-boundary-increase.jpg",
    afterPath: "/images/dictionary/hassel-island.svg",
  },
  {
    index: 46,
    name: "L'Esperance Historic District",
    beforePath: "/images/historicSite/nrhp-stj-lesperance-historic-district.jpg",
    afterPath: "/images/dictionary/lesperance.svg",
  },
  {
    index: 50,
    name: "Lind Point Fort",
    beforePath: "/images/historicSite/nrhp-stj-lind-point-fort.jpg",
    afterPath: "/images/dictionary/lind-point.svg",
  },
  {
    index: 52,
    name: "Mafolie Great House",
    beforePath: "/images/historicSite/nrhp-stt-mafolie-great-house.jpg",
    afterPath: "/images/dictionary/mafolie.svg",
  },
  {
    index: 56,
    name: "Reef Bay Great House Historic District",
    beforePath: "/images/historicSite/nrhp-stj-reef-bay-great-house-historic-district.jpg",
    afterPath: "/images/dictionary/reef-bay.svg",
  },
  {
    index: 57,
    name: "Reef Bay Sugar Factory Historic District",
    beforePath: "/images/historicSite/nrhp-stj-reef-bay-sugar-factory-historic-district.jpg",
    afterPath: "/images/dictionary/reef-bay.svg",
  },
  {
    index: 58,
    name: "Richmond Prison Detention and Workhouse",
    beforePath: "/images/historicSite/nrhp-stx-richmond-prison-detention-and-workhouse.jpg",
    afterPath: "/images/dictionary/richmond.svg",
  },
  {
    index: 64,
    name: "St. Thomas Synagogue--Beracha Veshalom Vegemiluth Hasadim",
    beforePath: "/images/historicSite/nrhp-stt-st-thomas-synagogue-beracha.jpg",
    afterPath: "/images/historicSite/st-thomas-synagogue.jpg",
  },
  {
    index: 66,
    name: "Trunk Bay Sugar Factory",
    beforePath: "/images/historicSite/nrhp-stj-trunk-bay-sugar-factory.jpg",
    afterPath: "/images/dictionary/trunk-bay.svg",
  },
];

const DEFERRED_REVIEW = [
  {
    index: 11,
    name: "Danish West India and Guinea Company Warehouse",
    reason: "Candidate /images/dictionary/company.svg is too generic.",
  },
  {
    index: 37,
    name: "Friedensfeld Midlands Moravian Church and Manse",
    reason: "Candidate /images/dictionary/midland.svg is related but too broad.",
  },
  {
    index: 47,
    name: "La Grande Princesse School",
    reason: "Candidate /images/dictionary/prince.svg is too generic.",
  },
];

type ObjSpan = {
  start: number;
  end: number;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pathExistsFromPublic(publicPath: string) {
  if (!publicPath || typeof publicPath !== "string") return false;

  const clean = publicPath.split("?")[0].trim();
  if (!clean.startsWith("/")) return false;

  return existsSync(path.join(ROOT, "public", clean.slice(1)));
}

function findMatchingBracket(text: string, openIndex: number) {
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") depth += 1;

    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findTopLevelObjectSpans(text: string, arrayStart: number, arrayEnd: number): ObjSpan[] {
  const spans: ObjSpan[] = [];

  let quote = "";
  let escaped = false;
  let objectDepth = 0;
  let bracketDepth = 0;
  let objectStart = -1;

  for (let i = arrayStart + 1; i < arrayEnd; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth -= 1;
      continue;
    }

    if (ch === "{") {
      if (objectDepth === 0 && bracketDepth === 0) objectStart = i;
      objectDepth += 1;
      continue;
    }

    if (ch === "}") {
      objectDepth -= 1;

      if (objectDepth === 0 && bracketDepth === 0 && objectStart >= 0) {
        spans.push({ start: objectStart, end: i + 1 });
        objectStart = -1;
      }
    }
  }

  return spans;
}

function bracketPositionsOutsideStrings(text: string): number[] {
  const positions: number[] = [];

  let quote = "";
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") positions.push(i);
  }

  return positions;
}

function findArrayWithObjectCount(text: string, expectedRecords: number) {
  let best = { start: -1, end: -1, spans: [] as ObjSpan[] };

  for (const start of bracketPositionsOutsideStrings(text)) {
    const end = findMatchingBracket(text, start);
    if (end < 0) continue;

    const spans = findTopLevelObjectSpans(text, start, end);

    if (spans.length === expectedRecords) {
      return { start, end, spans };
    }

    if (spans.length > best.spans.length) {
      best = { start, end, spans };
    }
  }

  throw new Error(
    `Could not find historicSites array. Closest object count: ${best.spans.length}; expected ${expectedRecords}`
  );
}

function replaceAllStringLiteral(objectText: string, beforePath: string, afterPath: string) {
  const beforeLiteral = JSON.stringify(beforePath);
  const afterLiteral = JSON.stringify(afterPath);

  return objectText.replace(new RegExp(escapeRegExp(beforeLiteral), "g"), afterLiteral);
}

function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const text = readFileSync(HISTORIC_FILE, "utf8");
  const array = findArrayWithObjectCount(text, historicSites.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `historicSites.reviewed-image-paths.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(HISTORIC_FILE, backupFile);

  const applied = [];
  const skipped = [];

  const replacements = REVIEWED_IMAGE_UPDATES.map((update) => {
    const record = historicSites[update.index];
    const span = spans[update.index];

    if (!record || !span) {
      skipped.push({ ...update, reason: "record_or_span_not_found" });
      return null;
    }

    if (!pathExistsFromPublic(update.afterPath)) {
      skipped.push({ ...update, reason: "target_image_missing_under_public" });
      return null;
    }

    const beforeObject = text.slice(span.start, span.end);
    const occurrences = (
      beforeObject.match(new RegExp(escapeRegExp(JSON.stringify(update.beforePath)), "g")) || []
    ).length;

    if (occurrences < 1) {
      skipped.push({ ...update, reason: "before_path_not_found_inside_record" });
      return null;
    }

    const afterObject = replaceAllStringLiteral(beforeObject, update.beforePath, update.afterPath);

    applied.push({
      ...update,
      occurrences,
    });

    return {
      start: span.start,
      end: span.end,
      replacement: afterObject,
    };
  })
    .filter(Boolean)
    .sort((a: any, b: any) => b.start - a.start);

  let nextText = text;

  for (const replacement of replacements) {
    nextText =
      nextText.slice(0, replacement.start) +
      replacement.replacement +
      nextText.slice(replacement.end);
  }

  writeFileSync(HISTORIC_FILE, nextText);

  writeFileSync(
    APPLY_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, HISTORIC_FILE),
        backupFile: path.relative(ROOT, backupFile),
        reviewedUpdates: REVIEWED_IMAGE_UPDATES.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
        deferredReview: DEFERRED_REVIEW,
      },
      null,
      2
    )
  );

  console.log("Reviewed historic site image paths applied.");
  console.log(`Reviewed updates: ${REVIEWED_IMAGE_UPDATES.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, APPLY_REPORT_FILE)}`);

  console.table(
    applied.map((item) => ({
      index: item.index,
      name: item.name,
      image: item.afterPath,
      occurrences: item.occurrences,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }

  console.log("\nDeferred:");
  console.table(DEFERRED_REVIEW);
}

main();

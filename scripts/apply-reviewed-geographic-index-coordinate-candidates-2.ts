// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();

const INDEX_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const CANDIDATE_REPORT_FILE = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates-full.json"
);
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-reviewed-geographic-index-coordinate-candidates-2.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

/**
 * Manual allowlist from the reviewed official sample.
 * These are safe area/estate/nearby landmark matches.
 * Do NOT add broad false matches here.
 */
const REVIEWED_ALLOWLIST = new Map([
  [15, "Anguilla Point"],
  [32, "Annaly School"],
  [157, "Bolongo Bay"],
  [160, "Bolongo Point"],
  [168, "Bonne Esperance Estate"],
  [184, "Bordeaux Point"],
  [195, "Botany Point"],
  [201, "Bovoni Bay"],
  [219, "Brown Bay"],
  [325, "Caneel Bay Ruins"],
  [330, "Canegarden Bay"],
  [352, "Caret Point"],
  [467, "Cinnamon Bay Road"],
  [538, "Cooper Bay"],
  [663, "Dorothea Bay"],
  [664, "Dorothea Point"],
  [778, "Fareham Bay"],
  [828, "Fortuna Bay"],
  [957, "Great Bordeaux Bay"],
  [968, "Great Pond Bay"],
  [970, "Great Saint James"],
  [1046, "Hassel Island"],
  [1059, "Havensight Point"],
  [1218, "Johns Folly Bay"],
  [1404, "Leinster Bay Ruins"],
  [1525, "Lovenlund Bay"],
  [1549, "Mafolie Road"],
  [1553, "Maho"],
  [1557, "Maho Point"],
  [1725, "Nazareth Bay"],
  [1774, "Northside Bay"],
  [1775, "Northside Road"],
  [1840, "Oxford Road"],
  [1897, "Perseverance Bay"],
  [2206, "Ruby Estate"],
  [2245, "Saint James Bay"],
  [2274, "Santa Maria Bay"],
  [2339, "Smith Bay Road"],
  [2418, "St. James Bay"],
  [2501, "The Glynn"],
  [60, "Battery Beach"],
  [87, "Bellevue Hill"],
  [104, "Bethesda Hill"],
  [107, "Bethlehem Gut"],
  [108, "Bethlehem Hill"],
  [164, "Bonne EspBrance Road"],
  [181, "Bordeaux Klyne Bay"],
  [217, "Brookhill Estate"],
  [233, "Buck Island Bar"],
  [245, "Bulow'a-Minde"],
  [250, "Bulowsminde Hill"],
  [258, "Butler Bay"],
  [260, "Butler Point"],
  [288, "Caledonia Gut"],
  [289, "Caledonia Hill"],
  [326, "Caneel Hill"],
  [354, "Caretbay Gut"],
  [368, "Caroline"],
  [376, "Carty"],
  [377, "Carty Bay"],
  [378, "Carty Point"],
  [435, "Charlotte Amalie Harbor Historic Maps"],
  [457, "Christiansted Government and Harbor Records"],
  [458, "Christiansted Harbor"],
  [466, "Cinnamon Bay Plantation and Archaeology Records"],
  [491, "Coculus Bay"],
  [492, "Coculus Point"],
  [513, "Concordia Hill"],
  [520, "Conoordia"],
  [528, "Contant Hill"],
  [592, "Crown Bay"],
  [653, "Dog-Island Cut"],
  [660, "Donoe Hill"],
  [728, "Elizabeth Hill"],
  [807, "Flat Cay"],
  [817, "Fort Christian Administrative and Military Records"],
  [820, "Fort Frederik and Emancipation Records"],
  [869, "French Bay"],
  [871, "French Bay Road"],
  [900, "George Hill"],
  [963, "Great Lameshur Bay"],
  [976, "Greencay"],
  [993, "Groveplace"],
  [1049, "Hassel Island Maritime and Military Records"],
  [1057, "Havenbight"],
  [1099, "Honduras Hill or Gallows Hill"],
  [1162, "Isaac Point"],
  [1228, "Judith Point"],
  [1256, "Kermon Hill"],
  [1283, "Klein Cane Bay"],
  [1284, "Klein Cinnamon Road"],
  [1361, "Lagrange"],
  [1368, "Lameshur"],
  [1369, "Lameshur Bay"],
  [1372, "Lameshur Plantation"],
  [1383, "Lareine"],
  [1405, "Leinster Hill"],
  [1409, "Lerken Bay"],
  [1451, "Little Bordeaux Bay"],
  [1460, "Little Fountain Hill"],
  [1462, "Little Green Cay"],
  [1463, "Little Hans-Lollik"],
  [1475, "Little Plantation"],
  [1477, "Little Princeasa"],
  [1520, "Lovango Cny"],
  [1542, "Ma FoLie"],
]);

const BLOCKLIST = new Map([
  [77, "Beck Grove -> GROVE PLACE is not safe enough."],
  [127, "Black Point -> Blackbeard\u2019s Castle is a false match."],
  [141, "Blue Mountain -> MOUNTAIN is too broad."],
  [304, "Camporico Raltpond -> GREAT POND is too uncertain."],
  [397, "Catharina's Hope -> HOPE is too broad."],
  [400, "Catherine's Hope -> HOPE is too broad."],
  [566, "Cottongrove Hill -> GROVE PLACE is too broad."],
  [927, "Goodhope Bay -> HOPE is too broad."],
  [1207, "Johiison Reef -> REEF BAY is too broad."],
  [1220, "Johnson Reef -> REEF BAY is too broad."],
  [1287, "Klein Reef -> REEF BAY is too broad."],
  [1540, "Lutheran church -> Frederick Lutheran Church is too generic."],
]);

function findMatchingBracket(text: string, openIndex: number) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
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

function findTopLevelObjectSpans(text: string, arrayStart: number, arrayEnd: number) {
  const spans = [];

  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let objectDepth = 0;
  let bracketDepth = 0;
  let objectStart = -1;

  for (let i = arrayStart + 1; i < arrayEnd; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
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

function bracketPositionsOutsideStrings(text: string) {
  const positions = [];

  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
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
  let best = { start: -1, end: -1, spans: [] };

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
    `Could not find geographicIndex array. Closest object count: ${best.spans.length}; expected ${expectedRecords}`
  );
}

function hasCoordinateProperty(objectText: string) {
  return (
    /\bcoordinates\s*:\s*\{/.test(objectText) ||
    /["']coordinates["']\s*:\s*\{/.test(objectText) ||
    /\blat\s*:\s*-?\d/.test(objectText) ||
    /\blng\s*:\s*-?\d/.test(objectText) ||
    /\blatitude\s*:\s*-?\d/.test(objectText) ||
    /\blongitude\s*:\s*-?\d/.test(objectText) ||
    /\bgeometry\s*:/.test(objectText) ||
    /["']geometry["']\s*:/.test(objectText)
  );
}

function setCoordinatesInObject(objectText: string, lat: number, lng: number) {
  if (hasCoordinateProperty(objectText)) return objectText;

  const coordLine = `"coordinates": { "lat": ${lat}, "lng": ${lng} },`;

  const nullPatterns = [
    /(^[ \t]*["']coordinates["']\s*:\s*)null\s*,?/m,
    /(^[ \t]*coordinates\s*:\s*)null\s*,?/m,
    /(^[ \t]*["']center["']\s*:\s*)null\s*,?/m,
    /(^[ \t]*center\s*:\s*)null\s*,?/m,
    /(^[ \t]*["']centroid["']\s*:\s*)null\s*,?/m,
    /(^[ \t]*centroid\s*:\s*)null\s*,?/m,
  ];

  for (const pattern of nullPatterns) {
    if (pattern.test(objectText)) {
      return objectText.replace(pattern, `$1{ "lat": ${lat}, "lng": ${lng} },`);
    }
  }

  const nameMatch =
    objectText.match(/^[ \t]*(["']name["']|name)\s*:\s*["'][^"']*["']\s*,?\n/m) ||
    objectText.match(/^[ \t]*(["']title["']|title)\s*:\s*["'][^"']*["']\s*,?\n/m) ||
    objectText.match(/^[ \t]*(["']id["']|id)\s*:\s*["'][^"']*["']\s*,?\n/m);

  const indent = nameMatch?.[0]?.match(/^[ \t]*/)?.[0] || "    ";
  const line = `${indent}${coordLine}\n`;

  if (nameMatch && typeof nameMatch.index === "number") {
    const insertAt = nameMatch.index + nameMatch[0].length;
    return objectText.slice(0, insertAt) + line + objectText.slice(insertAt);
  }

  return objectText.replace("{\n", "{\n" + line);
}

function main() {
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Missing file: ${INDEX_FILE}`);
  }

  if (!existsSync(CANDIDATE_REPORT_FILE)) {
    throw new Error(`Missing candidate report: ${CANDIDATE_REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const candidateReport = JSON.parse(readFileSync(CANDIDATE_REPORT_FILE, "utf8"));

  const proposalsByIndex = new Map(
    candidateReport.proposals.map((proposal) => [proposal.index, proposal])
  );

  const reviewedCandidates = [];

  for (const [index, expectedName] of REVIEWED_ALLOWLIST.entries()) {
    const proposal = proposalsByIndex.get(index);

    if (!proposal) {
      reviewedCandidates.push({
        index,
        expectedName,
        missingProposal: true,
      });
      continue;
    }

    reviewedCandidates.push(proposal);
  }

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findArrayWithObjectCount(text, geographicIndex.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.reviewed-coordinate-candidates.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const applied = [];
  const skipped = [];

  const replacements = reviewedCandidates
    .map((proposal) => {
      if (proposal.missingProposal) {
        skipped.push({
          index: proposal.index,
          name: proposal.expectedName,
          reason: "proposal_not_found_in_latest_candidate_report",
        });
        return null;
      }

      const expectedName = REVIEWED_ALLOWLIST.get(proposal.index);

      if (proposal.name !== expectedName) {
        skipped.push({
          index: proposal.index,
          expectedName,
          foundName: proposal.name,
          reason: "name_mismatch_guard",
        });
        return null;
      }

      if (BLOCKLIST.has(proposal.index)) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: BLOCKLIST.get(proposal.index),
        });
        return null;
      }

      if (!proposal.bestMatch) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "no_best_match",
        });
        return null;
      }

      if (
        !Number.isFinite(proposal.bestMatch.lat) ||
        !Number.isFinite(proposal.bestMatch.lng)
      ) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "candidate_coordinates_invalid",
        });
        return null;
      }

      const span = spans[proposal.index];

      if (!span) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "record_span_not_found",
        });
        return null;
      }

      const beforeObject = text.slice(span.start, span.end);
      const afterObject = setCoordinatesInObject(
        beforeObject,
        proposal.bestMatch.lat,
        proposal.bestMatch.lng
      );

      if (afterObject === beforeObject) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "already_has_coordinates_or_no_change",
        });
        return null;
      }

      applied.push({
        index: proposal.index,
        id: proposal.id,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
        coordinates: {
          lat: proposal.bestMatch.lat,
          lng: proposal.bestMatch.lng,
        },
        candidate: {
          source: proposal.bestMatch.source,
          sourceIndex: proposal.bestMatch.sourceIndex,
          name: proposal.bestMatch.name,
          id: proposal.bestMatch.id,
          reason: proposal.bestMatch.reason,
          score: proposal.bestScore,
        },
      });

      return {
        start: span.start,
        end: span.end,
        replacement: afterObject,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.start - a.start);

  let nextText = text;

  for (const replacement of replacements) {
    nextText =
      nextText.slice(0, replacement.start) +
      replacement.replacement +
      nextText.slice(replacement.end);
  }

  writeFileSync(INDEX_FILE, nextText);

  writeFileSync(
    APPLY_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        candidateReport: path.relative(ROOT, CANDIDATE_REPORT_FILE),
        reviewedAllowlist: REVIEWED_ALLOWLIST.size,
        blocklist: [...BLOCKLIST.entries()].map(([index, reason]) => ({ index, reason })),
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Reviewed geographic index coordinate candidates batch 2 applied.");
  console.log(`Reviewed allowlist: ${REVIEWED_ALLOWLIST.size}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, APPLY_REPORT_FILE)}`);

  console.table(
    applied.map((record) => ({
      index: record.index,
      name: record.name,
      type: record.type,
      island: record.island,
      lat: record.coordinates.lat,
      lng: record.coordinates.lng,
      candidate: record.candidate.name,
      reason: record.candidate.reason,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();

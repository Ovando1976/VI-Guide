import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const reportPath = path.join(ROOT, "reports/data-pipeline-deep-doctor.json");

const results = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  checks: [],
  warnings: [],
  errors: [],
};

function rel(file) {
  return path.relative(ROOT, file);
}

function ok(id, message, extra = {}) {
  results.checks.push({ status: "ok", id, message, ...extra });
}

function warn(id, message, extra = {}) {
  results.warnings.push({ id, message, ...extra });
  results.checks.push({ status: "warning", id, message, ...extra });
}

function error(id, message, extra = {}) {
  results.errors.push({ id, message, ...extra });
  results.checks.push({ status: "error", id, message, ...extra });
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    error(`json:${rel(file)}`, `Could not parse JSON: ${err.message}`);
    return null;
  }
}

function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick(props, keys) {
  for (const key of keys) {
    const value = props?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return "";
}

function fileExists(file, required = true) {
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    ok(`file:${rel(file)}`, `Found ${rel(file)}`, { bytes: stat.size });
    return true;
  }

  if (required) error(`file:${rel(file)}`, `Missing required file: ${rel(file)}`);
  else warn(`file:${rel(file)}`, `Missing optional file: ${rel(file)}`);
  return false;
}

function checkGeoJson(file, label) {
  if (!fileExists(file)) return null;

  const data = readJson(file);
  if (!data) return null;

  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    error(`geojson:${label}`, `${rel(file)} is not a valid FeatureCollection.`);
    return null;
  }

  ok(`geojson:${label}`, `${label} FeatureCollection is valid.`, {
    features: data.features.length,
  });

  return data;
}

const requiredFiles = [
  "public/geo/usvi-estates.geojson",
  "public/geo/usvi-parcels.geojson",
  "public/geo/usvi-heat.geojson",
  "public/data/estate-search-index.json",
  "src/data/history/books/historyKnowledge.ts",
  "src/components/maps/IslandMap.tsx",
  "src/components/Maps.tsx",
  "src/pages/estates/EstateDetailPage.tsx",
];

for (const file of requiredFiles) {
  fileExists(path.join(ROOT, file));
}

const estatesGeo = checkGeoJson(path.join(ROOT, "public/geo/usvi-estates.geojson"), "estates");
checkGeoJson(path.join(ROOT, "public/geo/usvi-parcels.geojson"), "parcels");
checkGeoJson(path.join(ROOT, "public/geo/usvi-heat.geojson"), "heat");

if (estatesGeo) {
  const estateRows = estatesGeo.features.map((feature, index) => {
    const p = feature.properties || {};
    const name = pick(p, [
      "canonicalName",
      "displayName",
      "officialName",
      "name",
      "NAME",
      "estate",
      "ESTATE",
      "baseName",
      "fullName",
      "label",
      "LABEL",
    ]);

    const id = pick(p, [
      "canonicalEstateId",
      "sourceObjectId",
      "SOURCE_OBJECT_ID",
      "geoid",
      "GEOID",
      "estateId",
      "ESTATE_ID",
      "officialId",
      "officialID",
      "id",
      "ID",
    ]);

    return {
      index,
      id: String(id ?? "").trim(),
      name: String(name ?? "").trim(),
      slug: norm(name),
      canonicalEstateId: p.canonicalEstateId,
      sourceObjectId: p.sourceObjectId ?? p.SOURCE_OBJECT_ID,
      geoid: p.geoid ?? p.GEOID,
      quarter: p.canonicalQuarter ?? p.quarter ?? p.QUARTER ?? p.quarterGroup,
      island: p.canonicalIsland ?? p.island ?? p.ISLAND,
    };
  });

  const bovoni = estateRows.filter(
    (row) =>
      row.slug.includes("bovoni") ||
      String(row.canonicalEstateId ?? "").toLowerCase().includes("bovoni"),
  );

  if (bovoni.length < 2) {
    warn("estate:bovoni-records", "Expected separate Bovoni and Bovoni Cay estate records.", {
      bovoni,
    });
  } else {
    ok("estate:bovoni-records", "Found Bovoni-related records.", { bovoni });
  }

  const hasBovoni = bovoni.some((row) => row.slug === "bovoni");
  const hasBovoniCay = bovoni.some((row) => row.slug === "bovoni-cay");

  if (!hasBovoni || !hasBovoniCay) {
    error("estate:bovoni-separation", "Bovoni and Bovoni Cay are not both present as separate names.", {
      bovoni,
    });
  } else {
    ok("estate:bovoni-separation", "Bovoni and Bovoni Cay exist as separate estate names.");
  }

  const bovoniIds = new Map();
  for (const row of bovoni) {
    const key = row.canonicalEstateId || row.sourceObjectId || row.geoid || row.id || "(missing)";
    if (!bovoniIds.has(key)) bovoniIds.set(key, []);
    bovoniIds.get(key).push(row);
  }

  const badGroups = [...bovoniIds.entries()].filter(([, group]) => group.length > 1);
  if (badGroups.length) {
    error("estate:bovoni-id-collision", "Bovoni records still share an ID.", { groups: badGroups });
  } else {
    ok("estate:bovoni-id-collision", "Bovoni records have separate IDs.", {
      ids: [...bovoniIds.keys()],
    });
  }

  const substringCollisions = [];
  for (const a of estateRows) {
    for (const b of estateRows) {
      if (a.index >= b.index) continue;
      if (!a.slug || !b.slug || a.slug === b.slug) continue;
      if (a.slug.includes(b.slug) || b.slug.includes(a.slug)) {
        substringCollisions.push({
          a: { index: a.index, id: a.id, name: a.name, slug: a.slug },
          b: { index: b.index, id: b.id, name: b.name, slug: b.slug },
        });
      }
    }
  }

  if (substringCollisions.length) {
    warn("estate:substring-collisions", "Estate substring name collisions exist. Highlighting must use exact IDs.", {
      count: substringCollisions.length,
      examples: substringCollisions.slice(0, 25),
    });
  } else {
    ok("estate:substring-collisions", "No estate substring collisions found.");
  }
}

const islandMapFile = path.join(ROOT, "src/components/maps/IslandMap.tsx");
const islandMap = readText(islandMapFile);

if (islandMap.includes("name.includes(target)") || islandMap.includes("target.includes(name)") || islandMap.includes("includes(target)")) {
  error("map:fuzzy-highlight", "IslandMap still contains fuzzy estate highlight matching.");
} else {
  ok("map:fuzzy-highlight", "IslandMap does not contain the known fuzzy estate highlight pattern.");
}

if (islandMap.includes("canonicalEstateId") || islandMap.includes("sourceObjectId") || islandMap.includes("GEOID")) {
  ok("map:id-highlight", "IslandMap appears to use ID fields for estate highlighting.");
} else {
  warn("map:id-highlight", "IslandMap may not be using ID fields for estate highlighting.");
}

const estateDetailFile = path.join(ROOT, "src/pages/estates/EstateDetailPage.tsx");
const estateDetail = readText(estateDetailFile);

if (estateDetail.includes("highlightEstate={title}")) {
  error("estate-detail:ambiguous-highlight", "EstateDetailPage still passes title as highlightEstate.");
} else if (estateDetail.includes("highlightEstate={estateId || title}")) {
  ok("estate-detail:highlight-id", "EstateDetailPage passes estateId first for highlightEstate.");
} else {
  warn("estate-detail:highlight-id", "Could not confirm EstateDetailPage highlightEstate uses estateId first.");
}

if ((estateDetail.match(/focusTarget=/g) || []).length > 1) {
  error("estate-detail:duplicate-focus-target", "EstateDetailPage has multiple focusTarget props.");
} else {
  ok("estate-detail:duplicate-focus-target", "EstateDetailPage has no duplicate focusTarget prop.");
}

const historyKnowledgeFile = path.join(ROOT, "src/data/history/books/historyKnowledge.ts");
const historyKnowledge = readText(historyKnowledgeFile);

const unsafeHistoryPatterns = [
  "record.places.includes",
  "record.people.includes",
  "record.estates.includes",
  "record.topics.includes",
  "record.places.map",
  "record.people.map",
  "record.estates.map",
  "record.topics.map",
  "record.places.filter",
  "record.people.filter",
  "record.estates.filter",
  "record.topics.filter",
];

const foundUnsafe = unsafeHistoryPatterns.filter((pattern) => historyKnowledge.includes(pattern));

if (foundUnsafe.length) {
  error("history:unsafe-array-access", "historyKnowledge.ts still has unsafe array access.", {
    patterns: foundUnsafe,
  });
} else {
  ok("history:unsafe-array-access", "historyKnowledge.ts has no known unsafe record array access.");
}

if (historyKnowledge.includes("function asStringArray") || historyKnowledge.includes("Array.isArray")) {
  ok("history:safe-array-helper", "historyKnowledge.ts includes array safety handling.");
} else {
  warn("history:safe-array-helper", "historyKnowledge.ts may not include array safety handling.");
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2) + "\n");

console.log("");
console.log("Deep Data Pipeline Doctor");
console.log("=========================");
console.log(`Checks: ${results.checks.length}`);
console.log(`Warnings: ${results.warnings.length}`);
console.log(`Errors: ${results.errors.length}`);
console.log(`Report: ${rel(reportPath)}`);

if (results.errors.length) {
  console.log("");
  console.log("Errors");
  console.log("------");
  for (const item of results.errors) {
    console.log(`- ${item.id}: ${item.message}`);
  }
  process.exit(1);
}

if (results.warnings.length) {
  console.log("");
  console.log("Warnings");
  console.log("--------");
  for (const item of results.warnings) {
    console.log(`- ${item.id}: ${item.message}`);
  }
}

console.log("");
console.log("Data pipeline deep doctor passed.");

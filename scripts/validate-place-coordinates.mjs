import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("src/data");

const FILES = [
  "restaurants-st-thomas.json",
  "restaurants-st-john.json",
  "restaurants-st-croix.json",
  "restaurants-water-island.json",
  "attractions.json",
  "transportation.json",
  "ferry-terminals.json",
  "cruise-ports.json",
  "shopping.json",
  "nightlife.json",
  "hiking-trails.json",
  "historic-sites.json",
  "beaches.json",
];

function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return { fileName, exists: false, records: [] };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("File does not contain a JSON array.");
    }

    return { fileName, exists: true, records: parsed };
  } catch (error) {
    return {
      fileName,
      exists: true,
      records: [],
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function getCoordinates(record) {
  const lat =
    record?.coordinates?.lat ??
    record?.lat ??
    record?.latitude ??
    record?.centroid?.lat ??
    record?.location?.lat;

  const lng =
    record?.coordinates?.lng ??
    record?.lng ??
    record?.longitude ??
    record?.centroid?.lng ??
    record?.location?.lng;

  return { lat, lng };
}

function isValidCoordinate(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function validateRecord(record, fileName, index) {
  const { lat, lng } = getCoordinates(record);
  const valid = isValidCoordinate(lat, lng);

  return {
    valid,
    fileName,
    index,
    slug: record?.slug ?? record?.id ?? `record-${index}`,
    title: record?.title ?? record?.name ?? record?.businessName ?? "Untitled",
    islandCode: record?.islandCode ?? record?.island ?? record?.islandId ?? "",
    category: record?.category ?? record?.type ?? "",
    lat,
    lng,
  };
}

const results = FILES.flatMap((fileName) => {
  const file = readJson(fileName);

  if (!file.exists) {
    return [
      {
        valid: false,
        fileName,
        missingFile: true,
        title: "Missing file",
        slug: "",
        islandCode: "",
        category: "",
      },
    ];
  }

  if (file.parseError) {
    return [
      {
        valid: false,
        fileName,
        parseError: file.parseError,
        title: "Parse error",
        slug: "",
        islandCode: "",
        category: "",
      },
    ];
  }

  return file.records.map((record, index) =>
    validateRecord(record, fileName, index)
  );
});

const valid = results.filter((item) => item.valid);
const invalid = results.filter((item) => !item.valid);

const byFile = FILES.map((fileName) => {
  const fileResults = results.filter((item) => item.fileName === fileName);
  const ok = fileResults.filter((item) => item.valid).length;
  const bad = fileResults.filter((item) => !item.valid).length;

  return { fileName, total: fileResults.length, ok, bad };
});

console.log("\nUSVI Coordinate Validation\n");

for (const item of byFile) {
  console.log(
    `${item.bad === 0 ? "✓" : "✗"} ${item.fileName}: ${item.ok}/${
      item.total
    } valid`
  );
}

console.log("\nSummary");
console.log(`Valid: ${valid.length}`);
console.log(`Missing/Invalid: ${invalid.length}`);

if (invalid.length > 0) {
  console.log("\nMissing or invalid coordinates:\n");

  for (const item of invalid) {
    if (item.missingFile) {
      console.log(`- ${item.fileName}: file missing`);
      continue;
    }

    if (item.parseError) {
      console.log(`- ${item.fileName}: JSON parse error: ${item.parseError}`);
      continue;
    }

    console.log(
      `- ${item.fileName} → ${item.title} (${item.slug}) | island=${
        item.islandCode || "unknown"
      } | category=${item.category || "unknown"} | lat=${item.lat} lng=${
        item.lng
      }`
    );
  }
}

const reportDir = path.resolve("reports");
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(reportDir, "missing-place-coordinates.json");

fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        valid: valid.length,
        invalid: invalid.length,
        total: results.length,
      },
      byFile,
      missingOrInvalid: invalid,
    },
    null,
    2
  )
);

console.log(`\nReport written to ${reportPath}\n`);

if (invalid.length > 0) {
  process.exitCode = 1;
}

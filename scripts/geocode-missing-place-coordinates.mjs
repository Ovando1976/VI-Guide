import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("src/data");
const REPORT_DIR = path.resolve("reports");
const OVERRIDES_PATH = path.join(DATA_DIR, "place-coordinate-overrides.json");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || "";

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
];

const ISLAND_QUERY_SUFFIX = {
  st_thomas: "St. Thomas, U.S. Virgin Islands",
  st_john: "St. John, U.S. Virgin Islands",
  st_croix: "St. Croix, U.S. Virgin Islands",
  water_island: "Water Island, U.S. Virgin Islands",
};

const USVI_BOUNDS = {
  south: 17.62,
  west: -65.12,
  north: 18.42,
  east: -64.5,
};

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function hasValidCoordinates(record) {
  const lat = record?.coordinates?.lat;
  const lng = record?.coordinates?.lng;

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

function isInUsvi(lat, lng) {
  return (
    lat >= USVI_BOUNDS.south &&
    lat <= USVI_BOUNDS.north &&
    lng >= USVI_BOUNDS.west &&
    lng <= USVI_BOUNDS.east
  );
}

function buildSearchQuery(record) {
  const island =
    ISLAND_QUERY_SUFFIX[record.islandCode] || "U.S. Virgin Islands";
  const address = record.address ? `${record.address}, ` : "";
  return `${record.title || record.name}, ${address}${island}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeWithGoogle(record) {
  const address = buildSearchQuery(record);

  const params = new URLSearchParams({
    address,
    key: GOOGLE_API_KEY,
    region: "vi",
    bounds: `${USVI_BOUNDS.south},${USVI_BOUNDS.west}|${USVI_BOUNDS.north},${USVI_BOUNDS.east}`,
  });

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return {
      failed: true,
      status: `HTTP_${response.status}`,
      errorMessage: await response.text(),
      query: address,
    };
  }

  const data = await response.json();

  if (data.status !== "OK") {
    return {
      failed: true,
      status: data.status,
      errorMessage: data.error_message || "No Google error_message returned",
      query: address,
    };
  }

  if (!data.results?.length) {
    return {
      failed: true,
      status: "ZERO_RESULTS",
      errorMessage: "No geocoding result",
      query: address,
    };
  }

  const best = data.results[0];
  const location = best.geometry?.location;

  if (!location) {
    return {
      failed: true,
      status: "NO_LOCATION",
      errorMessage: "Google result had no geometry.location",
      query: address,
    };
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (!isInUsvi(lat, lng)) {
    return {
      rejected: true,
      reason: "Result outside USVI bounds",
      formattedAddress: best.formatted_address,
      lat,
      lng,
      query: address,
    };
  }

  return {
    lat,
    lng,
    formattedAddress: best.formatted_address,
    placeId: best.place_id,
    source: "google_geocoding",
    confidence: best.geometry?.location_type || "unknown",
    query: address,
  };
}

function applyOverride(record, overrides) {
  const override = overrides[record.slug];
  if (!override) return null;

  const lat = Number(override.lat);
  const lng = Number(override.lng);

  if (!isInUsvi(lat, lng)) {
    return null;
  }

  return {
    lat,
    lng,
    source: override.source || "manual_override",
    confidence: override.confidence || "verified",
  };
}

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const overrides = readJson(OVERRIDES_PATH, {});

  const report = {
    generatedAt: new Date().toISOString(),
    updated: [],
    skippedAlreadyHadCoordinates: [],
    unresolved: [],
    rejected: [],
    errors: [],
  };

  for (const fileName of FILES) {
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      report.errors.push({ fileName, error: "File not found" });
      continue;
    }

    const records = readJson(filePath, []);

    if (!Array.isArray(records)) {
      report.errors.push({ fileName, error: "File is not a JSON array" });
      continue;
    }

    let changed = false;

    for (const record of records) {
      if (!record.slug) {
        report.unresolved.push({
          fileName,
          title: record.title || record.name || "Untitled",
          reason: "Missing slug",
        });
        continue;
      }

      if (hasValidCoordinates(record)) {
        report.skippedAlreadyHadCoordinates.push({
          fileName,
          slug: record.slug,
          title: record.title,
        });
        continue;
      }

      const manual = applyOverride(record, overrides);

      if (manual) {
        record.coordinates = { lat: manual.lat, lng: manual.lng };
        record.coordinateSource = manual.source;
        record.coordinateConfidence = manual.confidence;
        record.updatedAt = Date.now();

        changed = true;

        report.updated.push({
          fileName,
          slug: record.slug,
          title: record.title,
          source: manual.source,
          lat: manual.lat,
          lng: manual.lng,
        });

        continue;
      }

      try {
        const geocoded = await geocodeWithGoogle(record);

        if (!geocoded) {
          report.unresolved.push({
            fileName,
            slug: record.slug,
            title: record.title,
            query: buildSearchQuery(record),
            reason: GOOGLE_API_KEY
              ? "No geocoding result"
              : "Missing GOOGLE_MAPS_GEOCODING_API_KEY",
          });
          continue;
        }

        if (!geocoded || geocoded.failed) {
          report.unresolved.push({
            fileName,
            slug: record.slug,
            title: record.title,
            query: geocoded?.query || buildSearchQuery(record),
            status: geocoded?.status || "NO_RESULT",
            errorMessage:
              geocoded?.errorMessage || "No geocoding result returned",
          });
          continue;
        }

        record.coordinates = { lat: geocoded.lat, lng: geocoded.lng };
        record.coordinateSource = geocoded.source;
        record.coordinateConfidence = geocoded.confidence;
        record.geocodedAddress = geocoded.formattedAddress;
        record.googlePlaceId = geocoded.placeId;
        record.updatedAt = Date.now();

        changed = true;

        report.updated.push({
          fileName,
          slug: record.slug,
          title: record.title,
          source: geocoded.source,
          confidence: geocoded.confidence,
          lat: geocoded.lat,
          lng: geocoded.lng,
          formattedAddress: geocoded.formattedAddress,
        });

        await sleep(150);
      } catch (error) {
        report.errors.push({
          fileName,
          slug: record.slug,
          title: record.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (changed) {
      writeJson(filePath, records);
    }
  }

  writeJson(
    path.join(REPORT_DIR, "geocode-place-coordinates-report.json"),
    report
  );

  console.log("\nGeocoding complete.");
  console.log(`Updated: ${report.updated.length}`);
  console.log(
    `Already had coordinates: ${report.skippedAlreadyHadCoordinates.length}`
  );
  console.log(`Unresolved: ${report.unresolved.length}`);
  console.log(`Rejected: ${report.rejected.length}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log("\nReport: reports/geocode-place-coordinates-report.json\n");

  if (
    report.unresolved.length ||
    report.rejected.length ||
    report.errors.length
  ) {
    process.exitCode = 1;
  }
}

main();

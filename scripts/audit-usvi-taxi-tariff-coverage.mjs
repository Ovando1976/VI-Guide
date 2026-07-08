import fs from "node:fs";

const file = "src/lib/mobility/usviTaxiRateData.ts";
const text = fs.readFileSync(file, "utf8");

function extract(name) {
  const pattern = new RegExp(`const ${name} = \\\`([\\s\\S]*?)\\\`;`);
  const match = text.match(pattern);
  if (!match) throw new Error(`Missing raw table: ${name}`);
  return match[1]
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const counts = {
  stThomasHotelRows: extract("STT_HOTELS_TO_CHARLOTTE_AMALIE_AND_AIRPORT").length,
  stThomasMiscRows: extract("STT_MISC_TO_CHARLOTTE_AMALIE_AND_AIRPORT").length,
  stThomasCrossRows: extract("STT_CROSS_ISLAND").length,
  stJohnRows:
    extract("STJ_CRUZ_BAY").length +
    extract("STJ_CORAL_BAY").length +
    extract("STJ_GALLOWS_POINT").length +
    extract("STJ_CANEEL_BAY").length +
    extract("STJ_WESTIN").length +
    extract("STJ_NEPTUNE_LANDING_WINDMILL").length,
  stCroixRows:
    extract("STX_AIRPORT").length +
    extract("STX_CHRISTIANSTED").length +
    extract("STX_FREDERIKSTED").length +
    extract("STX_CARAMBOLA").length,
};

const checks = [
  ["St. Thomas hotel rows", counts.stThomasHotelRows, 28],
  ["St. Thomas miscellaneous rows", counts.stThomasMiscRows, 63],
  ["St. Thomas cross-island rows", counts.stThomasCrossRows, 50],
  ["St. John rows", counts.stJohnRows, 139],
  ["St. Croix rows", counts.stCroixRows, 140],
];

let failed = false;

console.log("\nUSVI taxi tariff coverage audit\n");

for (const [label, actual, minimum] of checks) {
  const pass = actual >= minimum;
  if (!pass) failed = true;
  console.log(`${pass ? "PASS" : "FAIL"} ${label}: ${actual} rows`);
}

const requiredStrings = [
  "waitingPerMinuteAfterFirstFive",
  "luggagePerBag",
  "oversizedLuggageMax",
  "afterHoursPerPassenger",
  "radioCallMoreThanOnePerPassenger",
  "exclusivePolicy",
  "roundTripPolicy",
  "sightseeingRates",
  "st_thomas",
  "st_john",
  "st_croix",
];

for (const key of requiredStrings) {
  const pass = text.includes(key);
  if (!pass) failed = true;
  console.log(`${pass ? "PASS" : "FAIL"} includes ${key}`);
}

if (failed) {
  console.error("\nTaxi tariff coverage audit failed.\n");
  process.exit(1);
}

console.log("\nReady for taxi association demo: published tariff tables are loaded for St. Thomas, St. John, and St. Croix.\n");

import fs from "node:fs";
import path from "node:path";

const buildFile = path.join(process.cwd(), "scripts/build-geographic-index.ts");

const coordinateOverrides = {
  "banana bay": { lat: 18.3246, lng: -64.9508 },
  "banana point": { lat: 18.3252, lng: -64.9516 },
  "bandy point": { lat: 18.3249, lng: -64.9531 },
  "caroline point": { lat: 18.3237, lng: -64.9542 },
  "carol point": { lat: 18.3129, lng: -64.9512 },
  "druif bay": { lat: 18.3156, lng: -64.9566 },
  "druif point": { lat: 18.3147, lng: -64.9584 },
  "limestone bay": { lat: 18.3139, lng: -64.9486 },
  "limestone point": { lat: 18.3142, lng: -64.9471 },
  "sprat bay": { lat: 18.3125, lng: -64.9463 },
  "sprat point": { lat: 18.3131, lng: -64.9428 },
  "sand bay": { lat: 18.3188, lng: -64.9457 },
  "providence": { lat: 18.3164, lng: -64.9561 },
  "providence point": { lat: 18.3184, lng: -64.9581 },
  "providence hill": { lat: 18.3169, lng: -64.9548 },
  "elephant bay": { lat: 18.3219, lng: -64.9565 },
  "flamingo point": { lat: 18.3086, lng: -64.9518 },
  "flamingo rock": { lat: 18.3082, lng: -64.9524 },
  "flamingo hill": { lat: 18.3092, lng: -64.9515 },
  "gregerie harbor": { lat: 18.3232, lng: -64.9568 },
  "west gregerie channel": { lat: 18.3217, lng: -64.9602 },
  "east gregerie channel": { lat: 18.3237, lng: -64.9518 }
};

let text = fs.readFileSync(buildFile, "utf8");

const coordBlock =
`const DICTIONARY_COORDINATE_OVERRIDES: Record<string, GeoPoint> = ${JSON.stringify(coordinateOverrides, null, 2).replace(/"([^"]+)":/g, '"$1":')};`;

text = text.replace(
  /const DICTIONARY_COORDINATE_OVERRIDES: Record<string, GeoPoint> = \{[\s\S]*?\};/,
  coordBlock,
);

const islandBlock =
`const DICTIONARY_ISLAND_OVERRIDES: Record<string, string> = {
${Object.keys(coordinateOverrides).map((key) => `  "${key}": "water_island",`).join("\n")}
};`;

if (/const DICTIONARY_ISLAND_OVERRIDES: Record<string, string> = \{[\s\S]*?\};/.test(text)) {
  text = text.replace(/const DICTIONARY_ISLAND_OVERRIDES: Record<string, string> = \{[\s\S]*?\};/, islandBlock);
} else {
  text = text.replace("const DICTIONARY_COORDINATE_OVERRIDES", islandBlock + "\n\nconst DICTIONARY_COORDINATE_OVERRIDES");
}

const oldIsland = `    island: cleanupRule?.island || normalizeIsland(entry.island ?? entry.islandCode),`;
const newIsland = `    island:
      cleanupRule?.island ||
      DICTIONARY_ISLAND_OVERRIDES[dictionaryOverrideKey(entry)] ||
      normalizeIsland(entry.island ?? entry.islandCode),`;

if (text.includes(oldIsland)) text = text.replace(oldIsland, newIsland);

fs.writeFileSync(buildFile, text);
console.log("Water Island dictionary overrides repaired at build source.");

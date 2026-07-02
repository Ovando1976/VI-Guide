import fs from "node:fs";
import path from "node:path";

function read(file: string) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`patched ${file}`);
}

function patchPackageScripts() {
  const file = "package.json";
  const json = JSON.parse(read(file));

  json.scripts ??= {};
  json.scripts["atlas:build"] = "tsx scripts/build-master-atlas.ts";
  json.scripts["atlas:audit"] = "tsx scripts/audit-master-atlas.ts";
  json.scripts["atlas:verify"] = "npm run atlas:build && npm run atlas:audit && npx tsc --noEmit";
  json.scripts["mapgeo:import"] = "tsx scripts/import-mapgeo-properties.ts";
  json.scripts["repair:rebuild-best"] = "tsx scripts/repair-rebuild-best.ts";

  write(file, JSON.stringify(json, null, 2) + "\n");
}

function patchIslandMapProps() {
  const file = "src/components/maps/IslandMap.tsx";
  let text = read(file);
  if (!text) return;

  if (!text.includes("embedded?: boolean")) {
    text = text.replace(
      /(export\s+type\s+IslandMapProps\s*=\s*{)/,
      `$1
  embedded?: boolean;
  embeddedMapHeight?: string;`
    );

    text = text.replace(
      /(export\s+interface\s+IslandMapProps\s*{)/,
      `$1
  embedded?: boolean;
  embeddedMapHeight?: string;`
    );
  }

  write(file, text);
}

function patchEstateExplorerProps() {
  const file = "src/features/estates/components/estate-explorer-map.tsx";
  let text = read(file);
  if (!text) return;

  if (!text.includes("selectedEstateGeoid?: string")) {
    text = text.replace(
      /(export\s+type\s+EstateExplorerMapProps\s*=\s*{)/,
      `$1
  selectedEstateGeoid?: string;`
    );

    text = text.replace(
      /(export\s+interface\s+EstateExplorerMapProps\s*{)/,
      `$1
  selectedEstateGeoid?: string;`
    );
  }

  write(file, text);
}

function createGeographyTypes() {
  const file = "src/features/geography/types.ts";
  if (!fs.existsSync(file)) {
    write(
      file,
      `export type GeographyIslandCode =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island";
`
    );
  }
}

function fixExtractedImports() {
  const files = [
    "src/data/historyGraph/extracted/index.ts",
    "src/data/historyGraph/extracted/mergedEstateExtractions.ts",
  ];

  for (const file of files) {
    let text = read(file);
    if (!text) continue;

    text = text
      .replaceAll("./estateExtractionTypes.ts", "./estateExtractionTypes")
      .replaceAll("./generatedEstateExtractions.ts", "./generatedEstateExtractions")
      .replaceAll("./stThomasEstateExtractions.ts", "./stThomasEstateExtractions")
      .replaceAll("./mergedEstateExtractions.ts", "./mergedEstateExtractions");

    write(file, text);
  }
}

patchPackageScripts();
patchIslandMapProps();
patchEstateExplorerProps();
createGeographyTypes();
fixExtractedImports();

console.log("Repair script complete.");

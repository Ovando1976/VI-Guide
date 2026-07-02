import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REPORT_JSON = path.join(ROOT, "reports/clean-geographic-index.json");
const OLD_TS_DATA = path.join(ROOT, "src/data/core/cleanGeographicIndex.data.ts");
const OUT_JS = path.join(ROOT, "src/data/core/cleanGeographicIndex.data.js");
const OUT_DTS = path.join(ROOT, "src/data/core/cleanGeographicIndex.data.d.ts");
const WRAPPER = path.join(ROOT, "src/data/core/cleanGeographicIndex.ts");
const BACKUP_DIR = path.join(ROOT, "data-sources/legacy-large-ts/src/data/core");

if (!existsSync(REPORT_JSON)) {
  throw new Error("Missing reports/clean-geographic-index.json. Rebuild clean index first.");
}

mkdirSync(BACKUP_DIR, { recursive: true });

const records = JSON.parse(readFileSync(REPORT_JSON, "utf8"));
const json = JSON.stringify(records);
const generatedAt = new Date().toISOString();

writeFileSync(
  OUT_JS,
  `// Auto-generated runtime data.
// Last updated: ${generatedAt}
// Kept as JS so TypeScript does not compile the giant data payload.

const cleanGeographicIndexJson = ${JSON.stringify(json)};

export const cleanGeographicIndexData = JSON.parse(cleanGeographicIndexJson);

export default cleanGeographicIndexData;
`,
);

writeFileSync(
  OUT_DTS,
  `export const cleanGeographicIndexData: any[];
export default cleanGeographicIndexData;
`,
);

if (existsSync(OLD_TS_DATA)) {
  renameSync(
    OLD_TS_DATA,
    path.join(BACKUP_DIR, `cleanGeographicIndex.data.${Date.now()}.ts.txt`),
  );
}

let wrapper = readFileSync(WRAPPER, "utf8");

wrapper = wrapper.replace(
  /import\s+cleanGeographicIndexData\s+from\s+["']\.\/cleanGeographicIndex\.data["'];/,
  `import cleanGeographicIndexData from "./cleanGeographicIndex.data.js";`,
);

wrapper = wrapper.replace(
  /import\s+cleanGeographicIndexData\s+from\s+["']\.\/cleanGeographicIndex\.data\.ts["'];/,
  `import cleanGeographicIndexData from "./cleanGeographicIndex.data.js";`,
);

writeFileSync(WRAPPER, wrapper);

console.log({
  records: records.length,
  outJs: OUT_JS,
  outDts: OUT_DTS,
  wrapper: WRAPPER,
});

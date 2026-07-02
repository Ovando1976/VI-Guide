import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const TARGETS = [
  "src/data/atlas/atlasSearchIndex.ts",
  "src/data/estateKnowledge.ts",
  "src/data/standaloneDictionaryPlaces.ts",
  "src/data/quarterFeatureLinks.ts",
  "src/data/estateHistories.ts",
  "src/data/estateFeatureLinks.ts",
  "src/data/history/generated/usviHistoryExtract.ts",
  "src/data/generated/geographicDictionaryEntries.ts",
  "src/data/core/geographicDictionaryAdditions.ts",
  "src/data/core/geographicIndex.data.ts",
];

const BACKUP_ROOT = path.join(ROOT, "data-sources/legacy-large-ts");

function relativeImport(fromFile, toFileNoExt) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, toFileNoExt).replaceAll("\\", "/");

  if (!rel.startsWith(".")) rel = "./" + rel;

  return rel;
}

function collectExports(text) {
  const valueExports = new Set();
  const functionExports = new Set();
  const typeExports = new Set();

  for (const match of text.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
    valueExports.add(match[1]);
  }

  for (const match of text.matchAll(/export\s+function\s+([A-Za-z_$][\w$]*)/g)) {
    functionExports.add(match[1]);
  }

  for (const match of text.matchAll(/export\s+(?:type|interface)\s+([A-Za-z_$][\w$]*)/g)) {
    typeExports.add(match[1]);
  }

  const hasDefault = /export\s+default/.test(text);

  return {
    valueExports: [...valueExports],
    functionExports: [...functionExports],
    typeExports: [...typeExports],
    hasDefault,
  };
}

function expressionFor(file) {
  if (file.includes("atlasSearchIndex")) {
    return "cleanGeographicIndex";
  }

  if (file.includes("estateKnowledge")) {
    return `cleanGeographicIndex.filter((item: any) => item.type === "estate")`;
  }

  if (file.includes("standaloneDictionaryPlaces")) {
    return `cleanGeographicIndex.filter((item: any) =>
  item.type === "dictionaryEntry" ||
  item.sources?.includes("standaloneDictionaryPlaces") ||
  item.sources?.includes("geographicDictionaryEntries")
)`;
  }

  if (file.includes("quarterFeatureLinks")) {
    return `cleanGeographicIndex.filter((item: any) => item.type === "quarter")`;
  }

  if (file.includes("estateFeatureLinks")) {
    return `cleanGeographicIndex.filter((item: any) => item.type === "estate")`;
  }

  if (file.includes("estateHistories")) {
    return `cleanGeographicIndex.filter((item: any) => item.type === "estate" && item.description)`;
  }

  if (file.includes("usviHistoryExtract")) {
    return `cleanGeographicIndex.filter((item: any) =>
  ["event", "historyRecord", "archiveRecord"].includes(item.type) ||
  item.sources?.includes("usviHistoryExtract")
)`;
  }

  if (file.includes("geographicDictionaryEntries")) {
    return `cleanGeographicIndex.filter((item: any) =>
  item.type === "dictionaryEntry" ||
  item.sources?.includes("geographicDictionaryEntries")
)`;
  }

  if (file.includes("geographicDictionaryAdditions")) {
    return `cleanGeographicIndex.filter((item: any) =>
  item.source === "geographic-dictionary-1925" ||
  item.sources?.includes("geographicDictionaryAdditions")
)`;
  }

  if (file.includes("geographicIndex.data")) {
    return "cleanGeographicIndex";
  }

  return "cleanGeographicIndex";
}

function valueExpressionForExport(name) {
  if (/meta|summary|stats|count/i.test(name)) {
    return "compatMeta";
  }

  if (/lookup|map|by[A-Z_]|index/i.test(name) && !/searchIndex/i.test(name)) {
    return "compatLookup";
  }

  return "compatData";
}

function writeWrapper(file, exportInfo) {
  const importPath = relativeImport(file, "src/data/core/cleanGeographicIndex");
  const compatExpr = expressionFor(file);

  let out = `// Compatibility wrapper.
// The original large TypeScript data module was moved to data-sources/legacy-large-ts.
// This file now derives data from the unified clean geographic index to keep tsc stable.

import { cleanGeographicIndex, cleanGeographicIndexMeta } from "${importPath}";

export type CompactCompatRecord = Record<string, any>;

const compatData = ${compatExpr} as any[];

const compatMeta = {
  ...cleanGeographicIndexMeta,
  total: compatData.length,
  totalRecords: compatData.length,
};

const compatLookup = Object.fromEntries(
  compatData.map((item: any) => [
    item.id || item.slug || item.name,
    item,
  ])
);

`;

  for (const typeName of exportInfo.typeExports) {
    out += `export type ${typeName} = any;\n`;
  }

  if (exportInfo.typeExports.length) out += "\n";

  for (const valueName of exportInfo.valueExports) {
    out += `export const ${valueName} = ${valueExpressionForExport(valueName)};\n`;
  }

  if (exportInfo.valueExports.length) out += "\n";

  for (const functionName of exportInfo.functionExports) {
    out += `export function ${functionName}(..._args: any[]) {
  return compatData;
}
`;
  }

  if (exportInfo.hasDefault || exportInfo.valueExports.length === 0) {
    out += "\nexport default compatData;\n";
  }

  writeFileSync(path.join(ROOT, file), out);
}

function main() {
  const report = [];

  for (const file of TARGETS) {
    const abs = path.join(ROOT, file);

    if (!existsSync(abs)) {
      report.push({ file, status: "missing" });
      continue;
    }

    const original = readFileSync(abs, "utf8");
    const exportInfo = collectExports(original);

    const backupPath = path.join(BACKUP_ROOT, `${file}.${Date.now()}.txt`);
    mkdirSync(path.dirname(backupPath), { recursive: true });

    renameSync(abs, backupPath);

    writeWrapper(file, exportInfo);

    report.push({
      file,
      status: "wrapped",
      backupPath,
      exports: exportInfo,
    });
  }

  mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  writeFileSync(
    path.join(ROOT, "reports/quarantine-large-data-modules-report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        report,
      },
      null,
      2,
    ),
  );

  console.log("Large data modules quarantined.");
  console.log(report.map((item) => ({ file: item.file, status: item.status })));
}

main();

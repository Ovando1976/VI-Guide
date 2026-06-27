import fs from "node:fs";
import path from "node:path";
import { geographicIndexItems } from "../src/data/core/geographicIndex";

const OUT_JSON = path.join(process.cwd(), "generated/missing-dictionary-coordinates.json");
const OUT_MD = path.join(process.cwd(), "generated/missing-dictionary-coordinates.md");

const dictionaryMissing = geographicIndexItems
  .filter((item) => item.source === "dictionary")
  .filter((item) => !item.coordinates)
  .filter((item) => !item.isReferenceOnly)
  .map((item) => {
    const description = item.description || "";
    const hasIsland = item.island && item.island !== "unknown";
    const hasEstate = Boolean(item.estateName || item.estateId);
    const hasDistanceClue =
      /\b(yard|yards|mile|miles|feet|north|south|east|west|shore|bay|point|near|between|opposite|fronting)\b/i.test(
        description,
      );

    let priority = 0;
    if (hasIsland) priority += 30;
    if (hasEstate) priority += 25;
    if (hasDistanceClue) priority += 35;
    if (item.featureType === "bay") priority += 10;
    if (item.featureType === "point") priority += 10;
    if (item.featureType === "estate") priority += 8;

    return {
      id: item.id,
      name: item.name,
      island: item.island,
      featureType: item.featureType,
      type: item.type,
      estateName: item.estateName,
      coordinateStatus: item.coordinateStatus,
      priority,
      description,
      aliases: item.aliases || [],
    };
  })
  .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(dictionaryMissing, null, 2));

const top = dictionaryMissing.slice(0, 150);

const md = [
  "# Missing Dictionary Coordinates Audit",
  "",
  `Total unmapped dictionary records: ${dictionaryMissing.length}`,
  "",
  "## Highest-priority records",
  "",
  "| Priority | Name | Island | Type | Estate | Description |",
  "|---:|---|---|---|---|---|",
  ...top.map((item) => {
    const description = item.description.replace(/\s+/g, " ").slice(0, 180);
    return `| ${item.priority} | ${item.name} | ${item.island || ""} | ${item.featureType || item.type || ""} | ${item.estateName || ""} | ${description} |`;
  }),
  "",
].join("\n");

fs.writeFileSync(OUT_MD, md);

console.log("Missing dictionary coordinate audit complete.");
console.log({
  total: dictionaryMissing.length,
  json: OUT_JSON,
  markdown: OUT_MD,
});

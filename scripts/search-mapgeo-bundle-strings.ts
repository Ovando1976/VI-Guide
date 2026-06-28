// scripts/search-mapgeo-bundle-strings.ts
import { writeFileSync } from "node:fs";

const BUNDLE =
  "https://storage.googleapis.com/mapgeo-map-bootstrap-production/assets/map-e2517a0ac8091fb98ed63242f1f80890.js";

const OUT = "data/raw/mapgeo-bundle-string-hits.txt";

const TERMS = [
  "parcel",
  "parcels",
  "property",
  "properties",
  "address",
  "owner",
  "cama",
  "assessor",
  "mapgeo2",
  "documents",
  "search",
  "autocomplete",
  "query",
  "api/",
  "/api",
  "adapter",
  "modelName",
  "namespace",
  "host",
];

async function main() {
  const res = await fetch(BUNDLE);
  const js = await res.text();

  const lines: string[] = [];

  for (const term of TERMS) {
    const lower = js.toLowerCase();
    const needle = term.toLowerCase();

    let index = 0;
    let count = 0;

    while ((index = lower.indexOf(needle, index)) !== -1 && count < 80) {
      const start = Math.max(0, index - 300);
      const end = Math.min(js.length, index + 500);
      lines.push(`\n\n===== ${term} @ ${index} =====\n${js.slice(start, end)}`);
      index += needle.length;
      count++;
    }
  }

  writeFileSync(OUT, lines.join("\n"));
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
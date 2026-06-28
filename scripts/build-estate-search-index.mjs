import fs from "node:fs";

const input = "public/geo/usvi-estates.geojson";
const output = "public/data/estate-search-index.json";

const data = JSON.parse(fs.readFileSync(input, "utf8"));

function bboxOfGeometry(geometry) {
  const points = [];

  function walk(value) {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      points.push(value);
      return;
    }
    value.forEach(walk);
  }

  if (geometry?.type === "GeometryCollection") {
    geometry.geometries?.forEach((g) => walk(g.coordinates));
  } else {
    walk(geometry?.coordinates);
  }

  if (!points.length) return null;

  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);

  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

const index = data.features.map((feature) => {
  const p = feature.properties || {};
  const bbox = bboxOfGeometry(feature.geometry);
  const coords = bbox
    ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
    : [-64.86, 18.08];

  return {
    geoid: String(p.geoid || p.GEOID || p.estateCode || ""),
    name: String(p.baseName || p.cleanName || p.name || p.ESTATE || p.estate || "Unnamed Estate").replace(/^estate\s+/i, ""),
    quarter: String(p.quarter || p.QUARTER || p.quarterGroup || "Unknown Quarter"),
    island: String(p.island || p.ISLAND || p.county || ""),
    coords,
  };
});

fs.writeFileSync(output, JSON.stringify(index));
console.log(`Wrote ${output}: ${index.length} estates`);

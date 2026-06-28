import fs from "node:fs";

const patches = {
  "banana bay": [18.3246, -64.9508],
  "banana point": [18.3252, -64.9516],
  "bandy point": [18.3249, -64.9531],
  "druif bay": [18.3156, -64.9566],
  "limestone bay": [18.3139, -64.9486],
} as const;

function norm(v: unknown) {
  return String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function patchJson(file: string) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const arr = Array.isArray(data) ? data : data.items || data.nodes || [];
  let patched = 0;

  for (const item of arr) {
    const key = norm(item.sourceName || item.name || item.label);
    const coords = patches[key as keyof typeof patches];
    if (!coords) continue;

    item.coordinates = { lat: coords[0], lng: coords[1] };
    item.latitude = coords[0];
    item.longitude = coords[1];
    item.lat = coords[0];
    item.lng = coords[1];
    item.coordinateStatus = "approximate";
    patched++;
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(file, { patched });
}

patchJson("src/data/vi-dictionary.json");
patchJson("generated/dictionary-graph.json");

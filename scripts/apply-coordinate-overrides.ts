import fs from "node:fs";
import path from "node:path";

const overrides = {
  "banana bay": { lat: 18.3246, lng: -64.9508 },
  "banana point": { lat: 18.3252, lng: -64.9516 },
  "bandy point": { lat: 18.3249, lng: -64.9531 },
  "druif bay": { lat: 18.3156, lng: -64.9566 },
  "limestone bay": { lat: 18.3139, lng: -64.9486 },
};

function norm(v: unknown) {
  return String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function patchJsonArray(file: string) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  let patched = 0;

  const items = Array.isArray(data) ? data : data.items || data.nodes || [];
  for (const item of items) {
    const key = norm(item.name || item.label);
    const patch = overrides[key as keyof typeof overrides];
    if (!patch) continue;

    item.latitude = patch.lat;
    item.longitude = patch.lng;
    item.lat = patch.lat;
    item.lng = patch.lng;
    item.coordinates = { lat: patch.lat, lng: patch.lng };
    item.coordinateStatus = "approximate";
    patched++;
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(file, { patched });
}

patchJsonArray(path.join(process.cwd(), "src/data/vi-dictionary.json"));
patchJsonArray(path.join(process.cwd(), "generated/dictionary-graph.json"));

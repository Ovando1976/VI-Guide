import fs from "node:fs";
import path from "node:path";

type Entry = {
  id?: string;
  name?: string;
  island?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: unknown;
  coordinateStatus?: string;
  coordinateNotes?: string;
  [key: string]: unknown;
};

const file = path.join(process.cwd(), "src/data/vi-dictionary.json");

const patches = [
  ["Banana Bay", 18.3246, -64.9508, "Approximate: north end of Water Island, southeast of Banana Point."],
  ["Banana Point", 18.3252, -64.9516, "Approximate: north end of Water Island."],
  ["Bandy Point", 18.3249, -64.9531, "Approximate: about 300 yards west of Banana Point."],
  ["Druif Bay", 18.3156, -64.9566, "Approximate: west shore of Water Island."],
  ["Limestone Bay", 18.3139, -64.9486, "Approximate: southeast shore of Water Island near Carol Point."],
] as const;

function norm(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const entries = JSON.parse(fs.readFileSync(file, "utf8")) as Entry[];
let patched = 0;

for (const [name, lat, lng, notes] of patches) {
  const target = entries.find((entry) => norm(entry.name) === norm(name));

  if (!target) {
    console.warn("Missing:", name);
    continue;
  }

  target.latitude = lat;
  target.longitude = lng;
  target.coordinates = {
    latitude: lat,
    longitude: lng,
  };
  target.coordinateStatus = "approximate";
  target.coordinateNotes = notes;

  patched++;
}

fs.writeFileSync(file, JSON.stringify(entries, null, 2) + "\n");
console.log({ patched, file });

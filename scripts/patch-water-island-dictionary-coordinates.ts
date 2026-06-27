import fs from "node:fs";
import path from "node:path";

type Entry = {
  id?: string;
  name?: string;
  island?: string;
  coordinates?: { lat: number; lng: number } | null;
  coordinateStatus?: string;
  coordinateNotes?: string;
  [key: string]: unknown;
};

const file = path.join(process.cwd(), "src/data/vi-dictionary.json");

const patches: Record<string, { lat: number; lng: number; notes: string }> = {
  "banana-bay": {
    lat: 18.3246,
    lng: -64.9508,
    notes: "Approximate: north end of Water Island, southeast of Banana Point.",
  },
  "baiul-nwr": {
    lat: 18.3252,
    lng: -64.9516,
    notes: "Approximate: Banana Point / north end of Water Island.",
  },
  "bandy-point": {
    lat: 18.3249,
    lng: -64.9531,
    notes: "Approximate: about 300 yards west of Banana Point.",
  },
  "druif-bay": {
    lat: 18.3156,
    lng: -64.9566,
    notes: "Approximate: west shore of Water Island.",
  },
  "limestone-bay": {
    lat: 18.3139,
    lng: -64.9486,
    notes: "Approximate: southeast shore of Water Island near Carol Point.",
  },
};

const data = JSON.parse(fs.readFileSync(file, "utf8")) as Entry[];

let patched = 0;

for (const entry of data) {
  const patch = entry.id ? patches[entry.id] : undefined;
  if (!patch) continue;

  entry.coordinates = { lat: patch.lat, lng: patch.lng };
  entry.coordinateStatus = "approximate";
  entry.coordinateNotes = patch.notes;
  patched++;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");

console.log({ patched, file });

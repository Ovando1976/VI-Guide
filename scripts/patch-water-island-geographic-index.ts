import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "src/data/core/geographicIndex.ts");

const patches: Record<string, { lat: number; lng: number }> = {
  "Banana Bay": { lat: 18.3246, lng: -64.9508 },
  "Banana Point": { lat: 18.3252, lng: -64.9516 },
  "Bandy Point": { lat: 18.3249, lng: -64.9531 },
  "Druif Bay": { lat: 18.3156, lng: -64.9566 },
  "Limestone Bay": { lat: 18.3139, lng: -64.9486 },
};

let text = fs.readFileSync(file, "utf8");
let patched = 0;

for (const [name, coords] of Object.entries(patches)) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pattern = new RegExp(
    `("source":"dictionary"[^}]*"name":"${escapedName}"[^}]*?)"coordinates":null`,
    "g",
  );

  const next = text.replace(
    pattern,
    `$1"coordinates":{"lat":${coords.lat},"lng":${coords.lng}}`,
  );

  if (next !== text) patched++;
  else console.warn("Missing:", name);

  text = next;
}

fs.writeFileSync(file, text);
console.log({ patched });

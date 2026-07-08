import fs from "node:fs";
import path from "node:path";

const csvPath = "reports/missing-place-images.csv";
const publicRoot = "public";

const csv = fs.readFileSync(csvPath, "utf8");
const lines = csv.split(/\r?\n/).slice(1).filter(Boolean);

const dirs = new Set();

for (const line of lines) {
  const match = line.match(/"([^"]*)","([^"]*)","([^"]*)"/);
  if (!match) continue;

  const imagePath = match[3];
  const dir = path.dirname(path.join(publicRoot, imagePath));
  dirs.add(dir);
}

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
  console.log("Created:", dir);
}

console.log(`\nDone. Created/verified ${dirs.size} image folders.`);

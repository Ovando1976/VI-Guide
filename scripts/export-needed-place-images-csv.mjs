import fs from "node:fs/promises";
import path from "node:path";

const reportPath = path.join(
  process.cwd(),
  "reports",
  "missing-place-images.json"
);
const outPath = path.join(process.cwd(), "reports", "missing-place-images.csv");

const rows = JSON.parse(await fs.readFile(reportPath, "utf8"));

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const csv = [
  ["title", "file", "imagePath"].join(","),
  ...rows.map((item) =>
    [
      csvEscape(item.title),
      csvEscape(item.file),
      csvEscape(item.imagePath ?? item.path),
    ].join(",")
  ),
].join("\n");

await fs.writeFile(outPath, csv + "\n");

console.log(`CSV written: ${outPath}`);
console.log(`Missing images: ${rows.length}`);

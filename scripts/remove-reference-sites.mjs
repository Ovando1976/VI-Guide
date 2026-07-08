import fs from "node:fs";

const FILE = "src/data/historic-sites.json";
const BACKUP = "src/data/historic-sites.backup.json";

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

fs.writeFileSync(BACKUP, JSON.stringify(data, null, 2) + "\n");

const cleaned = data.filter((place) => {
  const title = String(place.title || "");
  const slug = String(place.slug || "");
  const description = String(place.description || "");

  return !(
    title.includes("Reference Site") ||
    slug.includes("reference-site") ||
    description.includes("Reference Site")
  );
});

fs.writeFileSync(FILE, JSON.stringify(cleaned, null, 2) + "\n");

console.log(`Original: ${data.length}`);
console.log(`Removed: ${data.length - cleaned.length}`);
console.log(`Remaining: ${cleaned.length}`);
console.log(`Backup: ${BACKUP}`);

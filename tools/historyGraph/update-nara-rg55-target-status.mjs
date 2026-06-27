import fs from "node:fs";
import path from "node:path";

const [, , targetId, nextStatus] = process.argv;
const allowed = new Set(["open", "in_progress", "extracted", "verified", "blocked"]);

if (!targetId || !nextStatus || !allowed.has(nextStatus)) {
  console.error("Usage: npm run history:graph:nara:set-status -- <target-id> <status>");
  process.exit(1);
}

const file = path.resolve("src/data/historyGraph/extractionTargets/naraRg55ExtractionTargets.ts");
let text = fs.readFileSync(file, "utf8");

const re = new RegExp(`(id:\\s*"${targetId}"[\\s\\S]*?status:\\s*")([^"]+)(")`, "m");

if (!re.test(text)) {
  console.error(`Target not found: ${targetId}`);
  process.exit(1);
}

text = text.replace(re, `$1${nextStatus}$3`);
fs.writeFileSync(file, text);
console.log(`Updated ${targetId} -> ${nextStatus}`);

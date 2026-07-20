import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const root = process.cwd();
const templateRoot = path.join(root, "concierge-actions-template");
const files = [
  "types/concierge.ts",
  "app/api/concierge/chat/route.ts",
  "components/concierge/vi-concierge.tsx",
  "components/trip-planner/add-to-trip-button.tsx",
];

for (const relative of files) {
  if (!fs.existsSync(path.join(templateRoot, relative))) {
    throw new Error(`Missing template: ${relative}`);
  }
}

if (!apply) {
  console.log("Would install reviewable Concierge planning actions:");
  files.forEach((file) => console.log(`  ${file}`));
  console.log("Run again with --apply to write the files.");
  process.exit(0);
}

for (const relative of files) {
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(templateRoot, relative), destination);
}

fs.rmSync(templateRoot, { recursive: true, force: true });
console.log(`Installed ${files.length} Concierge planning-action files.`);
console.log("Removed the temporary concierge-actions-template directory.");

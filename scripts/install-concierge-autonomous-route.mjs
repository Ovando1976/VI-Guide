import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const root = process.cwd();
const templateRoot = path.join(root, "autonomous-route-template");
const files = [
  "app/api/concierge/chat/route.ts",
  "components/concierge/vi-concierge.tsx",
];

for (const relative of files) {
  if (!fs.existsSync(path.join(templateRoot, relative))) throw new Error(`Missing template: ${relative}`);
}

if (!apply) {
  console.log("Would enable automatic, reversible Concierge route preparation.");
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
console.log("Installed automatic named-route preparation with confirmation reserved for booking.");

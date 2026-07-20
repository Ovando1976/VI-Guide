import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const root = process.cwd();
const templateRoot = path.join(root, "planning-template");
const files = [
  "components/trip-planner/trip-types.ts",
  "components/trip-planner/trip-store.ts",
  "components/trip-planner/add-to-trip-button.tsx",
  "components/trip-planner/trip-planner-screen.tsx",
  "components/concierge/vi-concierge.tsx",
  "components/explorer/explorer-map-screen.tsx",
  "components/directory/directory-detail-screen.tsx",
  "components/stay-action-card.tsx",
  "app/accommodations/[slug]/page.tsx",
  "app/historic/[slug]/page.tsx",
];

for (const relative of files) {
  const source = path.join(templateRoot, relative);
  if (!fs.existsSync(source)) throw new Error(`Missing template: ${relative}`);
}

if (!apply) {
  console.log("Would install the unified VI Guide planning experience:");
  files.forEach((file) => console.log(`  ${file}`));
  console.log("Run again with --apply to write the files.");
  process.exit(0);
}

for (const relative of files) {
  const source = path.join(templateRoot, relative);
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

console.log(`Installed ${files.length} unified planning files.`);

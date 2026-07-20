import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const root = process.cwd();
const templateRoot = path.join(root, "route-evidence-template");
const relative = "app/api/concierge/chat/route.ts";
const source = path.join(templateRoot, relative);
if (!fs.existsSync(source)) throw new Error(`Missing template: ${relative}`);

if (!apply) {
  console.log("Would expand Concierge route evidence to Places, Beaches, and History.");
  console.log("Would enforce a deterministic composite action for two exact named endpoints.");
  console.log("Run again with --apply to write the fix.");
  process.exit(0);
}

const destination = path.join(root, relative);
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
fs.rmSync(templateRoot, { recursive: true, force: true });
console.log("Installed cross-catalog Concierge route evidence and deterministic endpoint resolution.");

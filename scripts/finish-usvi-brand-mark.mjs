import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const file = path.join(process.cwd(), "components/app-navigation.tsx");

if (!fs.existsSync(file)) {
  throw new Error("Run this script from the VI Guide project root.");
}

const source = fs.readFileSync(file, "utf8");
const original = '<div className="app-nav__brand" aria-hidden="true">';
const polished = `<div
        className="app-nav__brand"
        aria-hidden="true"
        style={{ background: "transparent", border: 0, boxShadow: "none" }}
      >`;

if (source.includes(polished)) {
  console.log("Navigation seal wrapper is already clean.");
  process.exit(0);
}

if (!source.includes(original)) {
  throw new Error("Could not locate the app navigation brand wrapper.");
}

if (!apply) {
  console.log("Would remove the legacy gold badge styling behind the USVI seal.");
  console.log("Run again with --apply to write the change.");
  process.exit(0);
}

fs.writeFileSync(file, source.replace(original, polished));
console.log("Removed legacy navigation badge styling from the USVI seal.");

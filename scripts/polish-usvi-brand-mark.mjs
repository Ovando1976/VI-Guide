import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const root = process.cwd();
const navFile = path.join(root, "components/app-navigation.tsx");

if (!fs.existsSync(navFile)) {
  throw new Error("Run this script from the VI Guide project root.");
}

const before = fs.readFileSync(navFile, "utf8");
const patterns = [
  '<ViBrandMark className="h-full w-full" />',
  '<ViBrandMark className="h-11 w-11" />',
];
const matched = patterns.find((pattern) => before.includes(pattern));

if (!matched) {
  if (before.includes('<ViBrandMark className="h-9 w-9" />')) {
    console.log("Navigation brand mark is already polished.");
    process.exit(0);
  }
  throw new Error("Could not locate the navigation ViBrandMark usage.");
}

const after = before.replace(
  matched,
  '<ViBrandMark className="h-9 w-9 shrink-0" />',
);

if (!apply) {
  console.log("Would refine the persistent navigation seal to 36px.");
  console.log("Run again with --apply to write the change.");
  process.exit(0);
}

fs.writeFileSync(navFile, after);
console.log("Refined persistent navigation seal sizing.");

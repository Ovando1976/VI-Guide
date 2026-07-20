import fs from "node:fs";

const apply = process.argv.includes("--apply");
const file = "package.json";
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
pkg.scripts = {
  ...pkg.scripts,
  "fishing:audit": "tsx scripts/audit-fishing-handbook.ts",
};

if (!apply) {
  console.log("Would add the USVI fishing-handbook audit command.");
  console.log("Run again with --apply to update package.json.");
} else {
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("Installed the USVI fishing-handbook command.");
}

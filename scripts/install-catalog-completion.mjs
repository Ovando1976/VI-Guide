import fs from "node:fs";

const apply = process.argv.includes("--apply");
const file = "package.json";
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
pkg.scripts = {
  ...pkg.scripts,
  "catalog:audit": "tsx scripts/audit-catalog-completeness.ts",
  "catalog:gate": "tsx scripts/audit-catalog-completeness.ts --strict",
  "catalog:resolve-businesses": "tsx scripts/resolve-catalog-business-metadata.ts",
  "catalog:resolve-businesses:apply": "tsx scripts/resolve-catalog-business-metadata.ts --apply",
  "catalog:apply-reviewed-businesses": "tsx scripts/apply-reviewed-catalog-businesses.ts",
  "catalog:resolve-beaches": "tsx scripts/resolve-catalog-beach-metadata.ts",
  "catalog:apply-reviewed-beaches": "tsx scripts/apply-reviewed-catalog-beaches.ts",
};

if (!apply) {
  console.log("Would add catalog audit, gate, and business-resolution package scripts.");
  console.log("Run again with --apply to update package.json.");
} else {
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("Installed catalog completion commands.");
}

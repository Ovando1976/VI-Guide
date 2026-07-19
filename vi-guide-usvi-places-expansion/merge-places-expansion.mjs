#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "data/travel-knowledge/places.json");
const source = new URL("./places-expansion.json", import.meta.url);

const incoming = JSON.parse(fs.readFileSync(source, "utf8"));
const current = fs.existsSync(target)
  ? JSON.parse(fs.readFileSync(target, "utf8"))
  : [];

if (!Array.isArray(current) || !Array.isArray(incoming)) {
  throw new Error("Places catalogs must contain JSON arrays.");
}

const merged = new Map();
for (const row of incoming) merged.set(row.slug || row.id, row);
for (const row of current) {
  const key = row.slug || row.id;
  if (!key) continue;
  const base = merged.get(key) || {};
  merged.set(key, {
    ...base,
    ...row,
    id: row.id || base.id || key,
    slug: row.slug || base.slug || key,
    tags: [...new Set([...(base.tags || []), ...(row.tags || [])])],
    heroImage: row.heroImage || base.heroImage || "/images/places/placeholder.svg",
  });
}

const rows = [...merged.values()].sort((a,b) =>
  String(a.name || "").localeCompare(String(b.name || ""))
);
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.writeFileSync(target, JSON.stringify(rows, null, 2) + "\n");

const byIsland = rows.reduce((acc,row) => {
  const k = row.island || "unknown";
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});
console.log(`Places catalog now contains ${rows.length} records.`);
console.table(byIsland);

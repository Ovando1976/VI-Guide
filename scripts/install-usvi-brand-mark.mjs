import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const componentSource = path.join(root, "brand-template/vi-brand-mark.tsx");
const componentTarget = path.join(root, "components/brand/vi-brand-mark.tsx");

const targets = [
  {
    file: "app/page.tsx",
    replace(text) {
      const old = '<span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5b942] text-xs font-black tracking-[.1em] text-[#043331] shadow-lg">VI</span>';
      if (!text.includes(old)) return null;
      return addImport(text.replace(old, '<ViBrandMark className="h-11 w-11" priority />'));
    },
  },
  {
    file: "components/app-navigation.tsx",
    replace(text) {
      if (!text.includes("<span>VI</span>")) return null;
      return addImport(text.replace("<span>VI</span>", '<ViBrandMark className="h-full w-full" />'));
    },
  },
  {
    file: "components/explorer/explorer-map-screen.tsx",
    replace(text) {
      const pattern = /<span className="mx-auto grid h-14 w-14[^\"]*">\s*VI\s*<\/span>/;
      if (!pattern.test(text)) return text;
      return addImport(text.replace(pattern, '<ViBrandMark className="mx-auto h-14 w-14 animate-pulse" />'));
    },
  },
];

function addImport(text) {
  const statement = 'import { ViBrandMark } from "@/components/brand/vi-brand-mark";';
  if (text.includes(statement)) return text;
  if (text.startsWith('"use client";')) return text.replace('"use client";', `"use client";\n\n${statement}`);
  return `${statement}\n${text}`;
}

if (!fs.existsSync(path.join(root, "public/images/usvi-logo.jpeg"))) {
  console.error("Missing public/images/usvi-logo.jpeg");
  process.exit(1);
}
if (!fs.existsSync(componentSource)) {
  console.error("Missing brand-template/vi-brand-mark.tsx");
  process.exit(1);
}

let changed = 0;
for (const target of targets) {
  const absolute = path.join(root, target.file);
  if (!fs.existsSync(absolute)) { console.error(`Missing ${target.file}`); process.exit(1); }
  const original = fs.readFileSync(absolute, "utf8");
  const next = target.replace(original);
  if (next === null) { console.error(`Expected legacy VI mark not found in ${target.file}`); process.exit(1); }
  if (next !== original) {
    changed++;
    console.log(`${apply ? "Updating" : "Would update"} ${target.file}`);
    if (apply) fs.writeFileSync(absolute, next);
  }
}

console.log(`${apply ? "Installing" : "Would install"} components/brand/vi-brand-mark.tsx`);
if (apply) {
  fs.mkdirSync(path.dirname(componentTarget), { recursive: true });
  fs.copyFileSync(componentSource, componentTarget);
}
console.table({ mode: apply ? "apply" : "dry-run", changedFiles: changed, component: apply ? "installed" : "ready" });

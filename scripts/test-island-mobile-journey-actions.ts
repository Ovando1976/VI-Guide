import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const page = readFileSync(
  path.join(process.cwd(), "app/island/page.tsx"),
  "utf8",
);

assert.match(page, /href="\/explore"[\s\S]*?Discover/);
assert.match(page, /href="\/mobility"[\s\S]*?Move/);
assert.match(page, /href="\/trips"[\s\S]*?My Trip/);
assert.match(page, /top-\[52px\]/);
assert.match(page, /main header[\s\S]*?top: 100px/);

console.log("Island mobile journey actions passed.");

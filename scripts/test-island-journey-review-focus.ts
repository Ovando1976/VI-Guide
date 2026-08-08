import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const focus = readFileSync(resolve(process.cwd(), "docs/island-journey-review-focus.md"), "utf8");
assert.match(focus, /five functional files/);
assert.match(focus, /existing governed ferry data should drive the water leg/);
assert.match(focus, /receive context rather than being reimplemented/);
console.log("VI Guide connected Journey production-review contracts passed.");

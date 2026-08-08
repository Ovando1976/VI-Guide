import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const checklist = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-checklist.md"), "utf8");
assert.match(checklist, /\[x\] Connected multimodal model added/);
assert.match(checklist, /\[ \] PR production checks pass/);
assert.match(checklist, /\[ \] Vercel production deployment READY after merge/);
console.log("VI Guide Island Journey PR checklist contracts passed.");

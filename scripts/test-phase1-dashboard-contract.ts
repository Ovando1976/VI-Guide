import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const page = await readFile(
  path.join(process.cwd(), "app/admin/analytics/page.tsx"),
  "utf8",
);
assert.match(page, /session\.role !== "admin"/);
assert.match(page, /Client financial events/);
assert.match(page, /Unattributed financial events/);
assert.match(page, /return_buffer_met/);
assert.match(page, /Phase 1 is not production-ready/);

console.log("Phase 1 dashboard contract passed.");

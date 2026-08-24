import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const driverLayout = fs.readFileSync(path.join(root, "app/driver/layout.tsx"), "utf8");
const driverPage = fs.readFileSync(path.join(root, "app/driver/page.tsx"), "utf8");
const driverApplyPage = fs.readFileSync(path.join(root, "app/driver/apply/page.tsx"), "utf8");
const drivePage = fs.readFileSync(path.join(root, "app/drive/page.tsx"), "utf8");

assert.equal(driverLayout.includes('session.role !== "driver"'), false);
assert.ok(driverPage.includes('requireSession(["driver", "admin"])'));
assert.ok(driverApplyPage.includes('session.role !== "rider"'));
assert.ok(drivePage.includes('href="/login?next=/driver/apply"'));
assert.ok(drivePage.includes("$0"));
assert.ok(drivePage.includes("15%"));
assert.ok(drivePage.includes("85%"));

console.log("USVI Explorer driver onboarding route contracts passed.");

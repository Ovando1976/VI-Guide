import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve(process.cwd(), "app/journey/page.tsx"), "utf8");
assert.match(page, /Island Journey/);
assert.match(page, /DoorToDoorJourneyPlanner/);
assert.match(page, /Connected travel/);
assert.match(page, /secondaryHref="\/trips"/);
assert.match(page, /Ask VI Concierge/);
console.log("VI Guide island journey entry contracts passed.");

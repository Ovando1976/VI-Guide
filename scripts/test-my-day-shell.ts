import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const todayPage = readFileSync(resolve(root, "app/today/page.tsx"), "utf8");
const workspace = readFileSync(
  resolve(root, "components/intelligence/ai-trip-brief-screen.tsx"),
  "utf8",
);

assert.match(todayPage, /<main\b/);
assert.equal(
  [...todayPage.matchAll(/<main\b/g)].length,
  1,
  "My Day route must own exactly one main landmark",
);
assert.match(todayPage, /<ViPublicHeader/);
assert.match(todayPage, /actionHref="\/trips"/);
assert.match(todayPage, /secondaryHref="\/planner"/);
assert.match(todayPage, /<AiTripBriefScreen initialIsland=\{island\} \/>/);
assert.match(todayPage, /<ProactiveTripIntelligence mode="banner" islandOverride=\{island\} \/>/);
assert.doesNotMatch(
  todayPage,
  /today-brief-shell|<style>/,
  "My Day must not depend on shell-hiding CSS workarounds",
);

assert.doesNotMatch(
  workspace,
  /<main\b/,
  "My Day intelligence workspace must not create a second main landmark inside /today",
);
assert.doesNotMatch(
  workspace,
  /href="\/" className="text-sm font-black tracking-tight">VI Guide/,
  "My Day must not render a second internal VI Guide header",
);
assert.match(workspace, /Your island day, in one place\./);
assert.match(workspace, /Open Living Map/);
assert.match(workspace, /href=\{`\/map\?island=\$\{island\}`\}/);
assert.match(workspace, /Ask Concierge/);
assert.match(workspace, /href=\{`\/concierge\?island=\$\{island\}`\}/);
assert.match(workspace, /href=\{`\/mobility\?island=\$\{island\}`\}/);
assert.match(workspace, /href=\{`\/accommodations\?island=\$\{island\}`\}/);

assert.match(workspace, /askViIntelligence/);
assert.match(workspace, /getIntelligenceMemory/);
assert.match(workspace, /readJourneyPlans/);
assert.match(workspace, /fetch\("\/api\/intelligence\/actions"/);
assert.match(workspace, /requiresConfirmation/);
assert.match(workspace, /confirmed: !action\.requiresConfirmation/);
assert.match(workspace, /workflowId: response\?\.orchestration\?\.context\?\.workflow\?\.id/);
assert.match(workspace, /pendingActions\.map/);
assert.match(workspace, /recommendations\.slice\(0, 6\)\.map/);
assert.match(workspace, /plan\.slice\(0, 8\)\.map/);

console.log("VI Guide My Day shared-shell contracts passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const todayPage = readFileSync(resolve(root, "app/today/page.tsx"), "utf8");
const workspace = readFileSync(
  resolve(root, "components/intelligence/ai-trip-brief-screen.tsx"),
  "utf8",
);
const conditionsBrief = readFileSync(
  resolve(root, "components/intelligence/island-conditions-brief.tsx"),
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
assert.match(todayPage, /<IslandConditionsBrief island=\{island\} \/>/);
assert.match(todayPage, /<AiTripBriefScreen initialIsland=\{island\} \/>/);
assert.match(todayPage, /<ProactiveTripIntelligence mode="banner" islandOverride=\{island\} \/>/);
assert.doesNotMatch(
  todayPage,
  /today-brief-shell|<style>/,
  "My Day must not depend on shell-hiding CSS workarounds",
);

assert.match(conditionsBrief, /\/api\/beach-intelligence\?island=\$\{island\}/);
assert.match(conditionsBrief, /Official conditions now/);
assert.match(conditionsBrief, /NWS forecast/);
assert.match(conditionsBrief, /NWS alerts/);
assert.match(conditionsBrief, /NOAA \/ NDBC coast/);
assert.match(conditionsBrief, /No fresh governed wave reading/);
assert.match(conditionsBrief, /does not turn missing or stale marine data into a beach-safety rating/);
assert.match(conditionsBrief, /Forecast ≠ observation · Observation ≠ safety rating/);
assert.doesNotMatch(conditionsBrief, /safe to swim|safe beach|calm water|ferry is on time/i);

assert.doesNotMatch(
  workspace,
  /<main\b/,
  "My Day intelligence workspace must not create a second main landmark inside /today",
);
assert.doesNotMatch(
  workspace,
  /href="\/" className="text-sm font-black tracking-tight">USVI Explorer/,
  "My Day must not render a second internal USVI Explorer header",
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

assert.match(workspace, /readSelectedTravelerTripPlanId/);
assert.match(workspace, /activeJourney\?\.island === island/);
assert.match(workspace, /Brief generated/);
assert.match(workspace, /Suggested actions/);
assert.match(workspace, /Saved-trip status/);
assert.match(workspace, /Planning draft only/);
assert.match(workspace, /Active trip connected/);
assert.match(workspace, /not a saved or confirmed itinerary/);
assert.doesNotMatch(workspace, /label="Trip progress"/);
assert.doesNotMatch(workspace, /Good to go on/);
assert.doesNotMatch(workspace, /Ready for today/);

console.log("USVI Explorer My Day shared-shell contracts passed.");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const navigation = fs.readFileSync(
  path.join(root, "components/app-navigation.tsx"),
  "utf8",
);
const accountMenu = fs.readFileSync(
  path.join(root, "components/account-menu.tsx"),
  "utf8",
);
const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Operations navigation contract failed: ${label}`);
  }
}

expectSource(layout, "<AppNavigation />", "root layout keeps the shared navigation boundary");
expectSource(navigation, "operationsItemsFor", "navigation resolves operating mode from the current route");
expectSource(navigation, '["/admin", "/architecture"]', "admin and Architecture use the operations shell");
expectSource(navigation, '["/driver"]', "Driver uses the operations shell");
expectSource(navigation, '["/merchant", "/provider"]', "Merchant and Provider use the business operations shell");
expectSource(navigation, 'aria-label="Operations navigation"', "operations shell has a distinct accessible identity");
expectSource(navigation, "app-nav--operations", "operations shell is explicitly distinguishable from traveler navigation");
expectSource(navigation, "<AccountMenu embedded />", "operations shell preserves Account and Logout access");

for (const [route, label] of [
  ["/admin", "operations home"],
  ["/admin/dispatch", "dispatch"],
  ["/admin/payouts", "dispatcher-safe payout review"],
] as const) {
  expectSource(navigation, `base: "${route}"`, `admin operations shell keeps ${label}`);
}

if (
  navigation.includes('base: "/admin/commerce-ledger"') ||
  navigation.includes('base: "/admin/commerce-settlements"') ||
  navigation.includes('base: "/admin/merchants"')
) {
  throw new Error(
    "Operations navigation contract failed: shared admin/dispatcher shell must not advertise administrator-only destinations",
  );
}

expectSource(navigation, 'base: "/driver"', "Driver shell keeps Driver OS entry");
expectSource(navigation, 'base: "/map"', "Driver shell keeps Live Map escape");
expectSource(navigation, 'base: "/merchant"', "business shell keeps Business console entry");
expectSource(navigation, 'base: "/provider/operations"', "business shell keeps availability operations entry");
expectSource(navigation, 'base: "/", label: "Public Guide"', "every operations shell can return to the public VI Guide");

expectSource(navigation, 'aria-label="Primary navigation"', "traveler routes retain the original primary navigation");
expectSource(navigation, 'label: "Explore"', "traveler Explore navigation remains intact");
expectSource(navigation, 'label: "My Trip"', "traveler My Trip navigation remains intact");
expectSource(navigation, 'label: "Concierge"', "traveler Concierge navigation remains intact");

expectSource(accountMenu, 'label="Driver workspace"', "Account menu keeps Driver workspace recovery");
expectSource(accountMenu, 'label="Business console"', "Account menu keeps Business console recovery");
expectSource(accountMenu, 'label="Operations dashboard"', "Account menu keeps Admin/dispatcher operations recovery");
expectSource(accountMenu, "Sign out", "Account menu keeps logout available");

console.log("VI Guide route-aware operations navigation contracts passed.");

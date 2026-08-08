import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dashboard = fs.readFileSync(path.join(root, "app/admin/page.tsx"), "utf8");
const merchants = fs.readFileSync(path.join(root, "app/admin/merchants/page.tsx"), "utf8");
const commerceLedger = fs.readFileSync(
  path.join(root, "app/admin/commerce-ledger/page.tsx"),
  "utf8",
);
const commerceSettlements = fs.readFileSync(
  path.join(root, "app/admin/commerce-settlements/page.tsx"),
  "utf8",
);
const travelRequests = fs.readFileSync(
  path.join(root, "app/admin/travel-requests/page.tsx"),
  "utf8",
);
const travelProposals = fs.readFileSync(
  path.join(root, "app/admin/travel-proposals/page.tsx"),
  "utf8",
);
const cruiseRequests = fs.readFileSync(
  path.join(root, "app/admin/cruise-requests/page.tsx"),
  "utf8",
);
const notifications = fs.readFileSync(
  path.join(root, "app/admin/notifications/page.tsx"),
  "utf8",
);
const partnerApplications = fs.readFileSync(
  path.join(root, "app/admin/partner-applications/page.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Admin dashboard role boundary contract failed: ${label}`);
  }
}

expectSource(dashboard, "getSession", "dashboard resolves the verified application session");
expectSource(dashboard, 'session.role !== "admin" && session.role !== "dispatcher"', "dashboard keeps the admin/dispatcher route boundary");
expectSource(dashboard, 'const isAdmin = session.role === "admin"', "dashboard derives administrator capability");
expectSource(dashboard, "SHARED_ACTIONS", "dashboard defines dispatcher-safe operations separately");
expectSource(dashboard, "ADMIN_ONLY_ACTIONS", "dashboard defines administrator-only operations separately");
expectSource(dashboard, "? [...SHARED_ACTIONS, ...ADMIN_ONLY_ACTIONS]", "administrator receives the full action set");
expectSource(dashboard, ": SHARED_ACTIONS", "dispatcher receives only dispatcher-safe actions");
expectSource(dashboard, "Dispatcher workspace.", "dispatcher scope is explained in the UI");

for (const [route, label] of [
  ["/admin/merchants", "merchant access"],
  ["/admin/commerce-ledger", "commerce accounting"],
  ["/admin/commerce-settlements", "marketplace settlements"],
] as const) {
  expectSource(dashboard, `href: "${route}"`, `${label} remains present for administrators`);
}

for (const [source, label] of [
  [merchants, "merchant access stays admin-only"],
  [commerceLedger, "commerce accounting stays admin-only"],
  [commerceSettlements, "marketplace settlements stay admin-only"],
] as const) {
  expectSource(source, 'session.role !== "admin"', label);
}

for (const [source, label] of [
  [travelRequests, "travel advisor remains dispatcher-capable"],
  [travelProposals, "travel proposals remain dispatcher-capable"],
  [cruiseRequests, "cruise advisor remains dispatcher-capable"],
  [notifications, "notification operations remain dispatcher-capable"],
  [partnerApplications, "partner intake remains dispatcher-capable"],
] as const) {
  expectSource(source, '["admin", "dispatcher"]', label);
}

console.log("VI Guide admin dashboard role boundary contracts passed.");

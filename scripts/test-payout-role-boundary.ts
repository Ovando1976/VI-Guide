import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/admin/payouts/page.tsx"), "utf8");
const dispatcherView = fs.readFileSync(
  path.join(root, "components/dispatcher-settlement-ledger.tsx"),
  "utf8",
);
const adminView = fs.readFileSync(
  path.join(root, "components/payout-ledger.tsx"),
  "utf8",
);
const settlementReadApi = fs.readFileSync(
  path.join(root, "app/api/admin/settlements/route.ts"),
  "utf8",
);
const settlementPaidApi = fs.readFileSync(
  path.join(root, "app/api/admin/settlements/[bookingId]/paid/route.ts"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Payout role boundary contract failed: ${label}`);
  }
}

expectSource(page, "getSession", "Payout page resolves the verified application session");
expectSource(page, 'session.role !== "admin" && session.role !== "dispatcher"', "Payout page keeps the intended admin/dispatcher read boundary");
expectSource(page, 'session.role === "admin"', "Payout page branches on administrator capability");
expectSource(page, "<PayoutLedger />", "Administrators keep the full payout ledger");
expectSource(page, "<DispatcherSettlementLedger />", "Dispatchers receive the read-only settlement view");

expectSource(dispatcherView, 'fetch("/api/admin/settlements"', "Dispatcher view reads the governed settlement API");
expectSource(dispatcherView, "Read-only dispatcher access.", "Dispatcher view labels its capability honestly");
expectSource(dispatcherView, "Only an administrator can record an external payout as paid", "Dispatcher view explains the financial action boundary");
if (dispatcherView.includes('method: "POST"') || dispatcherView.includes("/paid")) {
  throw new Error(
    "Payout role boundary contract failed: dispatcher view must not expose a settlement write path",
  );
}

expectSource(adminView, "Record payment evidence", "Administrator view keeps payment evidence controls");
expectSource(adminView, "/paid", "Administrator view keeps the payment evidence endpoint");
expectSource(settlementReadApi, 'requireSession(["admin", "dispatcher"])', "Settlement ledger remains readable by admin and dispatcher");
expectSource(settlementPaidApi, 'requireSession(["admin"])', "Recording settlement payment evidence remains admin-only at the API boundary");

console.log("VI Guide payout role boundary contracts passed.");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const legacyProviderPage = fs.readFileSync(
  path.join(root, "app/provider/operations/page.tsx"),
  "utf8",
);
const merchantAvailabilityPage = fs.readFileSync(
  path.join(root, "app/merchant/availability/page.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Provider shell handoff contract failed: ${label}`);
  }
}

expectSource(
  legacyProviderPage,
  '["merchant", "dispatcher", "admin"].includes(session.role)',
  "legacy Provider route preserves its verified business-role boundary",
);
expectSource(
  legacyProviderPage,
  "resolveMerchantListingSelection",
  "legacy Provider route normalizes listing scope before handoff",
);
expectSource(
  legacyProviderPage,
  'params.set("listingId", canonicalListingId)',
  "legacy Provider route preserves the canonical listing context",
);
expectSource(
  legacyProviderPage,
  "/merchant/availability",
  "legacy Provider route hands off into the synchronized Merchant shell",
);
if (legacyProviderPage.includes("<ProviderOperationsBoard")) {
  throw new Error(
    "Provider shell handoff contract failed: legacy Provider route must not render a second shell outside Merchant Availability",
  );
}
expectSource(
  merchantAvailabilityPage,
  "<ProviderOperationsBoard",
  "Merchant Availability remains the governed provider-operations surface",
);
expectSource(
  merchantAvailabilityPage,
  'restrictToManagedListings={session.role === "merchant"}',
  "Merchant Availability preserves merchant listing restrictions",
);

console.log("USVI Explorer Provider-to-Merchant shell handoff contracts passed.");

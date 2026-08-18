import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tariffEngine = fs.readFileSync(
  path.join(root, "lib/usvi-taxi-tariffs.ts"),
  "utf8",
);
const quoteRoute = fs.readFileSync(
  path.join(root, "app/api/bookings/quote/route.ts"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Taxi tariff endpoint gate contract failed: ${label}`);
  }
}

expectSource(
  tariffEngine,
  '"town"',
  "Town remains gated until Charlotte Amalie endpoint identity is confirmed",
);
expectSource(
  tariffEngine,
  '"lindbergh bay"',
  "Lindbergh Bay remains separate from Airport Terminal pricing",
);
expectSource(
  tariffEngine,
  '"dorothea estate"',
  "Dorothea Estate remains separate from Dorothea pricing",
);
expectSource(
  tariffEngine,
  "assertEndpointIdentityConfirmed(params.origin)",
  "origin endpoint identity is checked before tariff matching",
);
expectSource(
  tariffEngine,
  "assertEndpointIdentityConfirmed(params.destination)",
  "destination endpoint identity is checked before tariff matching",
);
expectSource(
  tariffEngine,
  "const tariff = await loadActiveTariff(params.origin.island)",
  "official tariff loading remains in the quote engine",
);
expectSource(
  tariffEngine,
  "assertFareConfirmationNotRequired(rule, party)",
  "rule-level passenger confirmation gates remain active",
);
expectSource(
  quoteRoute,
  "manualReviewRequired: true",
  "blocked official fares surface as manual review to the booking API",
);
expectSource(
  quoteRoute,
  "error instanceof OfficialTaxiRateUnavailableError",
  "booking API preserves the official-rate fail-closed error boundary",
);

const originGate = tariffEngine.indexOf(
  "assertEndpointIdentityConfirmed(params.origin)",
);
const destinationGate = tariffEngine.indexOf(
  "assertEndpointIdentityConfirmed(params.destination)",
);
const tariffLoad = tariffEngine.indexOf(
  "const tariff = await loadActiveTariff(params.origin.island)",
);
if (
  originGate < 0 ||
  destinationGate < 0 ||
  tariffLoad < 0 ||
  originGate > tariffLoad ||
  destinationGate > tariffLoad
) {
  throw new Error(
    "Taxi tariff endpoint gate contract failed: endpoint identity checks must run before tariff lookup",
  );
}

console.log("USVI taxi tariff endpoint gate contracts passed.");

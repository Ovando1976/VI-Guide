import assert from "node:assert/strict";

import { MockCruiseInventoryProvider } from "../lib/cruise-inventory/mock-provider";
import {
  getCruiseInventoryReadiness,
  publicCruiseInventoryStatus,
} from "../lib/cruise-inventory/readiness";
import { normalizeCruiseSearchRequest } from "../lib/cruise-inventory/search-validation";
import {
  normalizeCruiseAvailabilityRequest,
  normalizeCruiseQuoteRequest,
} from "../lib/cruise-inventory/transaction-validation";

async function main() {
  const disabled = getCruiseInventoryReadiness({
    NODE_ENV: "production",
    VERCEL_ENV: "production",
  });
  assert.equal(disabled.provider, "disabled");
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.live, false);
  assert.equal(disabled.capabilities.search, false);
  assert.match(disabled.nextAction, /Traveltek and Revelex/);

  const previewMock = getCruiseInventoryReadiness({
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
    CRUISE_INVENTORY_PROVIDER: "mock",
    CRUISE_INVENTORY_ENABLE_MOCK: "true",
  });
  assert.equal(previewMock.provider, "mock");
  assert.equal(previewMock.enabled, true);
  assert.equal(previewMock.live, false);
  assert.equal(previewMock.capabilities.search, true);
  assert.equal(previewMock.capabilities.supplierPayments, false);

  const productionMock = getCruiseInventoryReadiness({
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    CRUISE_INVENTORY_PROVIDER: "mock",
    CRUISE_INVENTORY_ENABLE_MOCK: "true",
  });
  assert.equal(productionMock.enabled, false);
  assert.equal(productionMock.live, false);
  assert.equal(productionMock.capabilities.search, false);

  const attemptedTraveltekEnablement = getCruiseInventoryReadiness({
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    CRUISE_INVENTORY_PROVIDER: "traveltek",
    CRUISE_INVENTORY_CONTRACT_APPROVED: "true",
    TRAVELTEK_API_BASE_URL: "https://sandbox.invalid",
    TRAVELTEK_API_KEY: "test-key",
    TRAVELTEK_AGENCY_ID: "test-agency",
    CRUISE_INVENTORY_ADAPTER_ENABLED: "true",
    CRUISE_INVENTORY_PRODUCTION_CERTIFIED: "true",
    CRUISE_INVENTORY_LIVE_ENABLED: "true",
  });
  assert.equal(attemptedTraveltekEnablement.provider, "traveltek");
  assert.equal(attemptedTraveltekEnablement.enabled, false);
  assert.equal(attemptedTraveltekEnablement.live, false);
  assert.equal(attemptedTraveltekEnablement.capabilities.booking, false);
  assert.ok(
    attemptedTraveltekEnablement.missingRequirements.some((requirement) =>
      requirement.includes("Implement, review, and test"),
    ),
  );

  assert.deepEqual(publicCruiseInventoryStatus(previewMock), {
    provider: "mock",
    stage: "adapter_validation",
    enabled: true,
    live: false,
    capabilities: previewMock.capabilities,
    nextAction: previewMock.nextAction,
  });

  const now = new Date("2026-08-06T19:00:00.000Z");
  const validSearch = normalizeCruiseSearchRequest(
    {
      departureDateFrom: "2026-11-01",
      departureDateTo: "2026-12-31",
      departurePortIds: ["MIA", "MIA"],
      destinationNames: ["U.S. Virgin Islands"],
      adults: "2",
      childAges: [8],
      currency: "usd",
      limit: "20",
    },
    now,
  );
  assert.equal(validSearch.ok, true);
  if (validSearch.ok) {
    assert.deepEqual(validSearch.request.departurePortIds, ["MIA"]);
    assert.deepEqual(validSearch.request.childAges, [8]);
    assert.equal(validSearch.request.currency, "USD");
    assert.equal(validSearch.request.limit, 20);
  }

  const invalidSearch = normalizeCruiseSearchRequest(
    {
      departureDateFrom: "2026-12-31",
      departureDateTo: "2026-11-01",
      adults: 2,
      childAges: [],
    },
    now,
  );
  assert.equal(invalidSearch.ok, false);
  assert.equal(
    invalidSearch.ok ? "" : invalidSearch.error,
    "The cruise search end date must follow the start date.",
  );

  const availabilityValidation = normalizeCruiseAvailabilityRequest({
    sailingId: "mock_sailing_eastern_caribbean",
    adults: 2,
    childAges: [8],
    residencyCountryCode: "vi",
    currency: "usd",
    accessibleCabinRequired: true,
  });
  assert.equal(availabilityValidation.ok, true);
  if (availabilityValidation.ok) {
    assert.equal(availabilityValidation.request.residencyCountryCode, "VI");
    assert.equal(availabilityValidation.request.currency, "USD");
    assert.equal(availabilityValidation.request.accessibleCabinRequired, true);
  }

  const quoteValidation = normalizeCruiseQuoteRequest({
    sailingId: "mock_sailing_eastern_caribbean",
    cabinCategoryId: "mock_balcony",
    adults: 2,
    childAges: [],
    currency: "USD",
    travelerResidencies: ["VI", "US"],
  });
  assert.equal(quoteValidation.ok, true);

  const provider = new MockCruiseInventoryProvider();
  const search = await provider.searchSailings({
    departureDateFrom: "2026-11-01",
    departureDateTo: "2027-01-31",
    destinationNames: ["U.S. Virgin Islands"],
    adults: 2,
    childAges: [],
    currency: "USD",
    limit: 10,
  });
  assert.equal(search.provider, "mock");
  assert.equal(search.live, false);
  assert.equal(search.results.length, 2);
  assert.ok(search.results.every((sailing) => sailing.liveVerified === false));
  assert.ok(
    search.results.every((sailing) =>
      sailing.leadFare?.promotionNames?.includes(
        "Synthetic inventory — not for sale",
      ),
    ),
  );

  const sailing = search.results[0];
  assert.ok(sailing);
  const availability = await provider.getCabinAvailability({
    sailingId: sailing.id,
    adults: 2,
    childAges: [],
    currency: "USD",
  });
  assert.equal(availability.categories.length, 3);
  assert.ok(availability.categories.every((category) => category.available));

  const quote = await provider.createQuote({
    sailingId: sailing.id,
    cabinCategoryId: "mock_balcony",
    adults: 2,
    childAges: [],
    currency: "USD",
  });
  assert.equal(quote.provider, "mock");
  assert.match(quote.id, /^mock_quote_/);
  assert.match(quote.termsSummary, /Synthetic development quote/);
  assert.ok(quote.total.amountCents > 0);

  const hold = await provider.holdCabin({
    quoteId: quote.id,
    travelers: [
      {
        type: "adult",
        firstName: "Test",
        lastName: "Traveler",
        dateOfBirth: "1980-01-01",
      },
    ],
    clientReference: "VI-TEST-001",
  });
  assert.equal(hold.status, "held");
  assert.match(hold.id, /^mock_hold_/);

  const booking = await provider.createBooking({
    holdId: hold.id,
    quoteId: quote.id,
    travelers: [
      {
        type: "adult",
        firstName: "Test",
        lastName: "Traveler",
        dateOfBirth: "1980-01-01",
      },
    ],
    customerEmail: "traveler@example.com",
    paymentMode: "supplier_hosted",
    clientReference: "VI-TEST-001",
    idempotencyKey: "test-idempotency-key",
  });
  assert.equal(booking.status, "pending_payment");
  assert.equal(booking.supplierPaymentUrl, null);
  assert.equal(booking.cruiseLineConfirmationNumber, null);

  console.log("Cruise inventory foundation tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

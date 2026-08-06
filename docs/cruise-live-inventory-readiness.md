# VI Guide Live Cruise Inventory Readiness

Verified: August 6, 2026

## Purpose

This runbook defines the commercial, legal, security, and engineering work required before VI Guide can present cruise sailings, cabins, pricing, holds, or bookings as live supplier inventory.

The application must fail closed until all required contracts, credentials, provider mappings, payment responsibilities, and production certification are complete.

## Current state

VI Guide currently provides:

- a public cruise-planning request experience;
- a protected cruise-advisor operations queue;
- canonical provider-neutral cruise inventory models;
- provider-neutral search, sailing, availability, and quote endpoints;
- a non-production mock provider for contract and user-interface testing;
- an administrator readiness dashboard at `/admin/cruise-inventory`;
- explicit controls preventing synthetic inventory from being enabled in production.

VI Guide does **not** currently have permission or credentials to retrieve or sell live cruise inventory.

## Provider candidates

### Traveltek

Official product information:

- https://www.traveltek.com/travel-api-provider/cruise-api/
- https://www.traveltek.com/products/cruiseconnect/
- https://www.traveltek.com/contact/

Traveltek states that its Cruise API provides real-time itineraries, cabin availability, current pricing, live booking, holds, content, Postman collections, documentation, webhooks, and integration support. Traveltek also states that the agency must have cruise-line credentials, although Traveltek can help request API bookability on the agency profile.

Traveltek is the preferred first commercial conversation because it supports both an API route and intermediate advisor/white-label products.

### Revelex

Official product information:

- https://www.revelex.com/en/solutions/cruise
- https://www.revelex.com/en/services/api
- https://www.revelex.com/en/solutions/power-agent

Official sales contact:

- sales@revelex.com
- +1 877 REVELEX

Revelex states that its cruise platform and headless APIs provide real-time cruise inventory, dynamic pricing, cabin availability, search, booking, payment integrations, documentation, support, and a sandbox environment.

Revelex should receive the same requirements package so VI Guide can compare commercial terms, inventory coverage, implementation support, and production certification.

## Host-agency candidates

A host agency can provide supplier relationships, commission processing, booking support, professional training, and recognized agency credentials while VI Guide develops its own production and sales history.

Initial candidates for structured interviews:

### Nexion Travel Group

- https://nexion.com/
- U.S.-based host agency supporting independent and multi-advisor agencies.
- Publicly states access to more than 140 cruise, land, hotel, car, and insurance preferred supplier partners.
- Public phone: 800-747-6813.

### KHM Travel Group

- https://www.khmtravel.com/
- https://khmtravel.com/become-a-cruise-travel-agent/
- Publicly states that it supports independent travel agents and is a CLIA Premier Agency Member.
- Published program at verification: $64.95 monthly, $149 registration, and an 80% commission split; commercial terms must be re-confirmed before signing.
- Membership phone: 1-888-611-1220.

The decisive host-agency question is not only commission split. VI Guide needs written permission to operate its own branded customer application and connect a third-party cruise inventory API using the host's supplier credentials or approved subagency structure.

## CLIA and USVI requirements

CLIA 2026 Travel Agency Membership information:

- https://trade.cruising.org/north-america-membership/travel-agency-membership-tam
- Published annual dues at verification: $429.

CLIA membership provides recognized agency credentials and professional resources, but it is not a cruise inventory API and does not replace cruise-line appointments.

USVI business-license application information:

- https://dlca.vi.gov/businesslicense/applicationform/other/

The business description submitted for licensing review should expressly describe online travel advisory, cruise reservation facilitation, tourism services, and transportation/excursion coordination. VI Guide should obtain written guidance from DLCA on the exact license categories before collecting travel-planning fees or acting as seller of travel.

## Commercial request package

Send the same factual project description to Traveltek and Revelex:

> VI Guide is a U.S. Virgin Islands-focused travel platform built with Next.js, Firebase, and Vercel. The application already supports traveler profiles, itinerary planning, accommodations, local mobility, merchant offers, payments for authorized local services, and a human-assisted cruise-advisor workflow. We are seeking a cruise inventory partner for a branded headless integration covering live sailing search, itineraries, ship and cabin content, agency fares, occupancy pricing, cabin availability, repricing, holds, supplier-hosted payment, booking confirmation, retrieval, amendments, cancellations, and webhooks. We intend to begin in a sandbox, certify a controlled booking workflow, and initially keep cruise fare payment in the provider or host-agency-approved environment.

## Supplier questions

Request written answers to all of the following:

1. Which ocean and river cruise lines are available to U.S. and USVI agencies?
2. Which lines support live search, cabin availability, booking, holds, amendments, cancellations, and payments through the API?
3. Does the provider supply ship content, cabin images, deck plans, itinerary content, promotions, and fare rules?
4. Can the API return agency, consortium, group, military, resident, loyalty, past-passenger, and promotional fares?
5. How are third- and fourth-passenger pricing, single supplements, taxes, fees, gratuities, and packages represented?
6. What supplier or cruise-line credentials must VI Guide or its host agency provide?
7. Can a host agency authorize a branded subagency application to use its supplier profiles?
8. Is a sandbox available before the commercial contract is complete?
9. What documentation, Postman collections, sample payloads, test inventory, and certification scripts are supplied?
10. What are the setup, implementation, monthly, usage, support, and transaction fees?
11. Are there minimum sales volumes, contract terms, or early-termination fees?
12. Who is merchant of record for cruise fares?
13. Which party handles deposits, final payments, refunds, cancellations, chargebacks, and fraud?
14. Is supplier-hosted or provider-hosted payment available so VI Guide does not process card data?
15. How are booking changes and cancellations synchronized?
16. What webhook events and retry guarantees are available?
17. What uptime, latency, rate-limit, support, and incident-response commitments are provided?
18. What content licenses and caching limits apply?
19. How long may search, pricing, and content data be cached?
20. What is required for production certification and go-live approval?

## Host-agency questions

1. May VI Guide operate under its own name and customer-facing brand?
2. Who owns customer records and leads generated by VI Guide?
3. May VI Guide use a headless Traveltek or Revelex integration?
4. May the host's cruise-line supplier IDs be used by an approved branded application?
5. Are subagents or multiple VI Guide advisors allowed?
6. What commission split applies to cruise, insurance, hotel, air, and package sales?
7. When are commissions paid, and how are recalls handled?
8. Who handles cruise fare payments, refunds, chargebacks, and fraud losses?
9. What errors-and-omissions coverage is provided, and what exclusions apply?
10. What licenses, seller-of-travel registrations, or territorial requirements remain VI Guide's responsibility?
11. What happens to active bookings and customer data if the relationship ends?
12. Are there exclusivity, noncompete, nonsolicitation, minimum production, or technology restrictions?

## Engineering phases

### Phase 1 — Contract foundation

Implemented in this release:

- canonical inventory types;
- `CruiseInventoryProvider` interface;
- fail-closed provider registry;
- readiness state machine;
- search, sailing-detail, cabin-availability, and quote API contracts;
- non-production mock provider;
- release-gated tests.

### Phase 2 — Provider sandbox adapter

After official documentation and credentials arrive:

1. Add a provider-specific authentication client.
2. Map supplier ports, cruise lines, ships, itineraries, cabins, fares, and promotions to canonical models.
3. Implement supplier timeouts, retries, correlation IDs, and safe logging.
4. Add controlled caching for non-price content only where the contract permits.
5. Implement live search and sailing details.
6. Implement cabin availability and quote creation.
7. Reprice immediately before every hold or booking.
8. Store request/response hashes and normalized audit records without exposing secrets or payment-card data.

### Phase 3 — Holds and booking

1. Implement cabin holds where supported.
2. Create idempotent booking requests.
3. Redirect the traveler to a supplier- or host-approved payment page.
4. Confirm the reservation only after a valid supplier booking ID and cruise-line confirmation number are returned.
5. Add booking retrieval, amendment, cancellation, and webhook reconciliation.
6. Connect the confirmed itinerary to VI Guide port-day planning, transportation, and excursions.

### Phase 4 — Production certification

Required evidence:

- successful supplier search;
- occupancy-sensitive cabin availability;
- quote and reprice with taxes and fees;
- price-change and sold-out handling;
- hold creation and expiration;
- idempotent booking;
- failed payment and retry handling;
- confirmed booking retrieval;
- cancellation with penalty disclosure;
- webhook retry and replay safety;
- reconciliation between supplier records and VI Guide records;
- no raw card data stored or logged.

## Environment controls

Development or preview mock inventory:

```text
CRUISE_INVENTORY_PROVIDER=mock
CRUISE_INVENTORY_ENABLE_MOCK=true
```

External provider preparation:

```text
CRUISE_INVENTORY_PROVIDER=traveltek
CRUISE_INVENTORY_CONTRACT_APPROVED=false
TRAVELTEK_API_BASE_URL=
TRAVELTEK_API_KEY=
TRAVELTEK_AGENCY_ID=
CRUISE_INVENTORY_ADAPTER_ENABLED=false
CRUISE_INVENTORY_PRODUCTION_CERTIFIED=false
CRUISE_INVENTORY_LIVE_ENABLED=false
```

Equivalent `REVELEX_*` variables apply when Revelex is selected.

The current source intentionally prevents Traveltek or Revelex calls from being enabled by environment variables alone. The provider-specific adapter must be implemented and reviewed in source code before any external inventory capability can become available.

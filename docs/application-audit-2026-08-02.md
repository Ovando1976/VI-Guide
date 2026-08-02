# Application and production health audit

_Date: 2026-08-02 · Scope: application routes and shared API behavior_

## Feature audit

| Area | Surfaces reviewed | Current behavior | Next verification |
| --- | --- | --- | --- |
| AI Concierge | `/concierge`, `/api/concierge/chat`, evidence and heritage APIs | Local grounded fallback protects the main experience when the model provider fails; durable history failures are non-fatal. | Add fixed regression prompts and test slow-model cancellation. |
| Heritage Explorer | `/heritage`, heritage search, Library of Congress, heritage concierge | Search and grounded concierge paths exist; external collection failure has a controlled error response. | Validate no-result copy and upstream timeout behavior. |
| Tourism | beaches, restaurants, stays and directory pages | Beaches and restaurants retain curated, cacheable fallbacks without Google credentials. | Audit missing images and stale business metadata. |
| Search | `/api/search`, geography search and search UI | Public search remains available without authentication. | Add query latency telemetry and explicit zero-result UI coverage. |
| Maps | `/map`, territory, estates and routing APIs | Curated territory data and routing errors are controlled; route request parsing now shares safe JSON handling. | Exercise provider timeouts and offline/empty map states. |
| Bookings | ride, commerce, stay, payment and status routes | Booking lifecycle endpoints are present, including cancellation and reconciliation paths. | Run the full lifecycle with seeded rider, driver and Stripe test fixtures. |
| Authentication | `/login`, session API, middleware-protected pages | Empty or malformed session requests return controlled client errors; non-JSON content now receives 415. | Add seeded role checks for rider, driver, dispatcher and admin. |

## Production health review

- **Runtime logs:** route failures use contextual server log labels, but there is no repository-backed production log export. Review Vercel and provider logs before each release and add request correlation IDs as the next observability increment.
- **Potentially slow endpoints:** concierge model calls, Google Places fan-out, public OSRM routing, Firestore operational queues and Library of Congress requests depend on remote services. Measure p50/p95/p99 before changing cache or timeout policy.
- **Error handling:** shared JSON parsing now separates malformed JSON from unsupported content types. Provider-backed tourism catalogs remain useful through a shared fallback response contract.
- **Empty/loading states:** concierge has route-level loading and error boundaries. Map, beaches, heritage, booking and login still need route-level slow-render review plus component-level zero-result checks.

## Consolidation completed in this cycle

1. `lib/api/request.ts` owns safe JSON parsing and consistent parser error messages.
2. `lib/timestamps.ts` owns JavaScript and Firestore timestamp normalization, including the epoch fallback needed by operations sorting.
3. `lib/api/catalog-fallback.ts` owns cache and metadata behavior for curated tourism fallbacks.
4. Authentication, journeys, routing, mobility readiness, payment operations, taxi tariffs, beaches and restaurants now consume these shared utilities instead of repeating the logic.

## Prioritized follow-up

1. **P0:** Capture production request/error rates and p95 latency for concierge, Places, routing, booking creation and payment reconciliation.
2. **P1:** Add automated API contract tests for malformed bodies, provider fallback payloads and timestamp shapes.
3. **P1:** Add slow, empty and error-state browser tests for the seven audited customer surfaces.
4. **P2:** Seed role-based end-to-end fixtures and exercise booking/payment state transitions.
5. **P2:** Add correlation IDs and structured logging without exposing tokens or customer data.

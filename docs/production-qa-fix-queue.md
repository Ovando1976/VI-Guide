# Operation: Green Build — Production QA Fix Queue

_Last updated: 2026-08-01_

## Phase 1: Production stabilization baseline

Current local evidence shows the production build is green and free of ESLint warnings.

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| TypeScript + production build | `npm run release:check` | Pass | Runs `tsc --noEmit` followed by `next build`. |
| Lint | `npm run lint` | Pass | `next lint` reports no ESLint warnings or errors. |
| Runtime smoke test | `PORT=3100 npm run start` + route curls | Pass | Built app served locally on port 3100. |
| Tourism API fallback | Google-keyless `/api/beaches/live`, `/api/beaches/detail`, `/api/restaurants/live` curls | Pass | Curated catalog fallbacks return 200 when Google Places is not configured. |
| Auth malformed input | `POST /api/auth/session` with no body | Pass | Returns controlled 400 instead of a runtime exception. |
| Public POST malformed input | Empty-body POST curls for Concierge, Heritage Concierge, Route, Booking Quote, and Intelligence APIs | Pass | Core public feature APIs return controlled 400s instead of JSON parse exceptions. |

## Runtime smoke-test baseline

These routes were checked against the locally served production build on port 3100.

| Area | Route | Observed status | QA interpretation |
| --- | --- | --- | --- |
| Home | `/` | 200 | Public landing page renders. |
| AI Concierge | `/concierge` | 200 | Concierge page is reachable. |
| Mobility | `/mobility` | 200 | Rider mobility surface is reachable. |
| Tourism: Beaches | `/beaches` | 200 | Beaches entry point renders. |
| Tourism: Heritage | `/heritage` | 200 | Heritage entry point renders. |
| Maps | `/map` | 200 | Interactive map shell is reachable. |
| Booking | `/book` | 200 | Booking flow entry point renders. |
| Authentication-protected trips | `/trips` | 307 | Redirect behavior is expected for protected trip access. |
| Authentication | `/login` | 200 | Login surface renders. |
| Health API | `/api/health` | 200 | Health endpoint responds. |
| Search API | `/api/search` | 200 | Public search endpoint responds. |
| Live beaches fallback | `/api/beaches/live?island=stt&catalogVersion=3` | 200 | Falls back to curated beach catalog without Google Places credentials. |
| Beach detail fallback | `/api/beaches/detail?id=abi-beach&v=3` | 200 | Falls back to curated beach detail without Google Places credentials. |
| Live restaurants fallback | `/api/restaurants/live?island=stt` | 200 | Falls back to curated restaurant catalog without Google Places credentials. |
| Auth malformed request | `POST /api/auth/session` with empty body | 400 | Invalid input is handled without server exception. |
| Concierge malformed request | `POST /api/concierge/chat` with empty body | 400 | Invalid input is handled without server exception. |
| Heritage concierge malformed request | `POST /api/concierge/heritage` with empty body | 400 | Invalid input is handled without server exception. |
| Route malformed request | `POST /api/route` with empty body | 400 | Invalid coordinates are handled without server exception. |
| Booking quote malformed request | `POST /api/bookings/quote` with empty body | 400 | Missing route endpoints are handled without server exception. |
| Intelligence malformed request | `POST /api/intelligence` with empty body | 400 | Invalid input is handled without server exception. |

## Priority fix queue

### P0 — Production stabilization

- Monitor the next Vercel deployment and treat any Vercel-only TypeScript, build, environment, or route runtime issue as a release blocker.
- Keep `npm run release:check` and `npm run lint` as required gates before merging production changes.
- Keep curated fallbacks active for Google Places-backed tourism APIs so missing credentials do not break first-time browsing.
- Add targeted smoke coverage for protected admin and trip flows once test credentials or a seeded auth fixture are available.

### P1 — Customer experience QA

- Audit mobile layout and loading states for `/concierge`, `/mobility`, `/map`, `/beaches`, `/heritage`, `/book`, and `/login` on narrow viewport widths.
- Confirm empty, error, and slow-network states for API-backed experiences: concierge chat, beach details, mobility quotes, bookings, live map/search, and authentication.
- Capture screenshots for any visible UI changes and store before/after notes in the relevant PR.

### P2 — AI Concierge

- Verify concierge responses against local USVI travel knowledge for beaches, heritage, mobility, fishing, hotels, activities, and local businesses.
- Define persistent-memory requirements before implementation: user consent, retention policy, profile fields, trip context schema, and deletion/export behavior.
- Add regression prompts for recommendation quality and safety boundaries.

### P3 — Mobility

- Validate ride lifecycle transitions end-to-end: quote, request, match, driver en route, arrived, in progress, completed, cancelled, payment/refund states.
- Verify real-time driver location freshness, stale-state labeling, and dispatch attention thresholds in both rider and dispatcher views.
- Add operational QA for pilot gating, admin activation/deactivation, tariff governance, payment integrity, and settlement holds.

### P4 — Tourism and directory breadth

- Audit beach, heritage, fishing, activities, accommodations, and local business records for missing images, stale metadata, broken links, and weak descriptions.
- Prioritize pages with large first-load JavaScript or dynamic data dependencies for performance review.
- Add content validation scripts where datasets are already structured.

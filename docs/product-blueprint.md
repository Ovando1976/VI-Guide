# VI Explorer Product Blueprint (v1)

## Product Vision
**An AI-native island companion that helps travelers and locals discover, decide, move, plan, and coordinate everything about their Virgin Islands experience.**

## Core Pillars
1. **Discovery** — emotionally rich but decision-focused.
2. **Mobility Intelligence** — realistic island travel planning (estate + ferry + airport aware).
3. **AI Concierge** — context-rich assistant that recommends and acts.
4. **Plans & Collaboration** — chat-to-plan flows with persistent, shareable outputs.
5. **Merchant Intelligence** — operator tools for listings, messaging, and conversion.

## Sitemap (Consumer)
- `/` **Home (Command Center)**
  - Hero search
  - Smart actions (Build my day / Ask concierge / Plan mobility / Open plans)
  - Recommended rails
- `/explore` **Explore**
  - List + map
  - Island/category filters
  - Search and relevance
- `/mobility` **Mobility**
  - Point-to-point planning
  - Inter-island feasibility
  - Time realism
- `/concierge` **Concierge**
  - Context-aware assistant
  - Actionable outputs (save / route / plan)
- `/plans` **Plans**
  - Itineraries, checklists, and collaborative travel docs
- `/profile` **Profile**
  - Preferences, saved places, account state
- Supporting routes: `/events`, `/community`, detail overlays

## Role-based Operator Layer
- `/merchant` **Dashboard**
  - Inquiries
  - Listing performance
  - AI copy helper
  - Offer management (phase 2)

## Flagship Flows
### 1) Build My Day
1. User taps **Build my day**.
2. Concierge receives island + route + profile context.
3. AI outputs timeline + travel transitions + fallback options.
4. User saves to **Plans** and optionally shares.

### 2) Explore and Decide
1. User searches via hero or `/explore`.
2. Results blend beaches/places/events with map viability.
3. User opens listing, sees practical info + nearby options.
4. One-click actions: Ask concierge / Add to plan / Navigate.

### 3) Plan and Share
1. User creates or revises a plan document.
2. AI converts conversation into checklist + schedule.
3. User shares with group and iterates collaboratively.

## AI Context Contract (Target)
All concierge requests should eventually include:

```json
{
  "userMessage": "...",
  "selectedIsland": "st_thomas",
  "currentRoute": "/concierge",
  "selectedListing": null,
  "selectedEvent": null,
  "currentDocument": null,
  "savedPreferences": {},
  "nearbyContext": {},
  "travelMode": "rental_car",
  "timeOfDay": "afternoon"
}
```

## Data Model Priorities
Enrich places/beaches/events with:
- vibe, price expectation, best time of day
- best-for tags (families/couples/solo/groups)
- duration estimate and transfer friction
- accessibility, rain-friendly, ferry-friendly
- crowd and reservation guidance

## Implementation Roadmap
1. **Phase 1 (Now):** Home command center + Explore quality + Plans naming.
2. **Phase 2:** Context contract + Build my day system prompt/tooling.
3. **Phase 3:** Collaborative planning (share links, comments, revisions).
4. **Phase 4:** Merchant AI assistant and offer tooling.
5. **Phase 5:** Predictive ranking and real-time island intelligence.

## Shell and Folder Architecture (Current Baseline)

### App Shell Wiring
- `src/app/AppProviders.tsx` — provider root (router and future global providers).
- `src/app/AppRoutes.tsx` — route map and feature entry points.
- `src/app/ProtectedRoute.tsx` — auth gate for protected surfaces (Plans/Merchant).
- `src/hooks/useAppBootstrap.ts` — startup state orchestration (auth/profile/island bootstrap).
- `src/App.tsx` — orchestration + overlays (listing/event details) + route props.

### Feature-Oriented Folder Direction
Move gradually from component piles to domain modules:

```text
src/
  app/
    AppProviders.tsx
    AppRoutes.tsx
    ProtectedRoute.tsx
  hooks/
    useAppBootstrap.ts
  features/
    discovery/
    concierge/
    mobility/
    plans/
    community/
    merchant/
  lib/
    firestore/
    ai/
    prompts/
    constants/
```

This gives us clear ownership boundaries while keeping the current app stable.

## Spatial Intelligence Extension (Estates + Parcels)

The map stack now follows a three-tier model:
1. Island context
2. Estate browsing
3. Parcel precision overlays

### New domain modules
- `src/features/geography/types.ts` — canonical parcel/search types.
- `src/features/geography/lib/parcel-search.ts` — normalized parcel search utilities.
- `src/features/geography/lib/parcel-filters.ts` — island/estate parcel filtering.
- `src/features/geography/hooks/useParcelSearch.ts` — query/result state.
- `src/features/geography/hooks/useParcelSelection.ts` — selected parcel state.
- `src/features/geography/components/*` — parcel search, legend, and detail cards.
- `src/features/estates/components/estate-explorer-map.tsx` — estate-first map with parcel overlays.

### Initial data assets
- `src/data/usvi-parcels.index.json` — searchable parcel metadata index.
- `src/data/usvi-parcels.geojson` — lightweight parcel geometry sample.
- `generated/usvi-estates.json` — estate geometry source converted to map features at runtime.

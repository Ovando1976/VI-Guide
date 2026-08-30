# Island trusted generative UI

Island uses model-directed composition without model-owned business truth or authority.

## Runtime contract

1. The deterministic intelligence engine produces grounded recommendations, plan state, warnings, and governed actions.
2. Model refinement may return a structured `presentation` plan containing only registered component names, registered data sources, binding IDs, variants, and priorities.
3. `normalizeIslandPresentationPlan` validates component/source pairs, drops unknown components, rejects unknown bindings, restores mandatory safety surfaces, and always expands the governed action dock from server-issued actions.
4. `attachIslandUIEnvelope` resolves recommendation bindings from canonical travel/heritage data on the server. Names, descriptions, islands, hrefs, imagery, and provenance are application-owned.
5. The browser receives `islandUI = { presentation, bindings }`. The React registry maps only allow-listed components to native React components.

## Registered components

- `WorldCanvas`
- `MissionTimeline`
- `RecommendationDeck`
- `EvidenceStrip`
- `AgentActivity`
- `WarningPanel`
- `ConfirmationCard`
- `ActionDock`

There is no raw HTML, script, CSS, arbitrary component import, arbitrary URL, or model-defined event handler surface.

## Mandatory safety composition

The server injects these blocks even when the model omits them:

- `WorldCanvas` always.
- `MissionTimeline` when plan state or missing information exists.
- `RecommendationDeck` when grounded recommendations exist.
- `EvidenceStrip` when orchestration evidence exists.
- `AgentActivity` when bounded specialists were recruited.
- `WarningPanel` when warnings exist.
- `ConfirmationCard` when an action requires confirmation.
- `ActionDock` when server actions exist.

The model cannot mint action IDs. Action blocks are rebound to the exact server-issued action set.

## Image and data trust

Every rendered public travel binding has an image. A place-specific image is used only when it is local and has explicit verification or source evidence. Otherwise Island uses a local island-context image whose alt text clearly states that it is context imagery rather than a photo of the named record.

Canonical data bindings come from `lib/travel-knowledge.ts` or `lib/heritage/knowledge.ts`. The model never supplies place names, descriptions, coordinates, image URLs, source URLs, fare values, booking status, or payment state to React props.

The release contract walks all public travel knowledge records and verifies that each record resolves to a non-trivial local image or truthful context fallback.

## Synchronization

- `askViIntelligence()` remains the single client intelligence entry point.
- Existing intelligence memory and Living Map focus events continue unchanged.
- Island selection remains owned by `UnifiedWorkspaceProvider`.
- Mission and recommendation binding IDs remain stable across presentation re-composition.
- `save_plan` remains a server-issued confirmation action and is persisted through the canonical Journey Planner store only after the user confirms it.
- Existing map, mobility, booking, commerce, and specialist routes remain authoritative deep-link execution surfaces.

## Promotion rule

Do not replace the production homepage with `/island` until the exact PR head passes the full prebuild, focused generative-UI contract, Next.js compile/type validation, image coverage contract, and visual review on mobile and desktop.

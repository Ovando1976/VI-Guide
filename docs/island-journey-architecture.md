# Island Journey architecture

`lib/ferry-planner.ts` remains the governed ferry schedule source.

`lib/door-to-door-journey.ts` composes ground and ferry legs without copying schedule values. It produces traveler-facing leg metadata and context-preserving Mobility/Concierge links.

`components/door-to-door-journey-planner.tsx` renders the multimodal sequence and continuation actions.

`app/journey/page.tsx` is the dedicated connected-travel entry point, while `/ferry` embeds the same planner above the detailed ferry schedule.

The canonical traveler workspace remains `/trips`; `/planner` remains itinerary editing. This keeps the product's Planner/My Trip distinction intact.

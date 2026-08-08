# Island Journey release slice

This release introduces the first visible multimodal traveler experience on top of the governed Ferry Planner.

It intentionally reuses the Ferry Planner as the schedule source of truth and keeps the existing canonical `/trips` workspace. No second trip store or duplicate ferry schedule was introduced.

Visible traveler additions:

- `/journey` dedicated connected-travel route.
- Door-to-door journey panel on `/ferry`.
- Airport → Red Hook → Cruz Bay preset.
- Charlotte Amalie → Cruz Bay preset.
- Charlotte Amalie → Gallows Bay → Christiansted preset.
- Context-preserving Mobility handoffs for ground legs.
- Whole-journey Concierge handoff.
- Planner and My Trip continuation actions.

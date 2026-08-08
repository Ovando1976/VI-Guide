## Connected Island Journey

### Traveler value

Turns inter-island ferry travel into one understandable door-to-door sequence with ground-transfer handoffs before/after the crossing.

### Included

- `/journey` connected travel surface
- shared journey planner embedded on `/ferry`
- Airport → Red Hook → Cruz Bay
- Charlotte Amalie → Cruz Bay
- Charlotte Amalie → Gallows Bay → Christiansted
- Mobility, Concierge, Planner and My Trip continuation
- explicit schedule/check-in language without claiming real-time ferry availability

### Architecture

Reuses `lib/ferry-planner.ts` as the schedule source of truth and preserves `/trips` as the canonical My Trip workspace.

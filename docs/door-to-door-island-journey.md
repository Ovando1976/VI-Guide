# VI Guide Door-to-Door Island Journey

The Island Journey layer connects VI Guide's existing Ferry Planner, Mobility, Concierge, Planner and My Trip surfaces into one traveler-facing movement line.

## First governed corridors

- Cyril E. King Airport → Red Hook → Cruz Bay
- Charlotte Amalie → Cruz Bay
- Charlotte Amalie → Gallows Bay → Christiansted

## Experience contract

1. Ground-transfer legs hand off to `/mobility` with pickup and destination context.
2. Ferry legs reuse the governed schedule, check-in buffer, duration and source data from `lib/ferry-planner.ts` rather than duplicating schedule truth.
3. Concierge receives the complete journey context, including transfer coordination and check-in buffer.
4. Travelers can move directly to Planner or the canonical `/trips` My Trip workspace.
5. Ferry schedules remain planning guidance and retain the official verification source on the Ferry Planner.

## Next evolution

The next implementation layer should replace presets with arbitrary origin/destination selection, resolve the best terminal automatically, choose a departure based on desired arrival/departure time, calculate transfer buffers, and persist the generated multimodal legs as structured Journey Plan stops.

## What changed

VI Guide now presents the first three inter-island corridors as connected traveler journeys instead of isolated ferry legs.

- Cyril E. King Airport → Red Hook → Cruz Bay
- Charlotte Amalie → Cruz Bay
- Charlotte Amalie → Gallows Bay → Christiansted

The new `/journey` surface and the enhanced `/ferry` page show ordered ground/ferry/arrival legs. Ground legs hand off to Mobility with pickup/destination context; Concierge receives the whole journey; Planner and canonical `/trips` remain the continuation surfaces.

## Product integrity

The multimodal model reuses `lib/ferry-planner.ts` for published departures, duration and check-in guidance. It does not duplicate ferry truth or imply live availability.

## Next

After this slice is stable: arbitrary origin/destination, terminal resolution, depart-by/arrive-by selection, ground timing, structured Journey Plan persistence, Living Map and My Day continuity.

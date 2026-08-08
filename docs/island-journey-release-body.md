This release turns the governed Ferry Planner into the first connected multimodal Island Journey experience.

Travelers can plan Cyril E. King Airport → Red Hook → Cruz Bay, Charlotte Amalie → Cruz Bay, and Charlotte Amalie → Gallows Bay → Christiansted as ordered ground/ferry/arrival legs. Ground legs preserve context into Mobility; the whole journey preserves context into Concierge; Planner and canonical My Trip remain the continuation surfaces.

The implementation deliberately reuses the Ferry Planner's published schedule/check-in data and does not claim live ferry availability. A dedicated `/journey` route and the `/ferry` integration establish the UI foundation for arbitrary origin/destination and time-aware routing next.

# VI Guide Trip Planner Milestone

This package adds the first conversion-focused planning layer:

- New `/plan` trip-planning workspace
- Save places, beaches, and stays into one trip
- Organize saved stops by day and time of day
- Persistent local trip storage
- Concierge itinerary generation from saved stops
- Map handoff
- Updated primary navigation with a Plan tab
- Add-to-trip actions on directory and accommodation detail pages

## Apply

From the project root:

```bash
tar -xzf public/vi-guide-trip-planner-milestone.tar.gz -C .
rm -rf .next
npm install
npm run build
npm run dev
```

## Test

1. Open a place, beach, or stay detail page.
2. Tap **Add to trip**.
3. Open **Plan** in the bottom navigation.
4. Assign each stop to a day and time.
5. Tap **Build with Concierge**.

The production build compiled successfully and completed Next.js lint/type validation during packaging.

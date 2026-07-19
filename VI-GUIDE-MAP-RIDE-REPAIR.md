# VI Guide Map/Ride Repair

This targeted package repairs the shared Map to Ride experience without replacing unrelated project files.

## Included fixes

- Defaults direct Ride visits to St. Thomas instead of mixing all islands.
- Adds an explicit St. Thomas, St. John, and St. Croix selector to Ride.
- Keeps route-preview map bounds synchronized with the active island.
- Persists the active island and trip draft when moving between Map and Ride.
- Preserves island context when returning from Ride to Map.
- Makes route swapping atomic so endpoints cannot be accidentally cleared.
- Reduces route-map and form height on iPad and smaller screens.
- Adds bottom clearance for the fixed global navigation.

## Install

From the project root:

```bash
tar -xzf public/vi-guide-map-ride-perfect-repair.tar.gz -C .
rm -rf .next
npm run build
npm run dev
```

The archive contains only five source replacements plus this note. It does not contain dependencies, secrets, Firebase configuration, or generated build files.

## Acceptance checks

1. Open `/map`, select St. Thomas, and set two different estates.
2. Tap the global Ride tab. The Ride screen should remain on St. Thomas and restore both endpoints.
3. Return to Map. The island must remain St. Thomas.
4. Change Ride to St. Croix. The endpoints should clear and the preview should center on St. Croix.
5. Select two estates, use Swap route, and confirm both values exchange positions.
6. Test at iPad width and confirm the fixed navigation no longer covers the final content.

# VI Guide — Full Island Map Focus

This patch changes the Living Map so discovery opens at full-island scale instead of auto-focusing Kings Quarter.

## Included behavior

- Initial map view fits the selected island on first render.
- Discovery and arrival modes no longer auto-select a fallback estate.
- Selecting an estate still zooms into it deliberately.
- A **Full island** control clears estate/place focus and restores island bounds.
- Island switching restores full-island framing.
- Estate focus uses safer maximum zoom and UI-aware map padding.

## Apply

From the VI Guide project root:

```bash
tar -xzf archives/vi-guide-map-full-island-v1.tar.gz
rm -rf .next
npm run dev
```

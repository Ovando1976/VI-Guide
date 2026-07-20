# VI Guide Places Expansion

Copies a curated, territory-wide starter set of attractions, viewpoints, historic places, marinas, shopping districts, trails, parks, and visitor hubs into the existing local Places catalog.

## Install

Copy this folder into the project root, then run:

```bash
node vi-guide-usvi-places-expansion/merge-places-expansion.mjs
npx tsc --noEmit
rm -rf .next
npm run build
```

Existing local records win on conflicts, while tags are merged. The script does not touch Firestore.

Image paths are conventional placeholders under `/images/places/<slug>.jpg`. Your existing image fallback should handle missing files; otherwise point missing images to `/images/places/placeholder.svg` during the image audit.

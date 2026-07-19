# VI Guide Place Image Repair

Run from the project root:

```bash
node vi-guide-place-image-repair/repair-place-images.mjs
npx tsc --noEmit
rm -rf .next
npm run build
```

The script reuses strong matching assets already under `public/images`, creates polished category/island SVG fallbacks for the rest, updates `places.json`, fixes two catalog typos, and writes `reports/place-image-repair.json`.

# VI Guide Discovery Experience Upgrade

This upgrade adds:

- A true unified Explore page at `/places`
- Search across places, beaches, historic sites, and accommodations
- Island and content-type filters
- Featured destination cards
- Direct links to map, ride planning, and Concierge
- Richer homepage content using live local catalogs
- Cross-category recommendations on place and beach detail pages
- A primary Concierge navigation button

## Install from the project root

```bash
tar -xzf public/vi-guide-discovery-experience-upgrade.tar.gz -C .

rm -rf .next
npx tsc --noEmit
npm run build
npm run dev
```

## Inspect

- `/`
- `/places`
- `/places/mongoose-junction`
- `/places/cruzan-rum-distillery`
- `/beaches`
- Any place or beach detail page

The archive only replaces the five listed source files and adds one new component.

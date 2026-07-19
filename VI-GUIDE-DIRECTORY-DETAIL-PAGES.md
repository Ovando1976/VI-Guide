# VI Guide directory detail pages

This repair makes every Places and Beaches card open a full Firestore-backed detail page.

## Install

From the repository root:

```bash
tar -xzf public/vi-guide-directory-detail-pages.tar.gz -C .
rm -rf .next
npm run build
npm run dev
```

If the archive is in the repository root instead of `public`, remove `public/` from the first command.

## What changed

- Both routes resolve records by Firestore document ID **or** by the `slug` field.
- Beaches no longer depend on the small static `lib/beaches.ts` list.
- Real Google Place photos keep their required contributor attribution.
- Detail pages include overview, tags, amenities, best-for details, address, hours, phone, website, coordinates-based directions, nearby records, sharing, Map, and Ride actions.
- The layout adapts from phones through iPad and desktop, with a sticky territory panel on wide screens.

No seed operation or Firestore write is required.

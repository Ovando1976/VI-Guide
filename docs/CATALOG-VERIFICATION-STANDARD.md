# VI Guide catalog verification standard

The catalog is complete only when every in-scope restaurant, public beach, hotel, resort, villa, guesthouse, and campground has a unique record and the production gate reports no errors.

## Evidence order

1. Government or National Park Service page.
2. USVI Department of Tourism or territorial hotel association listing.
3. The business or property's official website.
4. A reputable secondary directory, marked as secondary and never used alone to claim current operating status.

Each record must retain `sourceUrl`, `sourceLabel`, `verifiedAt`, `verificationLevel`, and `operatingStatus`. Hours are displayed only with a dated source and should include an `hoursNote` telling travelers to reconfirm seasonal or holiday changes.

## Required production fields

- All records: stable id and slug, canonical name, island, category, useful description, accurate image, verification source and date.
- Restaurants and lodging: direct website or phone plus an address or coordinates.
- Beaches: coordinates, access notes, amenities, parking/accessibility notes where authoritative evidence exists.
- Images: locally controlled or from an approved provider, place-matched, attributed, and never a generic island substitute.

Run `npm run catalog:audit` during curation and `npm run catalog:gate` in release CI. The audit does not infer that a business is operating. Unknown and stale facts remain visibly unconfirmed until re-verified.

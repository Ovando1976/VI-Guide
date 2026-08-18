# USVI Estate Intelligence v0.1

This directory defines the first commercial data-product build for VI Guide's USVI geographic intelligence work.

## Goal

Produce a reproducible estate dataset from the repository's existing enriched estate corpus without treating raw public geometry as proprietary. The commercial value is the normalized identity model, aliases, historical cross-links, provenance, validation, and convenient CSV/GeoJSON packaging.

## Canonical inputs

The v0.1 builder reads:

- `data/derived/estates.enriched-with-dictionary.json` — modern estate geometry and identity enriched with Geographic Dictionary links.
- `data/derived/estates.dictionary-review-candidates.json` — unresolved or weak historical-name matches that must remain visible to human review.

The builder does not read the parcel layer and does not package parcel geometry.

## Build

From the repository root:

```bash
npx tsx data-products/usvi-geographic-intelligence/scripts/build.ts
```

Generated artifacts:

- `exports/csv/usvi-estates.csv`
- `exports/csv/audit-estates.csv`
- `exports/geojson/usvi-estates.geojson`
- `reports/estate-audit-summary.json`

## Audit statuses

- `MATCHED` — exact normalized modern/dictionary name match.
- `ALIAS` — historical/dictionary identity resolves through an alias or a single non-exact historical name.
- `DUPLICATE` — more than one modern estate shares the same island + normalized-name identity key.
- `MISSING` — no Geographic Dictionary match is attached to the modern estate.
- `CONFLICT` — multiple non-exact historical matches remain attached.
- `NEEDS_REVIEW` — the existing review-candidate file flags the estate for human confirmation.

## Release gate

v0.1 is not sale-ready while any of the following remain:

1. `DUPLICATE`, `CONFLICT`, or `NEEDS_REVIEW` rows.
2. Missing or out-of-bounds estate centroids.
3. Missing geometry.
4. Missing provenance/source arrays.
5. A source or field whose redistribution terms have not been documented.

`MISSING` dictionary enrichment is reported but is not automatically treated as a geometry/identity failure; a modern estate can still be a valid canonical record without a historical dictionary match.

## Geometry disclaimer

The sellable estate package must identify the geometry source and intended scale in the product metadata. Cartographic estate boundaries must never be marketed as parcel, survey, title, or cadastral boundaries.

## Product boundary

Parcel and tax-assessor geometry is intentionally excluded from v0.1 until its redistribution terms are separately reviewed and documented. This build is for estate-level geographic intelligence only.

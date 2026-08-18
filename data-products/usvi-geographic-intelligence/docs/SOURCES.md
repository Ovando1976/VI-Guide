# Sources and Provenance

## Repository source chain

Estate Intelligence v0.1 is built from VI Guide's existing derived estate pipeline rather than from the customer-facing `public/data` directory.

### Modern estate corpus

`data/derived/estates.enriched-with-dictionary.json`

This is the canonical build input for v0.1. It contains the modern estate identity/geometry records plus aliases, historical notes, source identifiers, and Geographic Dictionary matches produced by the repository's estate enrichment process.

### Historical name corpus

`data/derived/geographic-dictionary-estates.normalized.json`

Normalized historical estate names and aliases extracted from the Geographic Dictionary of the Virgin Islands. This file is supporting provenance and match context; v0.1 does not blindly promote every dictionary entry to a modern estate.

### Manual/review controls

`data/derived/geographic-dictionary-manual-links.json`

Manual links used by the existing enrichment process.

`data/derived/estates.dictionary-review-candidates.json`

Weak or unresolved match candidates. These are release-review inputs and are never silently converted to high-confidence canonical matches by the product builder.

### Firestore delivery derivative

`data/derived/estates.firestore-import.json`

Application delivery derivative. It preserves aliases, historical aliases/notes, sources, geometry, and core estate identity fields. The product build uses the enriched upstream file instead so commercial outputs do not depend on a database-import format.

## External-source rule

Every external geometry, government dataset, archival source, or manually researched field added to a commercial export must have documented provenance and redistribution status before release.

The v0.1 build intentionally excludes parcel/tax-assessor geometry. Parcel data may be used for verification or future products only after its applicable redistribution terms are reviewed and recorded.

## Commercial packaging rule

Public-source records remain public-source records. The paid value of this product is the normalization, cross-linking, aliases, historical enrichment, quality controls, versioning, documentation, and ready-to-use exports. Product copy must not imply ownership of underlying public-domain or government source geometry.

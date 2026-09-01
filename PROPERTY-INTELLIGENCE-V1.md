# USVI Property Intelligence v1

## Objective

Create one governed commercial data spine that can support:

1. Property Intelligence Pro for buyers, agents, architects, and investors.
2. Contractor / Developer Intelligence for estimating and due diligence.
3. The visitor-facing Island map without maintaining a second estate dataset.

## Canonical identity

Estate GEOID is the current canonical estate identity. Parcel identifiers must remain source-native and must not be synthesized. Every joined overlay must retain source provenance and an update timestamp.

## API

`GET /api/property-intelligence`

Optional query parameters:

- `island=stt|stj|stx`
- `q=<estate name, alias, or GEOID>`
- `limit=1..500`

## Overlay policy

Parcel, zoning, and historic-district enrichment is fail-closed. Until an authoritative layer has been spatially joined and validated, the API reports `not_joined` and returns no inferred values.

Do not convert proximity, text similarity, geocoding, or estate membership into an overlay match.

## Source order

Phase 1 uses the existing governed estate dataset at `data/derived/estates.enriched-with-dictionary.json`.

Phase 2 will add source-adapter snapshots for authoritative USVI parcel, zoning, and historic-district services. Raw source records should be preserved separately from normalized commercial records.

## Required fields for joined overlays

Every joined parcel / zoning / historic record must include:

- source record identifier;
- source URL or service identifier;
- source last-edited date when available;
- ingestion timestamp;
- spatial join method;
- join confidence / validation state;
- geometry or geometry reference;
- human-review state for conflicts.

## Commercial exports

The same canonical build should emit:

- CSV for spreadsheet customers;
- GeoJSON for GIS and web-map customers;
- KML for Google Earth workflows;
- a machine-readable manifest with schema version, source dates, record counts, and blocking audit findings.

## Next gate

The next implementation gate is not UI polish. It is authoritative parcel ingestion plus deterministic spatial joining against estates, followed by zoning and historic-district overlays. The release remains closed for any premium due-diligence SKU until those joins have auditable provenance.

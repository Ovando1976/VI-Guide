# VI Guide Data Cleanliness Report

Generated: 2026-07-02T11:37:10.687Z

## Summary

- Sources scanned: 3
- Records scanned: 485
- High severity issues: 1
- Medium severity issues: 0
- Low severity issues: 0

## Sources

| Source | Path | Records | Status |
|---|---:|---:|---|
| estates_geojson | public/geo/usvi-estates.geojson | 415 | OK |
| geographic_index | src/data/core/geographicIndex.ts | 0 | ERROR: Transform failed with 1 error:
/workspaces/VI-Guide/src/data/core/geographicIndex.ts:88515:13: ERROR: Expected ";" but found "or" |
| historic_sites | src/data/historicSites.ts | 70 | OK |

## Top Issue Groups

| Severity | Source | Issue | Count |
|---|---|---|---:|
| high | geographic_index | source_load_error | 1 |

## Sample Issues

| Severity | Source | Index | Name | Issue | Detail | Suggestion |
|---|---|---:|---|---|---|---|
| high | geographic_index | -1 |  | source_load_error | Transform failed with 1 error: /workspaces/VI-Guide/src/data/core/geographicIndex.ts:88515:13: ERROR: Expected ";" but found "or" | Open src/data/core/geographicIndex.ts and fix parse/import errors first. |

## Recommended Fix Order

1. Fix `coordinates_outside_usvi` first. These can break map fly-to and routing.
2. Fix `missing_name`, `name_too_short`, and `placeholder_or_fragment_name`.
3. Fix `missing_type` and `missing_island`.
4. Fix `missing_coordinates` for beaches, historic sites, estates, and civic places.
5. Fix missing local images after the records themselves are clean.

Run with parcels included when needed:

```bash
npx tsx scripts/audit-data-cleanliness.ts --include-parcels
```

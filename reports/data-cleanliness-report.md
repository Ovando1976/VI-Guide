# VI Guide Data Cleanliness Report

Generated: 2026-07-02T12:10:34.993Z

## Summary

- Sources scanned: 3
- Records scanned: 3311
- High severity issues: 0
- Medium severity issues: 749
- Low severity issues: 0

## Sources

| Source | Path | Records | Status |
|---|---:|---:|---|
| estates_geojson | public/geo/usvi-estates.geojson | 415 | OK |
| geographic_index | src/data/core/geographicIndex.ts | 2826 | OK |
| historic_sites | src/data/historicSites.ts | 70 | OK |

## Top Issue Groups

| Severity | Source | Issue | Count |
|---|---|---|---:|
| medium | geographic_index | missing_coordinates | 749 |

## Sample Issues

| Severity | Source | Index | Name | Issue | Detail | Suggestion |
|---|---|---:|---|---|---|---|
| medium | geographic_index | 34 | Arnesen | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 48 | Bandy Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 49 | Banson Plantation | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 51 | Baron Bluff | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 57 | Barrett Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 62 | Battery) | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 64 | Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 74 | Beaching Spit | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 75 | Beaucoeur Plantation | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 77 | Beck Grove | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 82 | Beffron Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 101 | Bethel Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 116 | Beverhoudt Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 118 | Beverhout Plantation | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 119 | Beverhout Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 120 | Beverhoutberg Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 124 | Billy French Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 127 | Black Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 131 | Blackrock Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 132 | Bladwell Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 133 | Blasbalg Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 138 | Big Flat Cay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 141 | Blue Mountain | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 147 | Boatman Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 163 | Bonne Esperance | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 173 | BoPcks Creek | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 189 | Borgenfri | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 190 | Borgenfrei | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 191 | Bosehill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 197 | Boufron Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 198 | Boulder Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 199 | Bourgen Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 213 | Brock Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 221 | Brown Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 224 | Bt | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 225 | Stalley Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 238 | Ruhuun Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 241 | Bull Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 246 | Bulowminde | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 250 | Buona Vista | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 251 | Buonavista | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 252 | Buonavista Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 256 | Buena Esperanza | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 258 | Butler Bay and William Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 261 | Butzberg Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 267 | Cabrita Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 268 | Cabrita Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 271 | Cabrite | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 272 | Cabrite Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 273 | Cabriteberg Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 275 | Cabrithorn Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 276 | Cabrito | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 277 | Cabrittaberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 279 | Casey Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 280 | Castle Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 281 | Cabritahorn Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 282 | Cabritaberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 289 | Caledonia Spring | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 296 | Calvert Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 297 | Calverts Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 302 | Camporico | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 303 | Camporico Raltpond | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 331 | Canegarden Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 334 | Cap de Cudejarre | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 336 | Capella Cays | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 337 | Caprzcorn Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 339 | Caramaw Hall | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 343 | Carden | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 344 | Carden Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 347 | Careen Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 359 | Carlota Antalia | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 361 | Carlton Gut | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 368 | Caroline Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 374 | Carton Dome | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 381 | Cassava Garden | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 383 | Cassi Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 386 | Castle Burke Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 387 | Castle Coakley | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 393 | Catarinaberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 396 | Catharina's Hope | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 399 | Catherine's Hope | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 405 | Cathriseberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 413 | CaZverts Punt | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 415 | Ceeeman HiZZ | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 416 | Centerline Road | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 423 | CfaUdri | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 424 | Cfoodchild | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 427 | Cfroen ICny | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 429 | Ch'rlstianeted' | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 437 | Chenay Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 438 | Chickenhawk Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 449 | Chrietiunsfort | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 459 | Christinn's Fort | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 461 | Chshnel Rock | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 469 | Circcs Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 472 | Claremont | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 473 | Clausen | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 474 | Clear Mount | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 475 | Clermont | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 501 | Compagnies Plantagie | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 503 | Compass Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 515 | Congo Cay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 517 | Congo Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 533 | Contentment Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 535 | Cook's Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 545 | Corn Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 550 | Corteri | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 551 | Cotcell Playstarcg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 552 | Coterado P d n t | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 560 | Cottongarden | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 562 | Cottongarden Peninsula | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 563 | Cottongarden Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 569 | Cow Rock | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 570 | Cowell Battery | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 573 | Cowell Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 576 | Crabhole Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 601 | Crumbuy | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 607 | Cuarentena | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 609 | Cudejarre P o i n t | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 611 | Cup d u Cudeiare | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |

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

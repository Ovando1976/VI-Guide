# VI Guide Data Cleanliness Report

Generated: 2026-07-02T09:23:30.226Z

## Summary

- Sources scanned: 3
- Records scanned: 3328
- High severity issues: 0
- Medium severity issues: 200
- Low severity issues: 122

## Sources

| Source | Path | Records | Status |
|---|---:|---:|---|
| estates_geojson | public/geo/usvi-estates.geojson | 420 | OK |
| geographic_index | src/data/core/geographicIndex.ts | 2838 | OK |
| historic_sites | src/data/historicSites.ts | 70 | OK |

## Top Issue Groups

| Severity | Source | Issue | Count |
|---|---|---|---:|
| medium | geographic_index | missing_coordinates | 200 |
| low | historic_sites | missing_local_image_file | 70 |
| low | geographic_index | missing_image | 47 |
| low | estates_geojson | duplicate_name_type_island | 5 |

## Sample Issues

| Severity | Source | Index | Name | Issue | Detail | Suggestion |
|---|---|---:|---|---|---|---|
| low | estates_geojson | 100 | Estate CONTANT 7B | duplicate_name_type_island | Duplicate of estates_geojson record index 99. | Confirm whether these are true duplicate records or whether one needs a more specific name. |
| low | estates_geojson | 232 | Estate CLAIRMONT | duplicate_name_type_island | Duplicate of estates_geojson record index 231. | Confirm whether these are true duplicate records or whether one needs a more specific name. |
| low | estates_geojson | 247 | Estate DIAMOND | duplicate_name_type_island | Duplicate of estates_geojson record index 246. | Confirm whether these are true duplicate records or whether one needs a more specific name. |
| low | estates_geojson | 248 | Estate DIAMOND | duplicate_name_type_island | Duplicate of estates_geojson record index 246. | Confirm whether these are true duplicate records or whether one needs a more specific name. |
| low | estates_geojson | 279 | Estate HOPE | duplicate_name_type_island | Duplicate of estates_geojson record index 278. | Confirm whether these are true duplicate records or whether one needs a more specific name. |
| medium | geographic_index | 9 | Allendale Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 18 | Anna's Hope Gut | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 26 | Annaberg, St. Croix | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 34 | Arnesen | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 48 | Bandy Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 49 | Banson Plantation | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 51 | Baron Bluff | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 56 | Barren Spot Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 57 | Barrett Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 62 | Battery) | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| low | geographic_index | 62 | Battery) | missing_image | Record type "historic" normally needs an image for the UI. | Add image, imageUrl, thumbnail, or heroImage. |
| medium | geographic_index | 64 | Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 74 | Beaehing Spit | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 75 | Beaucoeur Plantation | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 77 | Beck Grove | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 82 | Beffron Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 87 | Bellevue Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 88 | Belvedere Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 91 | Benner Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 92 | Benner Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 101 | Bethel Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 106 | Bethlehem Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 114 | Betty’s Hope Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 116 | Beverhoudt Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 120 | Beverhoutberg Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 122 | Big Diamond Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 124 | Billy French Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 127 | Black Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 131 | Blackrock Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 132 | Bladwell Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 138 | Blg Faat Cay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 141 | Blue Mountain | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 143 | Bluebeard’s Castle | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| low | geographic_index | 143 | Bluebeard’s Castle | missing_image | Record type "historic" normally needs an image for the UI. | Add image, imageUrl, thumbnail, or heroImage. |
| medium | geographic_index | 147 | Boatman Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 159 | Bolongo Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 162 | Bolongo Valley | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 163 | Bonne EspBrance | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 164 | Bonne EspBrance Road | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 169 | Bonne Esperance Estatehouse | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 173 | BoPcks Creek | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 178 | Bordeaux Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 180 | Bordeaux Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 183 | Bordeaux Mountains | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 185 | Bordeaux Roads | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 189 | Borgenfri | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 190 | Borpenfrei | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 191 | Bosehill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 194 | Botany Bay Road | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 197 | Boufron Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 198 | Boulder Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 199 | Bourgen Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| low | geographic_index | 209 | Brewers Bay | missing_image | Record type "beach" normally needs an image for the UI. | Add image, imageUrl, thumbnail, or heroImage. |
| medium | geographic_index | 210 | Brewers Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 213 | Brock Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 215 | Brook Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 217 | Brookhill Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 220 | Brown Bay Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 221 | Brown Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 224 | Bt | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 225 | BtaZley Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 234 | Buck Island Channel | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 242 | Bull Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 245 | Bulow'a-Minde | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 247 | Bulowminde | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 251 | Buona Viata | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 252 | Buonavista | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 253 | Buonavista Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 257 | Busna Eaperanza | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 259 | Butler Bay and William Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 262 | Butzberg Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 268 | Cabrita Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 269 | Cabrita Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 272 | Cabrite | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 273 | Cabrite Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 274 | Cabriteberg P o C t | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 276 | Cabrithorn Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 277 | Cabrito | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 278 | Cabrittaberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 281 | Caetelpolnt | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 282 | Cahritahorn Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 283 | CahrZtaberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 290 | Caledonia Spring | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 298 | Calverts Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 303 | Camporico | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 304 | Camporico Raltpond | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| low | geographic_index | 314 | Cane Bay | missing_image | Record type "beach" normally needs an image for the UI. | Add image, imageUrl, thumbnail, or heroImage. |
| medium | geographic_index | 315 | Cane Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 316 | Cane Bay Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 320 | Canebay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 322 | Canebay Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 327 | Caneelborn | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 328 | Canegarda Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 332 | Canegarden Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 335 | Cap de Cudejarre | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 337 | Capella Cays | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 338 | Caprzcorn Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 340 | Caramaw Hall | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 344 | Carden | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 345 | Carden Bay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 348 | Careen Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 355 | Carettbay | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 360 | Carlota Antalia | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 362 | Carlton Gut | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 367 | Carolina-Lyst | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 368 | Caroline | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 369 | Caroline Point | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 375 | Carton Dome | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 376 | Carty | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 382 | Cassava Garden | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 384 | Cassi Hill | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 387 | Castle Burke Estate | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 388 | Castle Coakley | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 394 | Catarinaberg | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |
| medium | geographic_index | 397 | Catharina's Hope | missing_coordinates | Location-like record has no lat/lng, coordinates, center, centroid, or geometry. | Add coordinates or attach a valid GeoJSON geometry. |

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

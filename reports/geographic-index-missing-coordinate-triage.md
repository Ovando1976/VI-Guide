# Geographic Index Missing Coordinate Triage

Generated: 2026-07-02T12:11:26.183Z

## Summary

- Candidate-audit missing coordinate records: 1112
- Triaged records: 1112
- Official data-cleanliness missing coordinates: 749
- Official sampled missing-coordinate issues: 200

## By bucket

| Bucket | Count |
|---|---:|
| research_clean_name_no_candidate | 891 |
| ocr_or_name_cleanup_first | 108 |
| review_candidate | 80 |
| generic_fragment_do_not_coordinate | 31 |
| low_priority_non_map_record | 2 |

## By confidence

| Confidence | Count |
|---|---:|
| none | 1019 |
| review | 49 |
| weak | 39 |
| exact | 5 |

## Best remaining review candidates

| Index | Name | Type | Island | Confidence | Candidate | Reason |
|---:|---|---|---|---|---|---|
| 188 | Bordeaux plantation | dictionaryEntry | st_thomas | exact | BORDEAUX | contains_clean_slug |
| 228 | Buck Bay | bay | st_thomas | exact | BUCK ISLAND | exact_clean_slug |
| 838 | Frederiksted Harbor | bay | st_croix | exact | Fort Frederik | similarity_or_token_overlap |
| 988 | Grove | historic | st_croix | exact | GROVE PLACE | contains_clean_slug |
| 1105 | Hope Point | estate | st_thomas | exact | HOPE | exact_clean_slug |
| 23 | Annaberg Plantation Records | archive_record | st_john | review | Anna Point | contains_clean_slug |
| 77 | Beck Grove | estate | st_croix | review | GROVE PLACE | contains_clean_slug |
| 124 | Billy French Point | point | st_thomas | review | French Bay | contains_clean_slug |
| 127 | Black Point | point | st_thomas | review | Blackbeard’s Castle | contains_clean_slug |
| 138 | Big Flat Cay | point | st_thomas | review | Flat Cay | contains_clean_slug |
| 141 | Blue Mountain | estate | st_croix | review | MOUNTAIN | contains_clean_slug |
| 163 | Bonne Esperance | estate | st_croix | review | BONNE ESPERANCE (NORTH) | contains_clean_slug |
| 280 | Castle Point | point | st_thomas | review | Blackbeard’s Castle | contains_clean_slug |
| 396 | Catharina's Hope | estate | st_croix | review | HOPE | contains_clean_slug |
| 399 | Catherine's Hope | estate | st_thomas | review | HOPE | contains_clean_slug |
| 435 | Charlotte Amalie High School | school | st_thomas | review | Charlotte Amalie | contains_clean_slug |
| 501 | Compagnies Plantagie | estate | st_thomas | review | THOMAS - SUGAR ESTATE | contains_clean_slug |
| 565 | Cottongrove Hill | hill | st_croix | review | GROVE PLACE | contains_clean_slug |
| 924 | Goodhope Bay | bay | st_croix | review | HOPE | contains_clean_slug |
| 1203 | Johiison Reef | hill | st_john | review | REEF BAY | contains_clean_slug |
| 1216 | Johnson Reef | bay | st_john | review | REEF BAY | contains_clean_slug |
| 1276 | Klein Bay | bay | st_john | review | Klein Cinnamon Road | contains_clean_slug |
| 1282 | Klein Reef | point | st_john | review | REEF BAY | contains_clean_slug |
| 1463 | Little Lameshur Bay | bay | st_john | review | Great Lameshur Bay | contains_clean_slug |
| 1533 | Lutheran church | estate | st_thomas | review | Frederick Lutheran Church | contains_clean_slug |
| 1705 | Nancy's Hope | estate | st_thomas | review | HOPE | contains_clean_slug |
| 1809 | Orangegrove | estate | st_croix | review | GROVE PLACE | contains_clean_slug |
| 1810 | Orangegrove Road | estate | st_croix | review | GROVE PLACE | contains_clean_slug |
| 1891 | Peter Beach | point | st_thomas | review | St. PETER | contains_clean_slug |
| 1926 | Pleasant Point | point | st_john | review | MT PLEASANT & RETREAT | contains_clean_slug |
| 2182 | Round Bay | bay | st_john | review | FREEMAN'S GROUND | contains_clean_slug |
| 2184 | Round Point | bay | st_thomas | review | HOSPITAL GROUND | contains_clean_slug |
| 2255 | Salt River Bay Historic and Archaeological Records | archive_record | st_croix | review | RIVER | contains_clean_slug |
| 2363 | Southgate Plain | estate | st_croix | review | South Bay | contains_clean_slug |
| 2368 | Southside Road | point | st_croix | review | South Bay | contains_clean_slug |
| 2370 | Southwest Anchorage | point | st_croix | review | South Bay | contains_clean_slug |
| 2372 | Southwest Shoal | point | st_croix | review | South Bay | contains_clean_slug |
| 2382 | Spring Bay | bay | st_croix | review | SPRING GARDEN | contains_clean_slug |
| 2435 | Sugar Bay | estate | st_thomas | review | THOMAS - SUGAR ESTATE | contains_clean_slug |
| 2447 | Susannabarg | estate | st_john | review | Anna Point | contains_clean_slug |
| 2495 | The Mountais | estate | st_croix | review | MOUNTAIN | similarity_or_token_overlap |
| 2512 | Thomas Harbor | bay | st_thomas | review | THOMAS | contains_clean_slug |
| 2513 | Thomas Hill | estate | st_croix | review | THOMAS | contains_clean_slug |
| 2605 | Valley | estate | st_croix | review | CANE VALLEY | contains_clean_slug |
| 2709 | White | estate | st_croix | review | WHITE LADY | contains_clean_slug |
| 82 | Beffron Hill | estate | st_croix | weak | BEESTON HILL | weak_similarity |
| 120 | Beverhoutberg Estate | estate | st_john | weak | BEVERHOUDTSBERG | similarity_or_token_overlap |
| 221 | Brown Estate | estate | st_thomas | weak | Crown Bay | weak_similarity |
| 261 | Butzberg Estate | estate | st_croix | weak | BOETZBERG | weak_similarity |
| 393 | Catarinaberg | estate | st_thomas | weak | CATHERINEBERG | weak_similarity |
| 405 | Cathriseberg | estate | st_john | weak | Catherineberg | similarity_or_token_overlap |
| 472 | Claremont | estate | st_croix | weak | CLAIRMONT | weak_similarity |
| 475 | Clermont | estate | st_croix | weak | CLAIRMONT | weak_similarity |
| 654 | Dolby Hill | hill | st_croix | weak | Lowry Hill | weak_similarity |
| 743 | Eniqhed Point | point | st_john | weak | ENIGHED | similarity_or_token_overlap |
| 803 | Flanagan Island | point | st_john | weak | FLANNIGAN ISLAND | weak_similarity |
| 1009 | Halkun Cay | island | st_thomas | weak | KALKUM CAY | weak_similarity |
| 1109 | Hornjag star | estate | st_croix | weak | MORNING STAR | weak_similarity |
| 1170 | Jack Bay | bay | st_croix | weak | JACKS BAY | weak_similarity |
| 1171 | Jack Bay Point | bay | st_croix | weak | JACKS BAY | weak_similarity |
| 1566 | Mandal | estate | st_thomas | weak | MANDAHL | similarity_or_token_overlap |
| 1567 | Mandal Bay | bay | st_thomas | weak | MANDAHL | similarity_or_token_overlap |
| 1568 | Mandal Point | bay | st_thomas | weak | MANDAHL | similarity_or_token_overlap |
| 1590 | Mars Hill | estate | st_thomas | weak | Maria Hill | weak_similarity |
| 1704 | Nancy Hill | hill | st_john | weak | Caneel Hill | weak_similarity |
| 1827 | Owrettbay | estate | st_thomas | weak | Carettbay | weak_similarity |
| 1918 | Pkaeant Vale | estate | st_croix | weak | PLEASANT VALE | weak_similarity |
| 1925 | Pleasant Hill | estate | st_croix | weak | PLEASANT VALE | weak_similarity |
| 1961 | Pollyberg | estate | st_thomas | weak | NULLYBERG | weak_similarity |
| 1962 | Pollyberg Road | estate | st_thomas | weak | NULLYBERG | weak_similarity |
| 2222 | Sabbat Hill | hill | st_thomas | weak | Maria Hill | weak_similarity |
| 2246 | Salba Cay | point | st_thomas | weak | SALT CAY | weak_similarity |
| 2273 | Sara Hill | bay | st_thomas | weak | Maria Hill | weak_similarity |
| 2461 | Tague Bay | bay | st_croix | weak | TEAGUE BAY | weak_similarity |
| 2474 | Tbatah Cay | island | st_thomas | weak | Thatch Cay | weak_similarity |
| 2504 | Thomaa | estate | st_thomas | weak | THOMAS | weak_similarity |
| 2560 | Turtledove Key | estate | st_thomas | weak | Turtledove Cay | similarity_or_token_overlap |
| 2636 | Waldberb Guard | estate | st_croix | weak | WALDBERGGAARD | weak_similarity |
| 2672 | Wells Bay | bay | st_croix | weak | WILL'S BAY | weak_similarity |
| 2759 | Xalkun Cay | island | st_thomas | weak | KALKUM CAY | weak_similarity |

## Clean high-value records with no candidate

| Index | Name | Type | Island |
|---:|---|---|---|
| 34 | Arnesen | estate | st_croix |
| 40 | Babil Bay | bay | st_croix |
| 41 | Backefall Bay | bay | st_thomas |
| 42 | Baker Bay | bay | st_thomas |
| 44 | Ballast Island | island | st_thomas |
| 45 | Banana Bay | bay | water_island |
| 46 | Banana Point | bay | water_island |
| 48 | Bandy Point | point | water_island |
| 49 | Banson Plantation | estate | st_croix |
| 50 | Barents Bay | bay | st_thomas |
| 51 | Baron Bluff | point | st_croix |
| 57 | Barrett Estate | estate | st_thomas |
| 58 | Base Hill | bay | st_john |
| 59 | Bass Gut | bay | st_john |
| 63 | Baudouins Gut | gut | st_croix |
| 72 | Scotch Reef | dictionaryEntry | st_thomas |
| 74 | Beaching Spit | point | st_john |
| 75 | Beaucoeur Plantation | estate | st_croix |
| 76 | Beauregard Bay | bay | st_croix |
| 79 | Red Hook Bay | bay | st_thomas |
| 80 | Bee Hill | hill | st_croix |
| 96 | Berg Hill | hill | st_thomas |
| 101 | Bethel Estate | estate | st_thomas |
| 116 | Beverhoudt Estate | estate | st_croix |
| 118 | Beverhout Plantation | estate | st_thomas |
| 119 | Beverhout Point | point | st_thomas |
| 123 | Billington Hill | hill | st_john |
| 128 | Blackbeard Hill | hill | st_thomas |
| 131 | Blackrock Hill | point | st_john |
| 132 | Bladwell Estate | estate | st_croix |
| 133 | Blasbalg Point | point | st_john |
| 142 | Bluebeard Hill | hill | st_thomas |
| 145 | Bluegut Bay | bay | st_croix |
| 147 | Boatman Point | point | st_john |
| 155 | Boken or Ruck Island | island | st_thomas |
| 189 | Borgenfri | estate | st_thomas |
| 190 | Borgenfrei | estate | st_thomas |
| 191 | Bosehill | estate | st_thomas |
| 197 | Boufron Point | point | st_thomas |
| 198 | Boulder Point | point | st_thomas |
| 199 | Bourgen Estate | estate | st_thomas |
| 208 | Breid Bay | bay | st_croix |
| 212 | Broad Bay | bay | st_croix |
| 213 | Brock Estate | estate | st_thomas |
| 214 | Brommer Hill | bay | st_thomas |
| 225 | Stalley Point | point | st_thomas |
| 238 | Ruhuun Point | point | st_john |
| 241 | Bull Point | point | st_thomas |
| 243 | Bulow Hill | hill | st_thomas |
| 246 | Bulowminde | estate | st_thomas |
| 250 | Buona Vista | estate | st_john |
| 251 | Buonavista | estate | st_john |
| 252 | Buonavista Hill | estate | st_john |
| 255 | Bush Hill | hill | st_croix |
| 256 | Buena Esperanza | estate | st_thomas |
| 258 | Butler Bay and William Estate | estate | st_thomas |
| 263 | Cabes Point | bay | st_thomas |
| 267 | Cabrita Hill | point | st_thomas |
| 268 | Cabrita Point | point | st_thomas |
| 271 | Cabrite | estate | st_thomas |
| 272 | Cabrite Point | point | st_thomas |
| 273 | Cabriteberg Point | point | st_thomas |
| 275 | Cabrithorn Point | point | st_john |
| 276 | Cabrito | point | st_croix |
| 277 | Cabrittaberg | estate | st_thomas |
| 279 | Casey Point | point | st_john |
| 281 | Cabritahorn Point | point | st_john |
| 282 | Cabritaberg | estate | st_thomas |
| 289 | Caledonia Spring | estate | st_thomas |
| 295 | Calvary Bay | bay | st_john |
| 296 | Calvert Point | point | st_thomas |
| 297 | Calverts Point | point | st_thomas |
| 300 | Camp Bay | bay | st_thomas |
| 301 | Camp House Bay | bay | st_croix |
| 302 | Camporico | estate | st_croix |
| 331 | Canegarden Hill | estate | st_thomas |
| 334 | Cap de Cudejarre | point | st_john |
| 335 | Capella Bay | bay | st_thomas |
| 336 | Capella Cays | point | st_thomas |
| 337 | Caprzcorn Point | point | st_thomas |
| 339 | Caramaw Hall | estate | st_croix |
| 343 | Carden | estate | st_croix |
| 344 | Carden Bay | estate | st_croix |
| 347 | Careen Point | point | st_john |
| 359 | Carlota Antalia | estate | st_thomas |
| 361 | Carlton Gut | estate | st_john |
| 362 | Carol Point | bay | st_thomas |
| 368 | Caroline Point | point | water_island |
| 372 | Carrot Bay | bay | st_thomas |
| 373 | Carsmaw Bay | bay | st_croix |
| 374 | Carton Dome | estate | st_thomas |
| 380 | Casper Bosch Bay | bay | st_thomas |
| 381 | Cassava Garden | estate | st_thomas |
| 383 | Cassi Hill | point | st_thomas |
| 386 | Castle Burke Estate | estate | st_croix |
| 387 | Castle Coakley | estate | st_thomas |
| 394 | Cateen Hill | hill | st_thomas |
| 409 | Cay Bay | bay | st_thomas |
| 416 | Centerline Road | point | st_croix |
| 424 | Cfoodchild | estate | st_croix |
| 427 | Cfroen ICny | estate | st_thomas |
| 429 | Ch'rlstianeted' | estate | st_thomas |
| 437 | Chenay Bay | estate | st_croix |
| 438 | Chickenhawk Point | point | st_thomas |
| 447 | Chrietiane Fort og Bye | bay | st_john |
| 449 | Chrietiunsfort | historic | st_thomas |
| 453 | Christians Bay | bay | st_john |
| 469 | Circcs Point | point | st_croix |
| 471 | Clairmont Hill | hill | st_thomas |
| 473 | Clausen | estate | st_thomas |
| 474 | Clear Mount | estate | st_croix |
| 479 | Clindinen Hill | bay | st_croix |
| 487 | Cockroach Cay | island | st_thomas |
| 488 | Cocogluln Bay | bay | st_croix |
| 489 | Cocoloba Cay | bay | st_thomas |
| 497 | Cold Bay | bay | st_thomas |
| 503 | Compass Point | point | st_thomas |
| 515 | Congo Cay | point | st_thomas |
| 517 | Congo Point | point | st_thomas |
| 533 | Contentment Hill | estate | st_thomas |

## OCR/name cleanup first

| Index | Name | Type | Island |
|---:|---|---|---|
| 94 | Benny Kenny Hill | bay | st_croix |
| 173 | BoPcks Creek | estate | st_thomas |
| 303 | Camporico Raltpond | estate | st_croix |
| 413 | CaZverts Punt | point | st_thomas |
| 415 | Ceeeman HiZZ | estate | st_thomas |
| 423 | CfaUdri | point | st_croix |
| 459 | Christinn's Fort | historic | st_thomas |
| 461 | Chshnel Rock | point | st_thomas |
| 552 | Coterado P d n t | point | st_thomas |
| 553 | CotfosVdl8y Bay | bay | st_thomas |
| 568 | COW Point | bay | st_thomas |
| 609 | Cudejarre P o i n t | point | st_john |
| 653 | Doill/ IIiZl | estate | st_croix |
| 655 | Dolly Efl1 | estate | st_john |
| 675 | Dry Lcdqc | point | st_croix |
| 735 | EnAeld Green | estate | st_thomas |
| 775 | Fanny's Fancy | estate | st_croix |
| 812 | Fort -1 iiytcuto | historic | st_croix |
| 869 | French Hill | bay | st_thomas |
| 878 | Fron8kmandeBayen | estate | st_thomas |
| 886 | Funta Colorado 6 Longue | point | st_thomas |
| 888 | Gabriel P o i n t | point | st_thomas |
| 898 | George I I i l l | estate | st_croix |
| 921 | Good A o p e | estate | st_thomas |
| 922 | Good I l o p c | estate | st_thomas |
| 936 | Grand Priwes8 | estate | st_croix |
| 950 | Grcen C a g Point | point | st_thomas |
| 1035 | Hard Ln7)our | estate | st_croix |
| 1053 | Haunt WfLshlngtbn | estate | st_croix |
| 1071 | Hglgcnsborg | estate | st_croix |
| 1075 | Hndracht | estate | st_croix |
| 1114 | Hpgens Borg | estate | st_croix |
| 1132 | ICovaZrev | estate | st_croix |
| 1154 | IohrLx Rest | estate | st_croix |
| 1168 | IWdrichrrdnl | estate | st_john |
| 1238 | Kalk8teen Bay | bay | st_thomas |
| 1264 | King's Wharf | historic | st_thomas |
| 1274 | KjjQrstaarn | point | st_john |
| 1299 | Kolzgmzs Land | estate | st_thomas |
| 1318 | Kru2/thuya | historic | st_thomas |
| 1324 | KtikeZu | point | st_thomas |
| 1347 | La RatEa del Sudoeste | estate | st_thomas |
| 1353 | Lagoon B a n k | historic | st_croix |
| 1362 | Lamb6 Bay | bay | st_croix |
| 1391 | LebRnon Gut | gut | st_croix |
| 1410 | LetaZone | estate | st_croix |
| 1467 | Little N o r g e | estate | st_thomas |
| 1489 | LiZZe Kalzel Bay | bay | st_john |
| 1497 | Long P o h t | point | st_john |
| 1516 | Love G u t | estate | st_croix |
| 1527 | Lumrnert8 punt | point | st_thomas |
| 1571 | Manila1 Bay | bay | st_john |
| 1707 | Nanny Pynt | point | st_thomas |
| 1712 | NathanZet Bay | bay | st_john |
| 1743 | Noorddztfde B a d | estate | st_thomas |
| 1744 | Nord 8lde V e y | point | st_thomas |
| 1749 | NortAglrle Bay | bay | st_thomas |
| 1755 | North Si& | estate | st_croix |
| 1760 | NOrth8ide Point | point | st_thomas |
| 1777 | NuZatle Bay | bay | st_john |
| 1784 | Nzrmber-Fwr H a l | estate | st_croix |
| 1820 | Ost-en&e-Pmt | point | st_thomas |
| 1870 | Pct4r Canucbdg | estate | st_croix |
| 1889 | Pet& Bay | bay | st_john |
| 1897 | Peters F a d | estate | st_thomas |
| 1912 | Piedra8 Sueltrcs | point | st_thomas |
| 1937 | Plzcnte Bay | bay | st_croix |
| 1956 | Points de Z'E8t | point | st_thomas |
| 2005 | PrNnte E'apagaoZe | point | st_croix |
| 2030 | Pstspidson | point | st_thomas |
| 2050 | Qanee H i l l | estate | st_john |
| 2095 | RcattrLyo de la l'uunta Rota | point | st_thomas |
| 2145 | Rividre f3ulSe | point | st_thomas |
| 2201 | Ruhuun K a y | point | st_john |
| 2215 | Ryks DUV(dSe8 punt | point | st_thomas |
| 2216 | RzltherJwd | historic | st_croix |
| 2218 | S-8 Bay | estate | st_thomas |
| 2277 | Savana Eill | point | st_thomas |
| 2333 | Smithfleld | estate | st_croix |
| 2334 | Smiths Punt | point | st_thomas |
| 2335 | Sndth'8 Bay Point | bay | st_thomas |
| 2366 | Southside k a b | point | st_thomas |
| 2391 | Springgut Notch | estate | st_thomas |
| 2425 | Stragglers | estate | st_thomas |
| 2426 | Strawberry | estate | st_croix |
| 2450 | Suttpcslane Bdy | estate | st_thomas |
| 2455 | Sydvest Pvnt | point | st_croix |
| 2473 | TaZZard Bay | estate | st_thomas |
| 2488 | Thatch Hill | estate | st_thomas |
| 2498 | The Sou& | estate | st_thomas |
| 2500 | The W4lliarn | estate | st_croix |
| 2501 | The WiWam D a h | estate | st_croix |
| 2503 | Thoma8 Runs Bay | bay | st_thomas |
| 2546 | Tu& Bay | bay | st_thomas |
| 2588 | Upper L o n | estate | st_thomas |
| 2594 | Urtrs I'llnt | point | st_croix |
| 2630 | Vvndpunt | point | st_thomas |
| 2634 | Waiter'8 Point | point | st_croix |
| 2638 | Wan0 Point | bay | st_thomas |
| 2650 | Water Qmuc2 | estate | st_thomas |
| 2659 | WaterpEaata Bay | bay | st_thomas |
| 2687 | Westend and Lfttle Nnrtbddrct Quaptera | estate | st_thomas |
| 2693 | Wetter8 Point | point | st_croix |
| 2781 | XRV Point | bay | st_john |
| 2786 | Ya&bcatterle | historic | st_croix |
| 2791 | Yar&u'8 H i l l | estate | st_thomas |
| 2797 | Yellvwcliff Bay | bay | st_croix |
| 2800 | Yohlexfels P o W | point | st_thomas |

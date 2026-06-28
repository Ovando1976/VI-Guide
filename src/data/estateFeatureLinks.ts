export type EstateFeatureLink = {
  estateGeoid: string;
  estateName: string;
  island: string;
  quarter: string | null;
  quarterGroup: string | null;
  features: Array<{
    entryId: string;
    name: string;
    type: string;
    island: string | null;
    quarter: string | null;
    confidence: number;
    reasons: string[];
    description: string;
  }>;
};

export function getEstateFeatureLinkByGeoid(geoid: string) {
  return estateFeatureLinks.find((link) => String(link.estateGeoid) === String(geoid)) ?? null;
}

export function getEstateFeaturesByGeoid(geoid: string) {
  return getEstateFeatureLinkByGeoid(geoid)?.features ?? [];
}

export const estateFeatureLinks = [
  {
    "estateGeoid": "1989",
    "estateName": "ABRAHAMS FANCY / MAHO BAY",
    "island": "stj",
    "quarter": "3A MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": [
      {
        "entryId": "maho-bay",
        "name": "Maho Bay",
        "type": "bay",
        "island": null,
        "quarter": "MAHO BAY",
        "confidence": 110,
        "reasons": [
          "estate name contains entry name",
          "quarter agreement"
        ],
        "description": "Maho Bay; 530 yards wide, commodious, sheltered, affording anchorage for small craft, between Maho Polnt, south of Francis Bay, and America Point, east of Cfnnamon B a y; with fine sand beach 590 yards long, fringed with coco palms, and running out shoal, affording excellent surf bathing; north shore of St. . John. -Hiist: Oldendorp, p. 46 Variants: Mahn, Mahoe, Mahol, Mahoot, Mahot, Mohoe, etc. ; also called Lille-Maho or"
      }
    ]
  },
  {
    "estateGeoid": "1891",
    "estateName": "ADRIAN",
    "island": "stj",
    "quarter": "18 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1982",
    "estateName": "ANNABERG",
    "island": "stj",
    "quarter": "4-1, 1 MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": [
      {
        "entryId": "annaberg",
        "name": "Annaberg",
        "type": "estate",
        "island": "stx",
        "quarter": "KING",
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Annaberg; Estate, King Quarter, St. Croix, occupying south % of trtlct 28, and south ?. !! of east VZ of 27 (i. e. , 27h) : % mlle northwest of Krause Lagonn. Two hills of over 100 feet elevation rim on Estate; the higher, Annnherg Hill, 117 feet. I'ropcrty of \" Ohrist. rrleut. Krause '' (1754), who also owned Carsmuw Hall, Krause Lagoon, and Krause Peninsula. Attached to Angui1la. -BcorpCon."
      },
      {
        "entryId": "sueannaberg-road",
        "name": "Sueannaberg Road",
        "type": "bay",
        "island": "stj",
        "quarter": "NORTHSIDE",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Sueannaberg Road; Rocky trail, of tedious grade, extending from Northside Road, near Denis Bay, 9/a mile south-southeast to Centerline Road at Susannaberg E a t e, St. John. -T. 3712, 3779."
      },
      {
        "entryId": "susannaberg",
        "name": "Susannaberg",
        "type": "estate",
        "island": "stj",
        "quarter": "CRUZ BAY",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Susannaberg; Hill, 702 feet high, just north of Estate to which the Hill gives its nwne, Cruz Bay Quarter, St. John."
      },
      {
        "entryId": "annaberg-point",
        "name": "Annaberg Point",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Annaberg Point; Curving bluff, rising to %-foot knoll, 350 yards northeast of Annaberg Mill, on northern shore of St. Zoha I s l a n d. 4. P. See Masonic Point and Drim Bay. Several authors associate this spot with a tragic legend, disputed by Westergaard; which recounts that, after the slave revolt of 173. 7 and massacre of the whit@ population, the blacks held possession for six months, but were hunted through the forest, and the 300 survivors were here rounded up in 1734 by 400 French troops from Martinique. After a feast, the slaves shot one another, destroyed their guns, and the remnant in despair leaped off this hluff."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BELLEVUE",
    "island": "stj",
    "quarter": "12A CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "bellevue",
        "name": "Bellevue",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Bellevue; Estatehouse and landing, nenr bench of cove 1. 10 yards wide, on e a s t shore of St. Thomas Harbor, opposite Rupert liock, and 330 yards northnorthwest of Bellevue or Lisenlund IIill. -Lawranc~."
      }
    ]
  },
  {
    "estateGeoid": "1952",
    "estateName": "BEN RUNNELL'S GUT",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "-1",
    "estateName": "BETHANY",
    "island": "stj",
    "quarter": "6 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "bethania-or-bethany",
        "name": "Bethania or Bethany",
        "type": "bay",
        "island": "stj",
        "quarter": "CRUZ BAY",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bethania or Bethany; Moravlan mission church and school, 8/a mile due east of Cruz Bay, St. John. One of the two Moravian missionary centers on St."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BEVERHOUDTSBERG",
    "island": "stj",
    "quarter": "7 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1978",
    "estateName": "BORDEAUX",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "bordeaux",
        "name": "Bordeaux",
        "type": "estate",
        "island": null,
        "quarter": "CORAL BAY",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Bordeaux; Estate on crest of Bordeaux Mountains, W mile west of Coral Bay, 1 % miles north of Lameshur Ray, St. . John. Vnrious cartographem indicate buildings about 1, 242, 1, 125 and 1, 220 feet summits. Test-drill found strong magnesium water. Spelled less correctly, Bordeau, Bowdeaux."
      },
      {
        "entryId": "bordeaux-mountains",
        "name": "Bordeaux Mountains",
        "type": "estate",
        "island": "stj",
        "quarter": "CORAL BAY",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bordeaux Mountains; Ridge extending from Mamey Peak, southeast to beyond Bordeaux Mountain, thence northeast to Bordeaux Estate-village, thence southeast again to col toward Minaa Hill; total length about 3 miles, forming west watershed of Coral Bay, St. John. Bay trees grow wild. Called by Spanish, '' Montafias de Burdeos; \" Danish, \" Bordeaux Bakke. \""
      },
      {
        "entryId": "bordeaux-mountain",
        "name": "Bordeaux Mountain",
        "type": "hill",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bordeaux Mountain; 1, 277feet high, summit of St. John Island: lat. 18\" 20' IO\", long. 64\" 43' 46\"."
      },
      {
        "entryId": "bordeaux-roads",
        "name": "Bordeaux Roads",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bordeaux Roads; Highways over Bordeaux Mountain section of St. John. North Bordeaux Road ascends from Coral Harbor southwest to crest of ridge; South Eordeaux Road descends thence south to Lameshur Estate; West or Ridge Bordeaux Road strikes northwest from common intersection, and follows crest of divide to blarney Garden, where it joins Centerline Road. Grade easy, with many level stretches; good trail, though not well maintained. -G. B. Borgem, Islita; Spanish name of Leduck Cay, St. John. Referred to in the Derrotero a s \" L a Islita Borgem, \" \"Islti Duck 6 Buck 6 Borgem. \""
      },
      {
        "entryId": "bordeaux-hill",
        "name": "Bordeaux Hill",
        "type": "quarter",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Bordeaux Hill; Summit 6% feet, east shoulder 668 feet, 1 mile east-northeast from West Point, 1, 870 yards from Bordeaux Point; Westend Quarter, St."
      }
    ]
  },
  {
    "estateGeoid": "1990",
    "estateName": "BROWNS BAY",
    "island": "stj",
    "quarter": "MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": []
  },
  {
    "estateGeoid": "1649",
    "estateName": "BUCK ISLAND",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "buck-island",
        "name": "Buck Island",
        "type": "point",
        "island": "stt",
        "quarter": "WEST END",
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Buck Island; 110 feet high, YJ mile long, area 41. 55 acres; western and larger of Capella Cays, 2 miles south of St. Thomas Island. Light on white, square tower, 136 feet above low water; lat. 18\" 16' 48\", long. 64\" 53' 35\". Summit called by Bellin, I' Montagne Rouge \" (Rouge or Red Hill); Cove at west end, \" Mouillage pour les Barques \" (landing for the Boats, Mouillage Cove). The Spanish Derrotero describes the island a s partially covered by Matorral \" (heath); and mentions the '' Restinga \" (ledge) extending 100 yards off west point. Hest derives the island's name from its having been tenanted only by a few very wild \"Gedebukker\" (Buckgoats); whence, Dutch \" Boken \" or '' Bokken Eyland. \" Easterly companion island, severed by 60-yard passage, loosely regarded as portion of"
      }
    ]
  },
  {
    "estateGeoid": "2018",
    "estateName": "CALABASH BOOM",
    "island": "stj",
    "quarter": "9 & 10 CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1893",
    "estateName": "CANEEL BAY",
    "island": "stj",
    "quarter": "8 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "caneel-bay",
        "name": "Caneel Bay",
        "type": "bay",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Caneel Bay; Cinnamon Bay, St. John. -Oxholm. Spelled \" Caneelbay, \" by"
      }
    ]
  },
  {
    "estateGeoid": "2009",
    "estateName": "CAROLINA",
    "island": "stj",
    "quarter": "1 CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "carolina",
        "name": "Carolina",
        "type": "estate",
        "island": "stj",
        "quarter": "CORAL BAY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Carolina; Estate on 181-foot hill, % mile northwest of Coral Harbor, in Coral Bay Quarter, St. John. Prosperous; having a stock farm with hundreds of cattle, a banana patch, a '' big bay-oil manufactory, \" with a bay-oil still. As early as 1780 the Carolina-Slette (Plain) toward Coral Harbor was ''Reservert Bygrund \" (Reserved city ground). Name sometimes spelled '' Caroline. \""
      },
      {
        "entryId": "carolina-m-a-d",
        "name": "Carolina m a d",
        "type": "unknown",
        "island": "stj",
        "quarter": "KING",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Carolina m a d; Wide straight lane, from head of Coral Harbor 1, 070 yards on easy grade (used as racecourse) to foot of hill; thence winds up to crest of King Hill and joins Maho Road, St. John. -T. 3772 and D. R."
      },
      {
        "entryId": "carolina-lyst",
        "name": "Carolina-Lyst",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Carolina-Lyst; Pavilion formerly on summit of 1254'oot hill (90 yards east ai shore) at Caroline Point, Water Island. --Rohd& I' Caroline Lyst \" on Lawrence's chart (1851). 2aroUna Plain; Wide level valley, west of north end of Coral Harbor, St. John. Irrigated by a rainy-season watercourse. Occupied in part by Carolina Estate. Danish equivalent, \" Karolinaslette\""
      }
    ]
  },
  {
    "estateGeoid": "1818",
    "estateName": "CAVAL CAY",
    "island": "stj",
    "quarter": "GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2004",
    "estateName": "CHOCOLATE HOLE",
    "island": "stj",
    "quarter": "11 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "chocolate-hole",
        "name": "Chocolate Hole",
        "type": "point",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Chocolate Hole; Deep cove in southwest coast, west of Buhvun Point, St. John. Also spelled, ('Chokolathohl, \" \" Chocolade Hull. \""
      }
    ]
  },
  {
    "estateGeoid": "1642",
    "estateName": "CINNAMON CAY",
    "island": "stj",
    "quarter": "2 MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": [
      {
        "entryId": "cinnamon-cay",
        "name": "Cinnamon Cay",
        "type": "bay",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Cinnamon Cay; Islet, 32 feet high, 150 pards long, area 1. 03 acres, covered with tall grass and cactus, 230 yards from bench at Clnnamon Bay, north shore of St. John. -T. 8772 D. R. Geographic Position, 18\" 21' 30. 14\" (927 m. ), 64\" 45' 24. 58\" (722 m. )."
      }
    ]
  },
  {
    "estateGeoid": "1625",
    "estateName": "CONCORDIA A",
    "island": "stj",
    "quarter": "15A CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1627",
    "estateName": "CONCORDIA B",
    "island": "stj",
    "quarter": "15A CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "concordia-bay",
        "name": "Concordia Bay",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Concordia Bay; 700 yards across entrance, average width 360 yards, oblique length 600 to 700 yards, with anchorage; flne sand beach at head; east of Riddle Point, on southeast shore of St. John Island, % mile northwest of Ram Head, behind Booby Rock. Concordia Estate situated just north, whence name. Saltbearing pond on east; hence, also called Saltpond or Zoutpan Bay. -G. B. Nov. 7, 1923."
      }
    ]
  },
  {
    "estateGeoid": "1817",
    "estateName": "CONGO CAY",
    "island": "stj",
    "quarter": "GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "congo-cay",
        "name": "Congo Cay",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Congo Cay; Lanceolate or shuttle-shaped island, 170 feet hiah, 1, 240 yards long, 160 yards wide, area 25. 46 acres; 260 yards north of Lovango Cay. On eighteenth century charts, called \"Cam Island; \" by Oxholm, '' Kukelusse Kay '' (variants, Kukkelusse, Cucculus, Coculus); in the Derrotero, \" E l Cay0 Congo 6 Lovango Chico, \" or simply \"Lovango Chico. \" The eastern extremity is called on the Bcorpbn survey, Indian Inscription Point. \""
      }
    ]
  },
  {
    "estateGeoid": "1871",
    "estateName": "CONTANT",
    "island": "stj",
    "quarter": "2 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "contant",
        "name": "Contant",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Contant; Estate with stone mill on ridge, 1, oM) yards northwest of Gregerie Bay, St. Thomas; latitude 18\" 20' 1, 405 m. , long. 64\" 57' 685 m, Erroneously, Constant."
      },
      {
        "entryId": "contant-hill",
        "name": "Contant Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Contant Hill; 334 feet high, let. 18\" 19' 32. 74\" (1, 007 m. ), long. 84\" 47' 87. 63\" (1, 102 m. ), 1/9 mile southeast of Contant Estate, % mile north of Contant Point. G. P. , \" F l a g f@. \""
      }
    ]
  },
  {
    "estateGeoid": "1894",
    "estateName": "CRUZ BAY TOWN",
    "island": "stj",
    "quarter": "1 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "cruz-bay",
        "name": "Cruz Bay",
        "type": "bay",
        "island": "stj",
        "quarter": "CRUZ BAY",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Cruz Bay; Village, Post Office, and Capital of St. John Island; sittinted on sooth shore of' ('ruz 1 h. y a t westerii end of Island. 'l'lie Govcrnnieirt station is a while builtliiig culled \" t h e Fort \" (Old C~lirlstiti~isfort o r E'urt -- 66 of 215 GEOGRAPHIC DICTIONARY OF THE VIRGIN ISLANDS 63 Christian) on Battery Point which projects 190 yards from the south shore and divides the hay into Christian Cove on the enst, and G:ilg(! Co\\e on the south. The village, the largest on the Island, in 1917 hnd R population of 50 persons. It extends back from the lienc, lrtw of bolh Coves. An excellent road, called by Oxholm, Nye Kouge-Vey, now ('enterline Road, leads across the northern portion of the Island to Corn1 Jhy. h':inied I)g Oaliolui, C'hristianshye; present name spelled hy K i i o ~, Crcwse"
      }
    ]
  },
  {
    "estateGeoid": "1914",
    "estateName": "DENNIS BAY/ HAWKNEST",
    "island": "stj",
    "quarter": "17B CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1964",
    "estateName": "EDEN",
    "island": "stj",
    "quarter": "18B CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1966",
    "estateName": "EMMAUS",
    "island": "stj",
    "quarter": "2 CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "emmaus",
        "name": "Emmaus",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Emmaus; Moravian mission compound and school, established 1783, damaged by hurricane 1916, conspicuously situated near north end of Coral Harbor, See ' I Moravfan M i m i o n s. \" 4. P. ; Reichel; Dewitz; %. ; De Boog L Faris, mnp, p. 135. D. R. 'I!. 3772, photographs. Bible name, misspelled, Emmius and Emaus p. 73. -- 75 of 215 72 U. S. COAST AND GEODETIC SUITVEY"
      }
    ]
  },
  {
    "estateGeoid": "2003",
    "estateName": "ENIGHED",
    "island": "stj",
    "quarter": "1 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "enighed",
        "name": "Enighed",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Enighed; l'lantation, east of south cove of Mag~nw Bag; St. Thomas. C. & (;. S. field party (3918) saw a \" c o ~ i l, ' 'or '' cluster o$ p:ilins, \" Init no buildinqs. Dnnish name, meaning '' Concwrd, harmony, union, agreement, \" also spelled ICcnigiic~d; Ihitth, ICenigheid, ( Singleness, loneliness); German, ICinigkeit, (Unjty); finigheit, a hyhrirl form."
      },
      {
        "entryId": "enighed-pond",
        "name": "Enighed Pond",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Enighed Pond; I, tifioon, 500 yard3 long, just east of Turner Bay t ~ t w l i, north of Constant Hili, southwest of Enighed Estate, St. John. Spelled \" Ihigtited \" on T. 3779. Sometimes called simply \" f+:nAcitl. \""
      }
    ]
  },
  {
    "estateGeoid": "1912",
    "estateName": "FISH BAY",
    "island": "stj",
    "quarter": "8 REEF BAY",
    "quarterGroup": "REEF_BAY",
    "features": [
      {
        "entryId": "fish-bay",
        "name": "Fish Bay",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Fish Bay; Inlet, 200 ynrtls wide, 800 ynrds long: Rhallow, sandy ant1 weedy, inside; nnchorngc a t w t r a n r r 1)etwccn (:ocolobu Cay cind Ditlef Point, Yt. . John. SpxniPh, \" La Ensenatla del Pesaido. \""
      }
    ]
  },
  {
    "estateGeoid": "1648",
    "estateName": "FLANNIGAN ISLAND",
    "island": "stj",
    "quarter": "EAST END",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1965",
    "estateName": "FORTSBERG",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "2017",
    "estateName": "FREEMAN'S GROUND",
    "island": "stj",
    "quarter": "3A CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1635",
    "estateName": "FRIISE",
    "island": "stj",
    "quarter": "13, 13A CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1988",
    "estateName": "GIFFT & REGENBACK",
    "island": "stj",
    "quarter": "13A & 14A CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1631",
    "estateName": "GLUCKSBERG",
    "island": "stj",
    "quarter": "22 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1917",
    "estateName": "GREAT CINNAMON BAY",
    "island": "stj",
    "quarter": "MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": [
      {
        "entryId": "cinnamon-bay",
        "name": "Cinnamon Bay",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Cinnamon Bay; Broad, open, shoal bight, 1, 070 ynrds wide, affording anchorage for small craft; with flne beach, 800 yards long, offering excellent surf bathing; with fringe of coconut palms; southwest of America Polnt and Francis Bay, northern shore of St. John Island. A Hollauder, Dnurloo by nnme, who acqufred the adjacent tract, found on It a large cinnamon tree (Dutch, Raneelboom), which suggested the name of the bay and estate : both vftriously rendered as, Caneel Bay, Caneelbayen, Bahia de la Canela, Baye Cunnll, Ranelbay, Kaneel Bay, Cinamonbay, etc"
      }
    ]
  },
  {
    "estateGeoid": "1632",
    "estateName": "GRUNWALD",
    "island": "stj",
    "quarter": "12B CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1977",
    "estateName": "HAMMER FARM / CATHRINEBERG",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1935",
    "estateName": "HANSEN BAY",
    "island": "stj",
    "quarter": "6,7  EAST END",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "hansen-bay",
        "name": "Hansen Bay",
        "type": "bay",
        "island": "stj",
        "quarter": "CORAL BAY",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Hansen Bay; 500 yards wide, northeast cove of Itniintl Bny, northctist arni of Coral Bay, St. John. Called by Oxlioliii, \" 1I:iiiac~nsHny. \" Family iiunie'. Mtitls Hanscn, colonist, 1678; Claw Hansen, govrrnor, 1702-170G. RpelIcd Iiunsou by recent autlroritiea D e Booy t b'nris, also %til)riskie, niiil; e Hnnscn I h y coextensive with Itound Bay. lluiasei~Buy; Originit1 name of Hull Ijay, nortli s h w e of St. T1iom:is; given by Van I<eiilcn ns Jurrinan IIansen Bits, and by Il$$stas Htinwus Hay. H u w w ~ Y - ~ ~ u ~ J; Hansen Bay, later callcd Little Norlhaitfe Ilay, iind now Hull Eay, St. Thornas. -H&t. Iltrnxlol/; ; Siime as Hans-Lollik Island; so nanicd in Oltlcndorp's MissionsGesc. liic~lite. His map by I'aul ICilffner (1767) lins Klriii litins I A k und Grow Hans Lolk, RS niltne of tlle Islands sevrrnlly. n1ilt. s l o ~ ~ g, :% niile wiclc; wcu 4S9. 2 acres; 1% miles NE, of Picuru ~'eIlinKUlil, north shore of St. Thomus Variants: Htinnnlis Itest, Hanna's ltesl. --Id. & W."
      }
    ]
  },
  {
    "estateGeoid": "1910",
    "estateName": "HARD LABOR",
    "island": "stj",
    "quarter": "13BA, 13BB CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1936",
    "estateName": "HAULOVER",
    "island": "stj",
    "quarter": "5 EAST END",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "haulover",
        "name": "Haulover",
        "type": "unknown",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Haulover; Isthmiis, 2 0 yards ncro~n, narrowest p:irt of Eristend Peninsula, hetwveen Dreeket or Haulover Ilay on northeast c'anat find opposlte mve of Round Hay, St. John. Named by Oxholm, Overliale. --l)an. 80, 2%. -- 96 of 215 GEOGRBPHIC DICTIOWABY OF TIEE VIRGIN ISLANDS 93"
      },
      {
        "entryId": "haulover-bay",
        "name": "Haulover Bay",
        "type": "bay",
        "island": null,
        "quarter": "EASTEND",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Haulover Bay; E 0 yards wide, between Griwed Point tint1 Dreeket Point on north shore of Eastend Peninsula, S t. Jolin; only pr:irticLnblc :iiiclior:ip in said region. Ilocal usage; approved by C. P. See Lheeket I h y, Overliale. Gowcd Ray. But Scorpio?& survey (1Stil) rehiiis Oxholni's name, \" Drileket's Bay. \""
      }
    ]
  },
  {
    "estateGeoid": "1645",
    "estateName": "HENLEY CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "henley-cay",
        "name": "Henley Cay",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Henley Cay; 70 teet high, 300 ynrtla in dianietcr, ~ i r ( ~ : i11. 54 :ww: 1nrg:Pst of three Durloe Cays, off nortliwestern roast of St. Joliu. (Nut Pr. iueii). G. I<. Local name. G. XI. , \" Isle\" (on suuiniit); I d. IS\" 21' 1'3. 7\" ((io6 in), long. 64\" 47' 37. 2\" (1, 003 n ~. )"
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "HERMITAGE",
    "island": "stj",
    "quarter": "3B CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "hermitage",
        "name": "Hermitage",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Hermitage; Estate in inclosed valley near sources of Bethlehem Gut, now comprising tract 1 in Prince Quarter, with tracts 5 and 4a (west 1h) in King Quarter, St. Croix. All but 4a belonged to John Willett and his heirs, along with various scattered tracts. --0xholm; Dewitz, etc. I n 1851, with Manning Bay, Castle Coakley, etc. , owned by Ratcliffe."
      }
    ]
  },
  {
    "estateGeoid": "3630",
    "estateName": "HOPE",
    "island": "stj",
    "quarter": "5 REEF BAY",
    "quarterGroup": "REEF_BAY",
    "features": [
      {
        "entryId": "hope",
        "name": "Hope",
        "type": "quarter",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "Hope; 1':state 23, Prince Quarter, St. ('roix. Covered wrih praw, hushes, and trrws. Danish, Iicstbjerg. \" Ileu\"; same ns Sail Rock. See : Hiighes. (1. v. -2. -- 100 of 215 GEOGRAPHIU DICTION. 4RY OF T R E VIRGIN ISLANDS 97 and a smaller beach 500 yards west is cnlled Salonion Bag. Hull Ray was nrtmed durriaan Ilnusen Bay by Van IZwlen, I-Iansen Bay by Ilflst, Ensomhed Ray by Hornbeck, Lille Nordride Ray hy the 1)nne. l. Little Northside R81. v by uavigntors, and Irlull Bay locally. -'1'. Xi1 r). R. : (1. P. ; 0. I3. Hull I'oint; Local nyme for Troyitco Point, S t. Tlionias. --T. 3771. flumbrry; Error for EIuxnhug, St. C'roix. -Osliolni."
      }
    ]
  },
  {
    "estateGeoid": "1634",
    "estateName": "JOHNS FOLLY",
    "island": "stj",
    "quarter": "14A, 14B, 14C CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "johns-folly-bay",
        "name": "Johns Folly Bay",
        "type": "bay",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Johns Folly Bay; 300 yards wide, but constricted by coral reel's on both sides to nvailuble entrance of 50 yards, midway between Stihbat Point and Nanny Point, southeast shore of St. John I. Low1 name. -C'. P. Called by Oxholm, E'riises LIay; in Danish orthography, l'ryse, nieiiniiig Preezc; but probably a proper name, spelled by Dewitr, Fries; also ~irobtiblyinislocated. since recent surveys place Iq'reeze Bay y2 ruile fnrther i)ortli."
      }
    ]
  },
  {
    "estateGeoid": "1633",
    "estateName": "L'ESPERANCE",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "l-esperance",
        "name": "L'Esperance",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "L'Esperance; Seventeenth century French Plantage near present ' I Two Brothers \" Estate, St. Croix. -L."
      },
      {
        "entryId": "esperance",
        "name": "Esperance",
        "type": "road",
        "island": "stj",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Esperance; Icstate or platitation, on east tllde of Espermcc Road, 11e; ~r\\vhere it strikes south Prom Ccviterllue Itouil, p2 i n i b nortliwwt of ( ' u n d l w g Peal;, St. John. -De Booy & Vuris. Not shown 011 C. X: G. S. field slicuxts of 1919 (T. 377\"). but comparison with Oxholiu's map w ~ u l t lloc. ntt. it 150 meters soutliwst of 712-loot betich, enst of gut, ut s l i ~ i i ~ ~ ~ turn d'r ~ d, 700 mcbters northwest of Camelberg. Also culled '' L'ICspBrilucc~\"; E'rriich, meaning \" Hope \"; Sgnnis11, \" La Espernnau. \""
      }
    ]
  },
  {
    "estateGeoid": "3633",
    "estateName": "LAMESHUR COMPLEX",
    "island": "stj",
    "quarter": "REEF BAY",
    "quarterGroup": "REEF_BAY",
    "features": [
      {
        "entryId": "lameshur",
        "name": "Lameshur",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Lameshur; Estate, with Mornvlan Mission school, bay-oil still, lime-juice still, landing, well, etc. , a t head of Little Lameshur Bay, St. John. Bay twea and lime trees both grow wild. Estate house and flagstaff overlook lxiy from elevation of 200 feet, on shoulder of ridge or spur from the Hordedux Mountains. lat. 18' 18' 58\" (1, 784m. ), , long. 64' 43' 57\" (1, 683 ni. ). G. B. Nanie signifir'; \" Lemon-shore \" or \" Limeflhore. \"-liolst. 13y mistaken etymologies, converted into French \" 1, a Mcsure \" (the hlensurc), or 'I La Rlnsure\" (the old shack)."
      }
    ]
  },
  {
    "estateGeoid": "1638",
    "estateName": "LEINSTER BAY",
    "island": "stj",
    "quarter": "MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": [
      {
        "entryId": "leinster-bay",
        "name": "Leinster Bay",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Leinster Bay; Estate, with cattle ranch and rpform school, at eastern end of Bay so called, northern shore of St. John. --T. 3772; Z. The location would identify this with Waterlemon Cay Estate, noted by Oxholm and Knox, p. 223."
      }
    ]
  },
  {
    "estateGeoid": "1979",
    "estateName": "LITTLE PLANTATION (Lohman)",
    "island": "stj",
    "quarter": "4A CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "little-plantation",
        "name": "Little Plantation",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Little Plantation; Estate in St. J a n (St. John). -Eggers, p. 102."
      }
    ]
  },
  {
    "estateGeoid": "1626",
    "estateName": "LOVANGO CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "lovango-cays",
        "name": "Lovango Cays",
        "type": "quarter",
        "island": "stj",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Lovango Cays; 'l'hree Islands, viz, Imanqo, Congo. and hlingo C'II~Y. administratively attached to Cruz-Hay Quarter, St. John. ('allptl by tile Spanish, respectively Lovango Grantle, Chico, and iMw3a."
      }
    ]
  },
  {
    "estateGeoid": "1629",
    "estateName": "MANDAHL",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1919",
    "estateName": "MILAND",
    "island": "stj",
    "quarter": "MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": [
      {
        "entryId": "miland",
        "name": "Miland",
        "type": "bay",
        "island": "stj",
        "quarter": "MAHO BAY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Miland; Place between America Hill and Maho Bay, St. John. -Lightbourn's Mail Notes, October 12, 1916. Cited by Zabriskle, p. 234. Settlement at south end of Malio Bay, shown on T. 3772, at foot of America Hill, aecording to A. Francla '' Merle \" means \" blnckbird. \""
      }
    ]
  },
  {
    "estateGeoid": "1641",
    "estateName": "MINGO CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1918",
    "estateName": "MOLLEDAHL & LITTLE REEF BAY",
    "island": "stj",
    "quarter": "10A REEF BAY",
    "quarterGroup": "REEF_BAY",
    "features": [
      {
        "entryId": "reef-bay",
        "name": "Reef Bay",
        "type": "estate",
        "island": "stj",
        "quarter": "REEF BAY",
        "confidence": 225,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Reef Bay; Reentrant rjght angle of south shore of St. John Island, more than a mile across base between Oyen Point and White Cliffs. Name a t r i m s lation of the Dutch equivalent, Rif, Danish B e v; with numerous vnrionts : Refbay, Reffbay, Reffbayen, Revbay, Rlfbay, Riffbay, and dlvided forms; Spanish, Bahia del Arrecife, From tho bayliead along the northwest beach for 700 yards, It I8 called \" Genli IJny. \" mefbay; Estate bordering on Reef Bay, sbuthern shore of St. John; having a banana-patch, coconut-grove, only wgar-mill now on the Island, I : r ~ ~ t l cattle ranch. C. & G. S. fleld sheet shows plantation as occupying'$laln from northeast beach north to junction of Esperance and Reef Bay BoadR: with latter road continuing to landing. Other authorities show Parforce occupying snme location; hence, identical. U. P. , Raefbag hause, lat. 187"
      }
    ]
  },
  {
    "estateGeoid": "1934",
    "estateName": "MT PLEASANT & RETREAT",
    "island": "stj",
    "quarter": "EAST END",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "retreat",
        "name": "Retreat",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 485,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Retreat; Estate, 16a (western s ) in Company Quarter. and 44b (sothem 1h)"
      }
    ]
  },
  {
    "estateGeoid": "6477",
    "estateName": "NEWFOUND BAY",
    "island": "stj",
    "quarter": "9A  EAST END",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1637",
    "estateName": "PALESTINA",
    "island": "stj",
    "quarter": null,
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "palestina",
        "name": "Palestina",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Palestina; Settlement or Estate, wmtward of Popilleau Bay, Hurricane Hole, St. John. -Map 3241. Also spelled, Palestine. 250 yards northeast of the adjacent 187-fOOt hill, is a low rocky point on the west shore of Hurricane Hole, between Borck Creek and Popilleau Bay, in l a t 18\" 21' 10. 3\" (842 meters), long. 64\" 42' 12. 5\" (427 meters)."
      }
    ]
  },
  {
    "estateGeoid": "1838",
    "estateName": "PASTORY",
    "island": "stj",
    "quarter": "5 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1636",
    "estateName": "PETER BAY",
    "island": "stj",
    "quarter": "2AA MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": []
  },
  {
    "estateGeoid": "1646",
    "estateName": "RAM GOAT CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "ram-goat-cay",
        "name": "Ram Goat Cay",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Ram Goat Cay; Error for Ramgoat Cay, q. v. -T. 3779."
      }
    ]
  },
  {
    "estateGeoid": "1644",
    "estateName": "RATA CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1624",
    "estateName": "REEF BAY",
    "island": "stj",
    "quarter": "REEF BAY",
    "quarterGroup": "REEF_BAY",
    "features": [
      {
        "entryId": "reef-bay",
        "name": "Reef Bay",
        "type": "estate",
        "island": "stj",
        "quarter": "REEF BAY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Reef Bay; Reentrant rjght angle of south shore of St. John Island, more than a mile across base between Oyen Point and White Cliffs. Name a t r i m s lation of the Dutch equivalent, Rif, Danish B e v; with numerous vnrionts : Refbay, Reffbay, Reffbayen, Revbay, Rlfbay, Riffbay, and dlvided forms; Spanish, Bahia del Arrecife, From tho bayliead along the northwest beach for 700 yards, It I8 called \" Genli IJny. \" mefbay; Estate bordering on Reef Bay, sbuthern shore of St. John; having a banana-patch, coconut-grove, only wgar-mill now on the Island, I : r ~ ~ t l cattle ranch. C. & G. S. fleld sheet shows plantation as occupying'$laln from northeast beach north to junction of Esperance and Reef Bay BoadR: with latter road continuing to landing. Other authorities show Parforce occupying snme location; hence, identical. U. P. , Raefbag hause, lat. 187"
      }
    ]
  },
  {
    "estateGeoid": "1987",
    "estateName": "RENDEZVOUS & DITLEFF",
    "island": "stj",
    "quarter": "15A CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "rendezvous-bay",
        "name": "Rendezvous Bay",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Rendezvous Bay; mile wide, between Jauhvun Point and Ditlef Point, St."
      }
    ]
  },
  {
    "estateGeoid": "1623",
    "estateName": "RUSTENBERG & ADVENTURE",
    "island": "stj",
    "quarter": "MAHO BAY",
    "quarterGroup": "MAHO_BAY",
    "features": []
  },
  {
    "estateGeoid": "6077",
    "estateName": "SABA BAY",
    "island": "stj",
    "quarter": "8  EAST END",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "2006",
    "estateName": "SAN SOUCCI & GUINEA GUT",
    "island": "stj",
    "quarter": "9 & 10 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": []
  },
  {
    "estateGeoid": "1981",
    "estateName": "SAUNDER'S GUT",
    "island": "stj",
    "quarter": "7 CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1985",
    "estateName": "SIEBEN",
    "island": "stj",
    "quarter": "9A REEF BAY",
    "quarterGroup": "REEF_BAY",
    "features": [
      {
        "entryId": "sieben",
        "name": "Sieben",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Sieben; Old Estate on southwest bench of Camelberg Peak, nt right turn of E'spernnce Rond, 100 yards north-northeast of Fish Bay, In Reef'bay Quarter, St. John. Once stately mansion now i n ruins, with two old hnlfburied guns, reminders of days of piracy. -Reichel; Dewitz. Dutch, Zeven; now pronounced and spelled Seeven, q. v. Confused by Oxholm with Mollendal, q. v."
      }
    ]
  },
  {
    "estateGeoid": "2039",
    "estateName": "ST QUACCO & ZIMMERMAN",
    "island": "stj",
    "quarter": "11 & 12 CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1643",
    "estateName": "STEVEN CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "steven-cay",
        "name": "Steven Cay",
        "type": "bay",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Steven Cay; 360 yards ~ Q W, 90 yards wide, 28 feet high; area 2 acre& not inclusive of May Rock; % &le west of St. John I. , in Pillsbury Sound. (Not Meeren, Meeven, Mere& Meren, Stepmar, nor Gteven May, ), --Z, ; a. B. Probably same as Shorbomanog of earliest charts. lgtevm H a g; Steven Cay. -Dan. 265; Dewitz; Bf5rgesen. atewart Bay; See Wills Bay, St. ardr."
      }
    ]
  },
  {
    "estateGeoid": "1913",
    "estateName": "SUSANNABERG",
    "island": "stj",
    "quarter": "17A CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "susannaberg",
        "name": "Susannaberg",
        "type": "estate",
        "island": "stj",
        "quarter": "CRUZ BAY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Susannaberg; Hill, 702 feet high, just north of Estate to which the Hill gives its nwne, Cruz Bay Quarter, St. John."
      }
    ]
  },
  {
    "estateGeoid": "1892",
    "estateName": "TRUNK BAY",
    "island": "stj",
    "quarter": "16 CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "trunk-bay",
        "name": "Trunk Bay",
        "type": "quarter",
        "island": "stj",
        "quarter": "EAST END",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Trunk Bay; Eastern half of an indentation 800 yards wide, affordiog anchorage for small craft, partly sheltered by Trunk Cay; with an especially beautiful beach of coral sand, 490 yards long, offering excellent surf bathing, and with an extensive \"cocal\" or coconut grove: at northeast end of Crur Bay Quarter, St. John. Old spellings: Troncbay, Tronkbayen. Name may be from either '' Trunkschildpatt \" (leatherback turtle), or ('Trunkfish \" Lactophrys triqueter, the Chnpin. See West's Bidrag tll"
      }
    ]
  },
  {
    "estateGeoid": "1647",
    "estateName": "TRUNK CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "trunk-cay",
        "name": "Trunk Cay",
        "type": "bay",
        "island": "stj",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Trunk Cay; Islet, 48 feet high, 210 yards long, area 2% acres, 80 yards from Trunk Bay beach, northwest ehore of St. John Island. Rluff share; top covered with shrubbery. Local name, superseding Peters Cay: last confusing, as Peter Bay is % mile east, and Peter Island 8 miles east. -& B."
      }
    ]
  },
  {
    "estateGeoid": "1628",
    "estateName": "TURNER POINT",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": [
      {
        "entryId": "point",
        "name": "Point",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Point; but C. P. , pp. 116, 130-1, extends limit west to Lucas Pdnt, -H. 0. 3903, & Publ. 129. Spanislb Bahia, Perseverancia 6 BnaenQda de la Perseverancia. Called '' Flamingopop Bay, \" by -~oxAbeck; last applies k t to northwestern portion only, off low beach. Crolx. -- 148 of 215 GEOGRAPEZTC TJICTICINARY OF THE VIRGIN ISLANDS 145 Peru, : 'Bev&P&ntli trenfhry French Plantage, near present Humbug Estate, Peschdo, Gallo; Spanish equivrllent of Fleh Cay, St. John. Pcnmclo, lhtaenada ncl: Spanish name o f Fish Bay, St. John. -Den."
      }
    ]
  },
  {
    "estateGeoid": "1639",
    "estateName": "USHER'S QUAY",
    "island": "stj",
    "quarter": "CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1640",
    "estateName": "WHISTLING CAY",
    "island": "stj",
    "quarter": "CRUZ BAY",
    "quarterGroup": "CRUZ_BAY",
    "features": [
      {
        "entryId": "whistling-cay",
        "name": "Whistling Cay",
        "type": "cay_or_island",
        "island": "stj",
        "quarter": "KING",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Whistling Cay; 202 feet hfgh, 640 yards long, 236 yards wide, area 18. 6 acres; 290 yards west of Mary Point, northern shore of St. John. Gravel beach at southeast point, where glailboats obtain cargoes of butldlng gravel. Elsewhere, shore is predpftOUS; on north, cliffs rise to 130 feet. Top, tree-clad; goat-pasture. Name perhaps derived from Dutch Wlssd, Danish Vexel, meaning '' change \"; or from Dutch \" Baksel, \" batch or baking, as of rolls or pottery; thought applicable to bowlder-pile on western point, In lat. 18' 22' 17. 5\" (538 m. ), long. 64. 45' 39. 25\" (1152m. ). Called by various cartographers : Baxel, Boxel, Wessel, Wissel; and by the Spanish, Cay0 Bajel."
      }
    ]
  },
  {
    "estateGeoid": "1991",
    "estateName": "ZOOTENVAL",
    "island": "stj",
    "quarter": "3A CORAL BAY",
    "quarterGroup": "CORAL_BAY",
    "features": []
  },
  {
    "estateGeoid": "1795",
    "estateName": "ADELPHI",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1898",
    "estateName": "AGNES FANCY",
    "island": "stt",
    "quarter": "8, 8H GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2032",
    "estateName": "ALTONA & WELGUNST",
    "island": "stt",
    "quarter": "KRONPRINDSENS",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "altona-hill",
        "name": "Altona Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Altona Hill; Applied to either of two eminences south of the lagom and on the estate so called; the western, 1S5 feet high, nearest the estate house, ; and th8 eastern, 178 feet high, locally so kmwn, site of old French plantage Guillarmet."
      }
    ]
  },
  {
    "estateGeoid": "2031",
    "estateName": "ANNA'S FANCY",
    "island": "stt",
    "quarter": "KRONPRINDSENS",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "2022",
    "estateName": "ANNA'S RETREAT",
    "island": "stt",
    "quarter": "1 NEW",
    "quarterGroup": "NEW",
    "features": []
  },
  {
    "estateGeoid": "1897",
    "estateName": "BAKKERO",
    "island": "stt",
    "quarter": "3 FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": []
  },
  {
    "estateGeoid": "-1",
    "estateName": "BELLEVUE",
    "island": "stt",
    "quarter": "7, 3 FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "bellevue",
        "name": "Bellevue",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bellevue; Estatehouse and landing, nenr bench of cove 1. 10 yards wide, on e a s t shore of St. Thomas Harbor, opposite Rupert liock, and 330 yards northnorthwest of Bellevue or Lisenlund IIill. -Lawranc~."
      },
      {
        "entryId": "bellevue-hill",
        "name": "Bellevue Hill",
        "type": "hill",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bellevue Hill; 814 feet high, 840 yards SIC. of Havensight Polnt, and 220 yards NE. of shore of St. Thomas Harbor entrance-BA. 2183; Fr. 2312. French name, meaning '' beautiful view. \" Also called, \" Liseriluntl Hill, \" from Fatate."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BETHESDA",
    "island": "stt",
    "quarter": "8 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "bethesda",
        "name": "Bethesda",
        "type": "estate",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bethesda; Estate on southeast side of road northeast of Fortuna Estate and near Fortuna Hill. Not f a r from 766-foot summit, Westend Quarter, St. Thomas. -Holst."
      },
      {
        "entryId": "bethesda-hill",
        "name": "Bethesda Hill",
        "type": "quarter",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bethesda Hill; 766 feet high, 580 yards northeast of Fortuna Hill, Westend Quarter, St. Thomas. -Map 3240; Lund."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BOLONGO",
    "island": "stt",
    "quarter": "3, 8 FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "bolongo",
        "name": "Bolongo",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bolongo; Estate, 840 yards north-northwest from beach of Bolongo Bay, south coast of St. Thomas."
      },
      {
        "entryId": "bolongo-bay",
        "name": "Bolongo Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bolongo Bay; Oval opening, 300 yards wide, with beach and coconut grove, on east side of Coculus Point, long. 64' 53' 46\", south shore of St. Thomas. Identifled with \" Annadewint Bay \" of early Dutch charts, French, \" Bnye de la ReIne Anne \"; spelled by Rohde ' I Blungo Bay. \""
      },
      {
        "entryId": "bolongo-hill",
        "name": "Bolongo Hill",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bolongo Hill; 331 feet hlgh, south shoulder of spur east of Rolongo Estate and Valley, 550 yards north of Bolongo Bay, St. Thomas."
      },
      {
        "entryId": "bolongo-point",
        "name": "Bolongo Point",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bolongo Point; Rugged red bluff, 40 feet high, projecting from 70-foot ridge, east entrance of Bolongo Bay, St. Thomas."
      },
      {
        "entryId": "bolongo-road",
        "name": "Bolongo Road",
        "type": "bay",
        "island": "stt",
        "quarter": "REDHOOK",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bolongo Road; Leaves French-Bay Noatl nearly 4/2 mile north of French Bay, and extends east-northeast 580 yards, thence southeast 1, 400 yards to Bolongo Bay, thence east and northeast to join Turpentine Avenue and Redhook Road, St. Thomas-T. 3771 and 3778."
      },
      {
        "entryId": "bolongo-valley",
        "name": "Bolongo Valley",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bolongo Valley; Extending % niile north-northwest from Bolongo Ray, traversed by Bolongo Koad, French Bay Quarter, St. Thomas. From Bolongo Estate."
      }
    ]
  },
  {
    "estateGeoid": "1999",
    "estateName": "BONNE ESPERANCE",
    "island": "stt",
    "quarter": "2 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "bonne-esperance",
        "name": "Bonne Esperance",
        "type": "estate",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bonne Esperance; Estate on ridge a t 871 feet elevation, overlooking Perserverance Bay, 500 yards south-southwest, Westend Quarter, St. Thomas. B. A. Chart 2452; Hornbeck. Less correctly, Bon Espernnce. Spanlsh, I' Buena E#peranza. \""
      },
      {
        "entryId": "bonne-esperance-estatehouse",
        "name": "Bonne Esperance Estatehouse",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Bonne Esperance Estatehouse; lat. 18' 21' 789 m. , 64' 59' 747 m. 0. P. \" Boa\"-Descr. Sta. No. 109. Less correctly, Bon Esperance Hill."
      },
      {
        "entryId": "bonne-esperance-rill",
        "name": "Bonne Esperance Rill",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Bonne Esperance Rill; 778 feet high, sharp peak 295 yards west-northwest of"
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BONNE RESOLUTION",
    "island": "stt",
    "quarter": "5 LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": [
      {
        "entryId": "bonne-resolution",
        "name": "Bonne Resolution",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bonne Resolution; Estate and Moravian School, St. Thomas. Same as Resolution Estate. -Hornbeck; Dewitz; Reichel; Holst."
      }
    ]
  },
  {
    "estateGeoid": "1797",
    "estateName": "BORDEAUX",
    "island": "stt",
    "quarter": "6, 8 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "bordeaux",
        "name": "Bordeaux",
        "type": "estate",
        "island": null,
        "quarter": "CORAL BAY",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Bordeaux; Estate on crest of Bordeaux Mountains, W mile west of Coral Bay, 1 % miles north of Lameshur Ray, St. . John. Vnrious cartographem indicate buildings about 1, 242, 1, 125 and 1, 220 feet summits. Test-drill found strong magnesium water. Spelled less correctly, Bordeau, Bowdeaux."
      },
      {
        "entryId": "bordeaux-point",
        "name": "Bordeaux Point",
        "type": "quarter",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bordeaux Point; 650 yards west of Bordeaux Bay, and 810 yards north of Bordeaux Hill, Westend Quarter, northern coast St. Thomas Island. -G. B."
      },
      {
        "entryId": "bordeaux-bay",
        "name": "Bordeaux Bay",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bordeaux Bay; Semicircular cove, % mile wide, y4 mile east of Bordenux Point, on northern shore of St. Thomas Island. Named for the Estate, and sometimes spelled Bourdeaux. To distinguish It from the still smaller Little Borde~uxRay, mile eastwnrd, this was called by Van ICenlen, '' Bordeaux Groote Bay, \" and by Bellin, \" Grande Baye de Bordeaux. \"P. D. J. ; Hgst."
      },
      {
        "entryId": "bordeaux-klyne-bay",
        "name": "Bordeaux Klyne Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bordeaux Klyne Bay; Between Calvert Point and Bordeaux Bay, St. Thomas. See '' Petite Baye de Bordeaux \"; \" Petit-Bordeaux Bay. \" long. 65\" 00'"
      },
      {
        "entryId": "bordeaux-hill",
        "name": "Bordeaux Hill",
        "type": "quarter",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Bordeaux Hill; Summit 6% feet, east shoulder 668 feet, 1 mile east-northeast from West Point, 1, 870 yards from Bordeaux Point; Westend Quarter, St."
      }
    ]
  },
  {
    "estateGeoid": "1943",
    "estateName": "BOTANY BAY",
    "island": "stt",
    "quarter": "7 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "botany-bay",
        "name": "Botany Bay",
        "type": "bay",
        "island": "stt",
        "quarter": "WEST END",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Botany Bay; 620 yards wide, south of Botany Point, north coast, near west end, St. Thomas. Fringing coral reef. -Hornbeck; Dan. 285; B. A. 2452. Also called, Bush Bay, Baye du Bois, Botanybay, 13osch-Ray, Casper Bosch Bay, and Horn's Bay. -H. 0. 3903 makes Botany Bay include Sandy Bay."
      },
      {
        "entryId": "botany-bay-road",
        "name": "Botany Bay Road",
        "type": "estate",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Botany Bay Road; Leaves Botany Bay estate, ascends hill north ?, & mile t o near Botany Point, turns sharply east :it 150-foot contour, and heconies known as Westend Road, St. Thomas. -T. 3760."
      }
    ]
  },
  {
    "estateGeoid": "1998",
    "estateName": "BOVONI",
    "island": "stt",
    "quarter": "1, 2, & 3 FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "bovoni",
        "name": "Bovoni",
        "type": "estate",
        "island": "stt",
        "quarter": "KING",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bovoni; Estate, now ruined, on hill of same name, overlooking bay of same name, 300 yards from south shore, French Bay Quarter, St. Thomas. Znhriskie; !I?. 3778. . In 1951, a \" stock eatate. \"-Lawrance."
      },
      {
        "entryId": "bovoni-bay",
        "name": "Bovoni Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bovoni Bay; R d n t r a n t angle of south coast, east of Bolongo Bay, St. Thomas. Zabriskie; T. 3778'. Also spelled Bovinibay, Bovonis-Bay."
      },
      {
        "entryId": "bovoni-cay",
        "name": "Bovoni Cay",
        "type": "bay",
        "island": "stt",
        "quarter": "EAST END",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bovoni Cay; Island of mnngrove and marsh, % mile long, covering nearly 60 acres, with u ?'&foot knoll or humpel near the northern end, separating See \" Bordeaux. \" -- 44 of 215 OEOORAPHIC DICTIONARY OF THE VIRGIN ISLANDS 41 Mangrove Lagoon from Jersey Bay, southeast portion of St. Thomas Island. Small manglars o r intingrove clumps in southeast end of Mangrove Lagoon cover nearly 2 acres more. Patricia Cay, covering 33. 4 acres, south of Bovoni Cay, from which it is separated by a narrow tortuous passage, is of similar formation, with a knoll of equal height, and has sometimes been considered as il portion of the Bovniii Cay or Cays. -U. B."
      }
    ]
  },
  {
    "estateGeoid": "1833",
    "estateName": "BOVONI CAY",
    "island": "stt",
    "quarter": "FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "bovoni-cay",
        "name": "Bovoni Cay",
        "type": "bay",
        "island": "stt",
        "quarter": "EAST END",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bovoni Cay; Island of mnngrove and marsh, % mile long, covering nearly 60 acres, with u ?'&foot knoll or humpel near the northern end, separating See \" Bordeaux. \" -- 44 of 215 OEOORAPHIC DICTIONARY OF THE VIRGIN ISLANDS 41 Mangrove Lagoon from Jersey Bay, southeast portion of St. Thomas Island. Small manglars o r intingrove clumps in southeast end of Mangrove Lagoon cover nearly 2 acres more. Patricia Cay, covering 33. 4 acres, south of Bovoni Cay, from which it is separated by a narrow tortuous passage, is of similar formation, with a knoll of equal height, and has sometimes been considered as il portion of the Bovniii Cay or Cays. -U. B."
      },
      {
        "entryId": "bovoni",
        "name": "Bovoni",
        "type": "estate",
        "island": "stt",
        "quarter": "KING",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Bovoni; Estate, now ruined, on hill of same name, overlooking bay of same name, 300 yards from south shore, French Bay Quarter, St. Thomas. Znhriskie; !I?. 3778. . In 1951, a \" stock eatate. \"-Lawrance."
      }
    ]
  },
  {
    "estateGeoid": "1821",
    "estateName": "BUCK ISLAND",
    "island": "stt",
    "quarter": "FRENCHMANS BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "buck-island",
        "name": "Buck Island",
        "type": "point",
        "island": "stt",
        "quarter": "WEST END",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Buck Island; 110 feet high, YJ mile long, area 41. 55 acres; western and larger of Capella Cays, 2 miles south of St. Thomas Island. Light on white, square tower, 136 feet above low water; lat. 18\" 16' 48\", long. 64\" 53' 35\". Summit called by Bellin, I' Montagne Rouge \" (Rouge or Red Hill); Cove at west end, \" Mouillage pour les Barques \" (landing for the Boats, Mouillage Cove). The Spanish Derrotero describes the island a s partially covered by Matorral \" (heath); and mentions the '' Restinga \" (ledge) extending 100 yards off west point. Hest derives the island's name from its having been tenanted only by a few very wild \"Gedebukker\" (Buckgoats); whence, Dutch \" Boken \" or '' Bokken Eyland. \" Easterly companion island, severed by 60-yard passage, loosely regarded as portion of"
      }
    ]
  },
  {
    "estateGeoid": "1799",
    "estateName": "CANAAN & SCHERPENJEWEL",
    "island": "stt",
    "quarter": "7A, 7B GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "canaan",
        "name": "Canaan",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 455,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Canaan; Estate, 13 Northside B Quarter, St. Croix; occupying \" a pretty little valley (smuk lille Dal), \" planted In sugar cane, at head stream of Concordia Gut, here called Canaan Bsck, 1% miles from north coast. -L. & W. ; Dewitz. Combined with Betsy's Jewel. --Boorpdon (1861)."
      },
      {
        "entryId": "canaan-mad",
        "name": "Canaan mad",
        "type": "quarter",
        "island": "stt",
        "quarter": "GREAT NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Canaan mad; Mile-long stretch of turnplke, descending north slope of ridge southeast of Magens Bay, Great Northside Quarter, St. Thomas. -T. 3771. -- 50 of 215 QEOORAPHIC DICTIONARY OF THE VIRQlN ISLANDS 47"
      }
    ]
  },
  {
    "estateGeoid": "1801",
    "estateName": "CAREENING HOLE",
    "island": "stt",
    "quarter": "8A SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2015",
    "estateName": "CARET BAY",
    "island": "stt",
    "quarter": "3 LITTLE NORTHSIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1831",
    "estateName": "CAS CAY",
    "island": "stt",
    "quarter": "FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": []
  },
  {
    "estateGeoid": "1011",
    "estateName": "CATHERINEBERG",
    "island": "stt",
    "quarter": "8H GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "catherineberg",
        "name": "Catherineberg",
        "type": "estate",
        "island": "stj",
        "quarter": "CRUZ BAY",
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Catherineberg; Estate, 6 j mile south of Cinnamon Bay, at or near Hammer Farm, q. v. , in northeast portion of Cruz Bay Quarter, St. John. Name means *'Catherine Hill, \" doubtless referring to Peter Peak, q. v. , I/a mile north of Hammer Farm. Oxkolm spells it \" Cathrineberg. \""
      }
    ]
  },
  {
    "estateGeoid": "2029",
    "estateName": "CHARLOTTE AMALIE",
    "island": "stt",
    "quarter": "NEW",
    "quarterGroup": "NEW",
    "features": []
  },
  {
    "estateGeoid": "1830",
    "estateName": "COCULUS ROCK",
    "island": "stt",
    "quarter": "RED HOOK",
    "quarterGroup": "REDHOOK",
    "features": []
  },
  {
    "estateGeoid": "1804",
    "estateName": "COKI POINT",
    "island": "stt",
    "quarter": "EAST END",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "2024",
    "estateName": "CONTANT 7A",
    "island": "stt",
    "quarter": "7A SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "contant",
        "name": "Contant",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Contant; Estate with stone mill on ridge, 1, oM) yards northwest of Gregerie Bay, St. Thomas; latitude 18\" 20' 1, 405 m. , long. 64\" 57' 685 m, Erroneously, Constant."
      }
    ]
  },
  {
    "estateGeoid": "1868",
    "estateName": "CONTANT 7b",
    "island": "stt",
    "quarter": "7b SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "contant",
        "name": "Contant",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Contant; Estate with stone mill on ridge, 1, oM) yards northwest of Gregerie Bay, St. Thomas; latitude 18\" 20' 1, 405 m. , long. 64\" 57' 685 m, Erroneously, Constant."
      }
    ]
  },
  {
    "estateGeoid": "1865",
    "estateName": "CONTANT 7B",
    "island": "stt",
    "quarter": "7B SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "contant",
        "name": "Contant",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Contant; Estate with stone mill on ridge, 1, oM) yards northwest of Gregerie Bay, St. Thomas; latitude 18\" 20' 1, 405 m. , long. 64\" 57' 685 m, Erroneously, Constant."
      }
    ]
  },
  {
    "estateGeoid": "1874",
    "estateName": "CONTANT 7BA",
    "island": "stt",
    "quarter": "7BA SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "contant",
        "name": "Contant",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Contant; Estate with stone mill on ridge, 1, oM) yards northwest of Gregerie Bay, St. Thomas; latitude 18\" 20' 1, 405 m. , long. 64\" 57' 685 m, Erroneously, Constant."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "CONTANT 7Bb",
    "island": "stt",
    "quarter": "7Bb SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "contant",
        "name": "Contant",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Contant; Estate with stone mill on ridge, 1, oM) yards northwest of Gregerie Bay, St. Thomas; latitude 18\" 20' 1, 405 m. , long. 64\" 57' 685 m, Erroneously, Constant."
      }
    ]
  },
  {
    "estateGeoid": "2016",
    "estateName": "CROWN & HAWK",
    "island": "stt",
    "quarter": "3, 3B, 3D, 3F, 3H SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "crown-bay",
        "name": "Crown Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Crown Bay; Cove on south shore of St. Thomas, northwest of Careen Hill."
      },
      {
        "entryId": "crown-mountain",
        "name": "Crown Mountain",
        "type": "hill",
        "island": "stt",
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Crown Mountain; Highest peak on St. Thomas Island; tiltitude 1, 550 feet; I&. 18' 21' 31. 422'' (067 i n. ), long 64\" 58' 20. 64\" (06111. ). Also called West Mountain, or considered as peak of last. At conjunction of hountlaries of Westend, Little Northside, and Southside Quarters. -T. 3770;"
      },
      {
        "entryId": "crownprince",
        "name": "Crownprince",
        "type": "quarter",
        "island": "stt",
        "quarter": "PRINCE",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Crownprince; Quarter o r ward in Charlotte Amalia, now St. Thomas City. Danish, Kronprins."
      },
      {
        "entryId": "crown-house",
        "name": "Crown House",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Crown House; On Crown Road, where it crosseB col at 1, 218 feet elevatiua, between Crown Hill and Hawk Hill, St. Thomns. -T. 3770."
      },
      {
        "entryId": "crown-road",
        "name": "Crown Road",
        "type": "hill",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Crown Road; Continuation of Contant Road up south slope of Crown Mountain to Crown House, thence down west slope to junction with Northside. arid Uonne Bsgerance 1iouds. -T. 3770 and 3771."
      }
    ]
  },
  {
    "estateGeoid": "1803",
    "estateName": "DEMARARA",
    "island": "stt",
    "quarter": "KRONPRINDSENS",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1829",
    "estateName": "DOG ISLAND",
    "island": "stt",
    "quarter": "REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": [
      {
        "entryId": "dog-island",
        "name": "Dog Island",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Dog Island; y4 mile long, area 12. 14 acres, y4 mile east-soiitheast of T'ittle St. James 1sl; ~id. SO named on all modern chartr. Called hy Dutch :ind Danes, \" Hund or H n i d e Eyland \"; by the Creoles, \" Ilond \"; and by the Spanish, \" Isla del Perro. \""
      },
      {
        "entryId": "dog-island-cut",
        "name": "Dog-Island Cut",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Dog-Island Cut; Boat-passage, 440 yard4 wide, with 1Ih-fatliom rock in middle, between Little St. James Island and Dog Island. Called in the Derrotero, ''El Freu de la Isla del I'crro. \""
      }
    ]
  },
  {
    "estateGeoid": "1938",
    "estateName": "DONOE",
    "island": "stt",
    "quarter": "2A NEW",
    "quarterGroup": "NEW",
    "features": [
      {
        "entryId": "donoe",
        "name": "Donoe",
        "type": "quarter",
        "island": "stt",
        "quarter": "NEW",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Donoe; Estlite, east of Wintberg Itotitl, where it turns off north from Tiitu Itoad, 2, 470 yards (1. 4 rn. ) east of St. Thomas Harbor, in New Quarter, 9t. rl'lrom:rH."
      },
      {
        "entryId": "donoe-hill",
        "name": "Donoe Hill",
        "type": "quarter",
        "island": "stt",
        "quarter": "NEW",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Donoe Hill; 308 feet high, just in rear of Donoe Esttite, :KM) yards north of Tutu Iload, New Quarter, St. Thomas. -T. 3771. L)orlo h u, ' \\'* r'itirit of IJiirloe Bay, S t. iolllt. -Oltlcndorg. 1). 46, spells i t \"Dorlobay. \" Sp:mish, Piedra del Perro. -- 70 of 215 GEOGRAPHIC] DICTIONARY OF THE VIRGIN ISLANDS 67"
      }
    ]
  },
  {
    "estateGeoid": "1916",
    "estateName": "DOROTHEA",
    "island": "stt",
    "quarter": "6, 7A LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": [
      {
        "entryId": "dorothea",
        "name": "Dorothea",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Dorothea; Estate, mile south of Dorothea Ray, on Nortlm!Ci: Road, St."
      },
      {
        "entryId": "dorothea-road",
        "name": "Dorothea Road",
        "type": "hill",
        "island": "stt",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Dorothea Road; Continuation of Northside Road to junction a t eo1 with Lerkrulnnd Road, turning north, and Solberg Road, exteiiding southeast tlowii slope to E'rench Hill, St. Thomas. -T. 3771."
      },
      {
        "entryId": "dorothea-bay",
        "name": "Dorothea Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Dorothea Bay; 400 ynrtls wide, betwrerl hrothea ant1 Huy I'oints, long. 61\" 57' 45\" W. , north coast of St. Thomas. Originally called \"IIammert R:iy, \" q. v. -7'. 3773 and D. R. ; G. B. , 3-2-21; C. P. , p. 118."
      },
      {
        "entryId": "dorothea-point",
        "name": "Dorothea Point",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Dorothea Point; Sharp projection between Dorothea Bay and IIull Ihty, L'ittle Nortlihidt~(>nxrtcr, St. Thomas. Local name. Fornierlv called '' Lammert Point. \"--G. B."
      }
    ]
  },
  {
    "estateGeoid": "1825",
    "estateName": "DUTCHMAN CAP",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "dutchman-cap",
        "name": "Dutchman Cap",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Dutchman Cap; Same as Dutclicap C8ay, --I>an. 80; Horiibeck; Iieicliel."
      }
    ]
  },
  {
    "estateGeoid": "1791",
    "estateName": "EASTERN WATER ISLAND / SPRAT BAY",
    "island": "stt",
    "quarter": "10 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1900",
    "estateName": "ELIZABETH",
    "island": "stt",
    "quarter": "3I GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "elizabeth-hill",
        "name": "Elizabeth Hill",
        "type": "hill",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Elizabeth Hill; South of Mngcns Rny, near Misgen, St. Thomas. -Holst."
      }
    ]
  },
  {
    "estateGeoid": "1944",
    "estateName": "FORTUNA",
    "island": "stt",
    "quarter": "8 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "fortuna",
        "name": "Fortuna",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Fortuna; Old estnte in St. Thomas; ruins of estatehouse r i n d mill stIll to be wen on k'ortuna Hill. - Ktitfner (171-37); Scorpion (1S51). Also called, Fortune o r Fortuna Bay. I~'orIuu(~ U a / /; 1Cst:itc'. hctween hill and b n g of same name, St. Thomns. ---l~nn. 800. ; Dewitz; Rohde; Reichel; Oldendorp. Spelled \" Fortune \" by HornhWk."
      },
      {
        "entryId": "fortuna-cliff",
        "name": "Fortuna Cliff",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Fortuna Cliff; 60 or 70 feet high, facing south shore for 1, 6 0 yards east of Lucns Point, St. Thomas, along base of Fortuna Hill; also, along shores of Fortuna Bay."
      },
      {
        "entryId": "fortuna-bay",
        "name": "Fortuna Bay",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Fortuna Bay; 1, 280 yards wide, consisting of two small grnvrlly hags, between David and Lucttq Points, south coast of St. Thomns. Nattepm Rag on the west is 340 yards wide. Harkcfall or Krohhepan 13ay on the cast is 400 yards wide. Krabbepan Point, separating the two, is hroad and rocky, frtced by 11 200-font preclpire, nnd crowned by a 3M-foot crag. -T. 3770;"
      },
      {
        "entryId": "fortuna-mill",
        "name": "Fortuna Mill",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Fortuna Mill; Rninctl stiqnrmlll 30 feet high, 40 yards east of large rninci of old Fortuns Estntehouse, 350 yards southwest of Fortiinn Hill, on 823foot hiI1, St. 'I'homns. -R. A. 2452, G. 1'. \" Old Sujirir Mill \": Lut. 18' 21' (270 in. ), long. 65' 00' (811 w. ). -D. Sta. No. 126."
      }
    ]
  },
  {
    "estateGeoid": "1920",
    "estateName": "FRENCHMAN'S BAY",
    "island": "stt",
    "quarter": "4 FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": []
  },
  {
    "estateGeoid": "1942",
    "estateName": "FRYDENDAL",
    "island": "stt",
    "quarter": "4 EAST END",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "frydendal",
        "name": "Frydendal",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Frydendal; Estate 1h mile from north coast of St. Thomas. nnd Wiiter RnY to east. --13. A. 2452; H. 0. 3003; Dan. 265; T. 3778a. \" Fryd \" (joy), w i t h definite article, Fryden + Dnl, valley. Called Friedensdal by Holst."
      }
    ]
  },
  {
    "estateGeoid": "2037",
    "estateName": "FRYDENHOJ",
    "island": "stt",
    "quarter": "1, 2, & 3 REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": []
  },
  {
    "estateGeoid": "1793",
    "estateName": "GREAT ST JAMES ISLAND",
    "island": "stt",
    "quarter": "6A REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": []
  },
  {
    "estateGeoid": "1828",
    "estateName": "GREEN CAY",
    "island": "stt",
    "quarter": "FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "green-cay",
        "name": "Green Cay",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Green Cay; IJriisliy islet, 24 fcet high, 08 yiir(iR long, iirrn 723 sqiinre rods, 200 yards off pnint soutlienst of French RWY, St. l'honi:is. i C ~ i c * l \\ h, tlry o r awash, arcti 13 squiire rods, ealeiid 120 J U ~ Ssouthwest. €r(ini Ureeu Cay. -- 91 of 215 88 U. S. COAST AND GEODETIC SURVEY Named Groen Eylnnd by Van Keulen (1719), rendered Capo Verde in"
      }
    ]
  },
  {
    "estateGeoid": "1811",
    "estateName": "HANSLOLLIK ISLAND",
    "island": "stt",
    "quarter": "10 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1792",
    "estateName": "HASSEL ISLAND / ORKANSHULLET",
    "island": "stt",
    "quarter": "9 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "hassel-island",
        "name": "Hassel Island",
        "type": "cay_or_island",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Hassel Island; About 1 mile long, 170 to 6. 50 yiirds wick, 207 feet high, area 13954 a c w x, or including 3 shore rocks 139. 7 awes; forming western side of St. Thomas Hzirbor. Also known as Orknnshullet IHland."
      }
    ]
  },
  {
    "estateGeoid": "1896",
    "estateName": "HAVENSIGHT",
    "island": "stt",
    "quarter": "6A, 6 FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "havensight-point",
        "name": "Havensight Point",
        "type": "point",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Havensight Point; On east sliorc of St. Thomas lliirbor, 400 yurtls"
      }
    ]
  },
  {
    "estateGeoid": "2002",
    "estateName": "HEERLEIN'S BUY",
    "island": "stt",
    "quarter": "GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2030",
    "estateName": "HOFFMAN",
    "island": "stt",
    "quarter": "2B NEW",
    "quarterGroup": "NEW",
    "features": [
      {
        "entryId": "hoffman",
        "name": "Hoffman",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Hoffman; Estate on 200-foot contour, 220 yards south of Tutu Road at Charlotte Amalia Estate, St. Thomas. -T. 3778."
      }
    ]
  },
  {
    "estateGeoid": "1802",
    "estateName": "HONDURAS",
    "island": "stt",
    "quarter": "KRONPRINDSENS",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "honduras-hill-or-gallows-hill",
        "name": "Honduras Hill or Gallows Hill",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Honduras Hill or Gallows Hill; Knoll, 77 feet high, on isthinus north of Careen Hill, separating St. Thomas Harbor from Crowir Bay. So culled in Lightbourn's Annual, 1921, p. 63."
      }
    ]
  },
  {
    "estateGeoid": "1807",
    "estateName": "HOPE",
    "island": "stt",
    "quarter": "5 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "hope",
        "name": "Hope",
        "type": "quarter",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "Hope; 1':state 23, Prince Quarter, St. ('roix. Covered wrih praw, hushes, and trrws. Danish, Iicstbjerg. \" Ileu\"; same ns Sail Rock. See : Hiighes. (1. v. -2. -- 100 of 215 GEOGRAPHIU DICTION. 4RY OF T R E VIRGIN ISLANDS 97 and a smaller beach 500 yards west is cnlled Salonion Bag. Hull Ray was nrtmed durriaan Ilnusen Bay by Van IZwlen, I-Iansen Bay by Ilflst, Ensomhed Ray by Hornbeck, Lille Nordride Ray hy the 1)nne. l. Little Northside R81. v by uavigntors, and Irlull Bay locally. -'1'. Xi1 r). R. : (1. P. ; 0. I3. Hull I'oint; Local nyme for Troyitco Point, S t. Tlionias. --T. 3771. flumbrry; Error for EIuxnhug, St. C'roix. -Osliolni."
      }
    ]
  },
  {
    "estateGeoid": "1940",
    "estateName": "HOSPITAL GROUND",
    "island": "stt",
    "quarter": "9 NEW",
    "quarterGroup": "NEW",
    "features": []
  },
  {
    "estateGeoid": "1808",
    "estateName": "HULL",
    "island": "stt",
    "quarter": "2, 3, 4, 3, 4B, 4A LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1788",
    "estateName": "INNER BRASS ISLAND",
    "island": "stt",
    "quarter": "6A LITTLE NORTHSIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1787",
    "estateName": "JOHN BREWER'S",
    "island": "stt",
    "quarter": "4, 5 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1824",
    "estateName": "KALKUM CAY",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "2035",
    "estateName": "KINGS' QUARTER",
    "island": "stt",
    "quarter": "KINGS",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1805",
    "estateName": "KRONPRINSENS QUARTER",
    "island": "stt",
    "quarter": "KRONPRINDSENS",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1869",
    "estateName": "LANGMATH",
    "island": "stt",
    "quarter": "REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": [
      {
        "entryId": "langmath",
        "name": "Langmath",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Langmath; Estate a t end of trail branching enst from Turpentine Ave. , same as Longmat, q. v. -Old."
      }
    ]
  },
  {
    "estateGeoid": "2019",
    "estateName": "LERKENLUND",
    "island": "stt",
    "quarter": "2,9 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "lerkenlund",
        "name": "Lerkenlund",
        "type": "estate",
        "island": null,
        "quarter": "KING",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Lerkenlund; Est:)te, on Lerkenlund Hill, overlooking Magens Ray, 480 ytirtls from its southwest shore; mile east of boundary of adjoining Barrett estate. Name derived from Danish \" Imrken \" ( L a r k ), tind \" 1, iind \" (Grove); hence \" Lnrligrovc. '' Holst's manuscript map has h r k e n l u n d; Oldendorp, Lerklund. (lorrupted by ignorant Creoles into \" Let-alone !\""
      },
      {
        "entryId": "lerkenlund-road",
        "name": "Lerkenlund Road",
        "type": "road",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Lerkenlund Road; Joins Dorothen nnd Solberg Roads at 1, 089-foot col. , strikes north % mile. thence east to Lerkenlund, and southeast to Misgen fork, St. Thomas. -T. 3771."
      },
      {
        "entryId": "lerkenlund-hill",
        "name": "Lerkenlund Hill",
        "type": "quarter",
        "island": "stx",
        "quarter": "GREAT NORTHSIDE",
        "confidence": 105,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Lerkenlund Hill; 585 feet high, lat. 18\" 21' (1, 361m. ), long. 64\" 66' (796 in. ); bench on north slope, ?;. mile northeast of Signal Hill, Great Northside Quarter, 9. T. hor, at double rounded point, St. Croix. Croix. -L."
      }
    ]
  },
  {
    "estateGeoid": "2028",
    "estateName": "LILLIENDAL & MARIENHOJ",
    "island": "stt",
    "quarter": "3A, 3 LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": [
      {
        "entryId": "lilliendal",
        "name": "Lilliendal",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 485,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Lilliendal; Variant spelling of Lileindal, q. v. -Zabriskle."
      }
    ]
  },
  {
    "estateGeoid": "2025",
    "estateName": "LINDBERGH BAY",
    "island": "stt",
    "quarter": "4, 4A SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1826",
    "estateName": "LITTLE FLAT CAY",
    "island": "stt",
    "quarter": "SOUTH SIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1812",
    "estateName": "LITTLE HANSLOLLIK",
    "island": "stt",
    "quarter": null,
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1794",
    "estateName": "LITTLE ST JAMES ISLAND",
    "island": "stt",
    "quarter": "6A REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": [
      {
        "entryId": "little-st",
        "name": "Little St",
        "type": "bay",
        "island": "stt",
        "quarter": "WEST END",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Little St. Thomas; Low grassy peninsula, almost a n islet, with two knolls of 21 and 50 feet, joined by n tombola to t h e west end of St. Thomas. Longitude of western extremity, 65\" 02' 32\". -Dan. 1834 :lleichel. Spanish, \" San Tornas Chico. \" Not to be confounded with West C a y; see also Lille St. Thomas Bay."
      }
    ]
  },
  {
    "estateGeoid": "1820",
    "estateName": "LITTLE THATCH KEY",
    "island": "stt",
    "quarter": "8 EASTEND",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1836",
    "estateName": "LIVER POOL",
    "island": "stt",
    "quarter": "FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": []
  },
  {
    "estateGeoid": "1994",
    "estateName": "LOUISENHOJ",
    "island": "stt",
    "quarter": "4, 5, 5A GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1937",
    "estateName": "LOVENLUND",
    "island": "stt",
    "quarter": "2, 8 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "lovenlund",
        "name": "Lovenlund",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Lovenlund; ICstntc. , n i i l c a e, ist-soutiicast of h h g e n y Bay. St. Thoinas. A l e p 3240; H. 0. Chart 3903; U. A. Chart 2452; Lurid, 11-8-92. J, puenlutid; oriKinal Uuuish orthography of Lo\\enlunil. \"-Dan. 265; Ilornbeck : Itrichel."
      },
      {
        "entryId": "lovenlund-bay",
        "name": "Lovenlund Bay",
        "type": "quarter",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Lovenlund Bay; Rocky cove on north shore of Great Northsitle Quarter, St. Thomix, about 2 miles east-southeast of I'icara Point, SO0 yards uorth of Loveuliintl 15statr. V:ii*iuiits : Imwluntl. 1, uvelilund. I, ~venli~ntl. 'l'ht. '' I4~vc~iili~~rd Gallei \" was a fiinious old l'ripute of the Uiiiiirah Xavy in tlje 17th cent ury. -- 124 of 215 GEOORAPEIC D, IC!D, IONARY OF T H E VIRGIN ISLANDS 121"
      }
    ]
  },
  {
    "estateGeoid": "1909",
    "estateName": "LOWER JOHN DUNKO",
    "island": "stt",
    "quarter": "3B, 3C LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1939",
    "estateName": "LYTTON'S FANCY",
    "island": "stt",
    "quarter": "8GC GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1939",
    "estateName": "MAFOLIE",
    "island": "stt",
    "quarter": "8F GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "mafolie",
        "name": "Mafolie",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Mafolie; lhtnte or Pluntntion, with resideuee 011 Mafiilie E i i l l (4. v. ), lorig, 84\" 55' W ' ', blugnjlirent pn~iorani:~ O l w writw: \" T h e whole island is in sight-a perfect gem; its ftic*t>ts aluiost gleaming benekth the intense light of the tropical snn. Drovcn and bare as it is, yet the island has u beauty of an appenling mrt, mid w e delights in the v i ~ i o n sof the dhers of the Virgin Group, rising s t vsryiiig distiuiw. ;, out of the srtpphire sea. \" Lassen's tiescription bn Dnnish is tyiitilly ciitliusinstica. I n 1YS2, D r a i i i n n astrcmomers established station to iibserve Triinhit of Vvnus. During World War, a gun was niouiited in gnrilen, t o protect Ht. Tlioniw Harbor. Name from French, *'Ma Folie *' (My lWly). -Aspinall; Zabriskie; Mnp 3240."
      },
      {
        "entryId": "mafolie-h-i-l-l",
        "name": "Mafolie H i l l",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Mafolie H i l l; 842 feet high, on crest of main Ridge. Ascended by rough path behind Iiotet '' 183, \" St. Tliomns. Commands Ane pmoramic view; cornprisiiig C'ity :ind Ilurbor; westward, Culebra and Viequez; southwest,"
      },
      {
        "entryId": "mafolie-road",
        "name": "Mafolie Road",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Mafolie Road; Connerts T, crkenlnnd and Tmiirelioi Roads. iwst of Mafolic. Estate, St. TIio~nns. -T. 3771. Ascent sturtllngly s t e q i, but view siqrcrb. mile north of St. T l i o m ~ sHaibor. -- 125 of 215 122 U. S. COAST AND GEODETIC SURVEY"
      }
    ]
  },
  {
    "estateGeoid": "2023",
    "estateName": "MANDAHL",
    "island": "stt",
    "quarter": "1 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1997",
    "estateName": "MARIENDAL",
    "island": "stt",
    "quarter": "4, 9 REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": [
      {
        "entryId": "mariendal",
        "name": "Mariendal",
        "type": "estate",
        "island": null,
        "quarter": "REDHOOK",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Mariendal; Estate and School, on western slope of 384-foot hill, east of Turpentine Avenue, 1, 220 yards north of Mangrove Lagoon, in Redhook Quarter, S. T."
      }
    ]
  },
  {
    "estateGeoid": "1800",
    "estateName": "MISGUNST",
    "island": "stt",
    "quarter": "5A, 6 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1870",
    "estateName": "NADIR",
    "island": "stt",
    "quarter": "1, 2 REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": [
      {
        "entryId": "nadir",
        "name": "Nadir",
        "type": "estate",
        "island": "stt",
        "quarter": "REDHOOK",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Nadir; Estate on slopes of Nadirberg or Nadir Ridge, in Redhook Quarter. 400 to COO yards north or east of Mangrove Lagoon, St. Thomas. Map 3240, with Zabriskie, locates settlement east of forks of Turpentine Avenue with Bdongo Road and Redhook Road; most charts, a t south shoulder of Ridge : Iteichel, on Saltgut Cove, immediately east."
      },
      {
        "entryId": "nadirberg",
        "name": "Nadirberg",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Nadirberg; Nadir Ridge, 330 feet high, summit 7% yards north of northern entrance to Mangrove Lagoon, St. Thomas."
      }
    ]
  },
  {
    "estateGeoid": "2038",
    "estateName": "NAZARETH",
    "island": "stt",
    "quarter": "1, 3, 4 REDHOOK",
    "quarterGroup": "REDHOOK",
    "features": [
      {
        "entryId": "nazareth",
        "name": "Nazareth",
        "type": "estate",
        "island": "stt",
        "quarter": "REDHOOK",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Nazareth; Estate or Mission, on crest of isthmus between Vessup Bay and Nazareth Bay, overlooklng latter, In Redhook-Quarter, St. Thomas."
      },
      {
        "entryId": "nazareth-bay",
        "name": "Nazareth Bay",
        "type": "bay",
        "island": "stt",
        "quarter": "EAST END",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Nazareth Bay; 625 to 700 yards wide, west of Beverhout Point, northeast of Jersey Bay, on south shore, and 1% miles from east end of St. Thomas Island. --G), B."
      }
    ]
  },
  {
    "estateGeoid": "1786",
    "estateName": "NELTJEBERG",
    "island": "stt",
    "quarter": "6 LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": [
      {
        "entryId": "neltjeberg",
        "name": "Neltjeberg",
        "type": "estate",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Neltjeberg; Estate, at or near a coconut grove or cocal, long. 64\" 68'. southwmt of Ryn or Ruy Point, and east of Turrel Bay, In Little Northside Quarter, northern shore of St. !&omas. (Not Neiliberg or Ne1tikrg)G. B. ; Z. Name of Estate from that of Hill. Magens Plantage iocnted here by Oldendorp."
      }
    ]
  },
  {
    "estateGeoid": "1911",
    "estateName": "NEW HERNHUT",
    "island": "stt",
    "quarter": "5 NEW",
    "quarterGroup": "NEW",
    "features": [
      {
        "entryId": "new-hernhut",
        "name": "New Hernhut",
        "type": "unknown",
        "island": "stt",
        "quarter": "NEW",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "New Hernhut; Property, New Herrnhut, St. Thomas. -B. & F. ; Knor, p. 160."
      }
    ]
  },
  {
    "estateGeoid": "1796",
    "estateName": "NISKY",
    "island": "stt",
    "quarter": "6 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "nisky",
        "name": "Nisky",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Nisky; Mopavian Mission-station end Plantation, on northeastern foot of 2 4 8 foot Hill and along eouth side v i Mosquito Bay Road, where it cro8ses gap between hills west of Qregerie Bay, on south of St. Thomas. Mission founded, 1755; preaching I hem, 17@3. -St. Thomas Almanack (1878);"
      }
    ]
  },
  {
    "estateGeoid": "1921",
    "estateName": "NULLYBERG",
    "island": "stt",
    "quarter": "4 NEW",
    "quarterGroup": "NEW",
    "features": [
      {
        "entryId": "nullyberg",
        "name": "Nullyberg",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Nullyberg; Nulliberg, St. Thomas. --Holst."
      }
    ]
  },
  {
    "estateGeoid": "1789",
    "estateName": "OUTER BRASS ISLAND",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1832",
    "estateName": "PATRICIA CAY",
    "island": "stt",
    "quarter": "FRENCHMAN BAY",
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "patricia-cay",
        "name": "Patricia Cay",
        "type": "cay_or_island",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Patricia Cay; M mile long, covering 55. 4 acres, chiefly a mangrove swamp, immediately sonth of Bovoni Qay, and terminating in a 75-foot knoll or humpel at Patrick Point, &. Thomas. Pat-, Punfa; Spanish name of Patrick PoInt, St. Thomas. -Derrotero, p. 278."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "PEARL",
    "island": "stt",
    "quarter": "2, 7A SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "pearl",
        "name": "Pearl",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Pearl; Estate, 38, 43, e, Qneen (Dronning) Quarter, St. Oroiat: emtsaciag 3, 000 feet square, southwest of intersection of Seuthside and Canegarden Roads, with strip 1, OOO feet wide to Canegarden Bay, southera coust. Abraham Heyliger's Plantage."
      }
    ]
  },
  {
    "estateGeoid": "1813",
    "estateName": "PELICAN CAY",
    "island": "stt",
    "quarter": null,
    "quarterGroup": "FRENCHMAN_BAY",
    "features": [
      {
        "entryId": "pelican-cay",
        "name": "Pelican Cay",
        "type": "cay_or_island",
        "island": "stj",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Pelican Cay; Northernqost of American Virgin Islands, 19 Yet high, 220 yards long. area 4. 5 acres; low, rocky; 110 yards off north shore of Little HansIdllik I. Frequented by pelicans, hence name. Kropgie, a local synonyni. Udtog. Nordoe, Danish, NordG, pleana North Island. Net to be confused with another Pelican Island, 2 miles east of St. John, in British seCtioi1. L G. B. This Cay had no ofBcid name till ghrisbnd by the Uoasl nndA3err detic Survey; but was descrlbed in the Derrotero as, \"Is3otillu; bajo y peAa, scoso\", (an Islet, low and rocky)\";, having at thb north a reef (\"Escollo)\". Latitude of north point, 18\" 26' 0246\"."
      }
    ]
  },
  {
    "estateGeoid": "1992",
    "estateName": "PERSEVERANCE",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "perseverance",
        "name": "Perseverance",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Perseverance; Estate, near nqrthwestern bead of, Perseverance Bay, St."
      },
      {
        "entryId": "perseverance-bay",
        "name": "Perseverance Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Perseverance Bay; Deep angle in south coa$t, West of. Black Point, St. Thomas, about 1 mile wide, forming head of $ouUlwest Road, Natural weatern limit seems at G. P, \"High, \" @levat@rj30 mt, 1, 7N yards from Blaes"
      }
    ]
  },
  {
    "estateGeoid": "1872",
    "estateName": "PETERBORG",
    "island": "stt",
    "quarter": "2, 12 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2036",
    "estateName": "QUEENS' QUARTER",
    "island": "stt",
    "quarter": "QUEENS",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1996",
    "estateName": "RAPHUNE",
    "island": "stt",
    "quarter": "5B, 5BA NEW",
    "quarterGroup": "NEW",
    "features": []
  },
  {
    "estateGeoid": "1867",
    "estateName": "ROSS",
    "island": "stt",
    "quarter": "8, 8A NEW",
    "quarterGroup": "NEW",
    "features": []
  },
  {
    "estateGeoid": "1840",
    "estateName": "ROTTO CAY",
    "island": "stt",
    "quarter": "RED HOOK",
    "quarterGroup": "REDHOOK",
    "features": []
  },
  {
    "estateGeoid": "1835",
    "estateName": "SABA ISLAND",
    "island": "stt",
    "quarter": "SOUTH SIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1823",
    "estateName": "SALT CAY",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "2000",
    "estateName": "SANTA MARIA",
    "island": "stt",
    "quarter": "1 WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "santa-maria",
        "name": "Santa Maria",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Santa Maria; Estate a t southeast corner of south cove of S. Maria Bay, a o cording to Dewitz and Reichel; 'but 1, 080 yards east-southeast, a t f370-foof contour, according CO T. 3770. \" Santa Maria &state, Old Works, '' there shown on Map 8240. S. Maria on B. A. Chart 2 6 2; also spelled, St. Marie."
      },
      {
        "entryId": "santa-maria-hill",
        "name": "Santa Maria Hill",
        "type": "estate",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Santa Maria Hill; 639 feet high, 290 yards northwest of Santa Maria Estate, crest of sharp ridge extending 1, OOO yards northwest to Santa Maria Point, Westend Quarter, St. Thomas. U. P. , \" M a r i a \"; lat. 18\" 21' 42\" (1, 294 meters), long. 64\" 50' 16. 4'' (482 meters)."
      },
      {
        "entryId": "santa-maria-bay",
        "name": "Santa Maria Bay",
        "type": "quarter",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Santa Maria Bay; 1 mile wide, between Yluck Point and Stumpy Point, 2 miles east of Westend Qoint, 'in Westend Quarter, north &@re of St."
      },
      {
        "entryId": "santa-maria-ridge",
        "name": "Santa Maria Ridge",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Santa Maria Ridge; Extendfag aoutheast from Santa Maria Point, l, W yarda to Santa Maria Hill, 639 feet high, thence along watershed to Santa Maria Estate \" old works. \""
      }
    ]
  },
  {
    "estateGeoid": "5646",
    "estateName": "SAVANA ISLAND",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "savana-island",
        "name": "Savana Island",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Savana Island; 260 feet Bigh, 1 mile long,"
      }
    ]
  },
  {
    "estateGeoid": "1941",
    "estateName": "SMITH BAY",
    "island": "stt",
    "quarter": "1, 2, & 3 EAST END",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "smith-bay",
        "name": "Smith Bay",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Smith Bay; Indentation, 1, 200 yards wide, between Footer Point and Cabes"
      },
      {
        "entryId": "smith-bay-road",
        "name": "Smith Bay Road",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Smith Bay Road; Parallel to northeast coast for 1, 640 yards, between forks to beach a t Water Bay and Smith Bay, St. Thomas. -T. 3778a."
      }
    ]
  },
  {
    "estateGeoid": "2021",
    "estateName": "SOLBERG",
    "island": "stt",
    "quarter": "1,2,6,9,12 LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": [
      {
        "entryId": "solberg",
        "name": "Solberg",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Solberg; Estate and Mill, on bench of Rfdge, 946 or Q97 feet high; lat. 18\" 21' 07\" (210meters), long. Ma56' 46\" (1, 343meters); 540 yards south-southwest of Signal 8111, $4. Thomas. -Aspinall; Horhbe'ck : Rohde. Solberg Road8 From junction of Dorothen and LerKenlund Roads at 1, 089 feet, col, descends south rrlope past Solberg Mills to French WI11. Route from Mafolie west over Lerkenlund Road, passing St. Peter, returning to St. Thomas City via Llllendal, Solberg, and Freneh Hill, is unsurpassed for charming character o f Menem and g1tW m d view of most fertile part of St. Thomas Island. -Aspinall."
      }
    ]
  },
  {
    "estateGeoid": "1816",
    "estateName": "SORGENFRI EASTERN PORTION",
    "island": "stt",
    "quarter": "1 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1815",
    "estateName": "SORGENFRI WESTERN PORTION",
    "island": "stt",
    "quarter": "1 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2034",
    "estateName": "ST JOSEPH & ROSENDAHL",
    "island": "stt",
    "quarter": "4 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "5631",
    "estateName": "St",
    "island": "stt",
    "quarter": "3A, 3 LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": [
      {
        "entryId": "st",
        "name": "St",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 180,
        "reasons": [
          "exact estate name",
          "same island"
        ],
        "description": "St. ('roix. --Oxholm; Dewitx; 11. 0. 1409, 1423. '' Lnrkgrove \"; snme as Lerkenlund, St. Thomas. -Holst. . Lnpointe. garden nny, St. Croi x. --'L. Bellin. 106034\"-25----S -- 113 of 215 110 U. S. COAST A N D GEODETZC SURVEY"
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 180,
        "reasons": [
          "exact estate name",
          "same island"
        ],
        "description": "St. Croix Deep; Chasm or great submerged fniflt valley, severing St F f ~ l x from the Virgin Rank, with depths of 2, 410 to 2, 580 fathoms; 22lh milell south of St. Thomas. A downthrown block lies within the chnsm. Deckert; Voughan. Called In Danish \" Indmnkhirrg. '\" @. Cr&; Hybrld Catln ham!?? of St. CroPx, Wed in 6 e m n by Dewftd. saint Cuyaous Bay; 520 yards wide, with fine sand beach, west of poral. reef at Lagoon Point; mutheastarn portion af Johnson Bay, St. John. I m l name said to be pronounced Kwakus; pefhapa 8%pasfje@ive, ECPP&u'a The -- 170 of 215 QEOGRAPHIU DICTIONARY, OF-THE VIROINISLANDS 1. 07 Creole proverb, '6Rwalzu blows fire, \" refers to a legendary braggart by this name. No \"St. Cuyacus\" in any church calendar. Called also Johnson Bay."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "unknown",
        "island": "stt",
        "quarter": "KING",
        "confidence": 180,
        "reasons": [
          "exact estate name",
          "same island"
        ],
        "description": "St. Thomas; Cityi spokt, poBt otnce, cnble station, chief and only incorporated town on St. Thomas Island, and seat of government of t h e Vlrgin lslanda of the Uaitcd States. St. Thomas lies 40 miles east of Fajardo and 70 miles from S i n Juan, Porto 'Rlco; 1, 442 miles south 20\" east from New Pork. The town lies along the north shore or head of St. Thomas Harbor, on t h e e 16m spurs of the Island Ridge, dubbed by sailors '' Foretop, Malntop, ' and Mizzentop \" :but on the recent map named '' French H111, Berg Hill, alld Governmelit Hill. \" Fredericksberg or ' I Bluebeard Hill \" marks the enitern limits. After abortive attempts at settlement by the Dutch in 1657 -- 172 of 215 GEOGRAPHIC DU)TIQNABX 03 \"BE VJROIN ISLANDS and the Danes in 1866 (we \"St. Thomas; Jaland\") &Tereens' expedition established permanent colonp la 1672. Christiansfort was erected; about a sailors' inn m d tqhouse\" arose @ village (Dorp, Qorf), later becomLng \" the city '' (Byen), long vulgarly cellf$b Taww \" (Taphus, Taphys, Taphuis, Zapfhavs, Wlrtshaus), but uhristened by King Christian V, In honor of his. qmswt, egF Royal IlQhness I' Charlotte Amalia. \" \"Amalienborg\" was the ofilc&%1lpused briefer s y n ~ m. Thp w a h r n section was called '' Bzandenborgeri \"; the free-negro quarier, \" Wukasa. \" But wpular usage established the name S ~ b tTppomw, \" w w h was finally adopted for the p t oflce, by the U. S. (JqograpQlc Board, January 6, 192t. , Charlotte Amalia had been made p free part, 3750-1784, and Arospened, tbough flre-swept in 1804 and 1808. The peak @, Its prasneritJr was in 1821 to 1830, just before the era of shepa, navigatlon. Aqqong obj@ qf interest are the two congpicuoua towerg, p a p w l y knowa a8 Biuewqd Cas* aiid"
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "St. Jahn. -0sholm; B. A. 2452; Dan. 265; map 3241. Name probably a corruption of Menebek. Northwest entrance of bay is a broad rocky angle, to which h a s been applied the name Mennebeck or Menebek Point; lat. 18\" 21' 38. 4\" (1, 180 m. ), long. 64\" 41' 16. 5\" (457 m. ). -G. B. , Dec. 1924."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "St. Mary Bay; Santa Mmin or Tallard Bay. -Dan. 80."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "hill",
        "island": "stx",
        "quarter": "KING",
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. Croix; innin auis, Kingshill liitlge, q. Y. , prolonged north by I * o l l i n ~ hills to Prc. tlenstior;. , total length, 2 miles; with swttered hills, including Clifton Hill, 219 feet high, castward 11h iniles to I-lope Estuteliousr. -()uin,"
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. Croix. Entire tract in grass; fruit trees in two dales. Reached by roads from Little Grange and William Estate. Mill and house on 688-foot hill, part of broken ridge, reaching from Oxford Hill to northern part of William Estate. G. P. , \"Pull. \""
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. Croix. Two small cane-patches; remainder bush and grciss. Old plantage of Frederik Christian I-Ieltrnnu; in recent ycurg, ullltecl with -- 83 of 215 80 U. 5. COAST AND GEODETIC STJRVEY Wheel-of-Fortune. Danish name, meaning \" Frederik's Hope ''; rilso spelled \" E'rpderiks Haab, \" \" Freiderichs I-Iaab. \"-Map 3242; Mi Ilsgiiuph."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. Croix. -Dewitz; €. I. 0. 1423. Plantage of Nicwlny Snlomon. -Bwk. Misspelled : Hambug, IIumbng. Ruildirtgs on UWfoot rise in soutlieast. E:wt half in sugnr c:ine; remainder, bush :ind gmss."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "quarter",
        "island": "stx",
        "quarter": "KING",
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. Croix. -Oxholni; L. & W. Located by Dewitz in King Quarter. Culled by Oldenrlorp, Irwins Plantage, after John Irvin, proprietor (1754)."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. George Beck; in weaterfi part of Prince Quarter, St. Croix. -T. 3798. B l v i e ~; 17th century French plantatlon, in valley southwest of Gallows Bay, St. crolx. -L IIIlsgen; ' Estate, near 763-foot Hill, 500 yards south of Magens Bny, St."
      },
      {
        "entryId": "st",
        "name": "St",
        "type": "quarter",
        "island": "stj",
        "quarter": "PRINCE",
        "confidence": 115,
        "reasons": [
          "exact estate name",
          "different island penalty"
        ],
        "description": "St. John Bay; probably same as Cooper Bay, Prince Quarter, St. Croix. Manuscript legend on copy of Laurie & Whittle's map erroneougly ldentifies Saint-*Jean Bay with King Bay."
      }
    ]
  },
  {
    "estateGeoid": "1806",
    "estateName": "STAABI",
    "island": "stt",
    "quarter": "9A GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1844",
    "estateName": "SUBBASE/CROWN BAY",
    "island": "stt",
    "quarter": "6 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "crown-bay",
        "name": "Crown Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Crown Bay; Cove on south shore of St. Thomas, northwest of Careen Hill."
      }
    ]
  },
  {
    "estateGeoid": "1856",
    "estateName": "TAARNEBERG",
    "island": "stt",
    "quarter": "KINGS",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1915",
    "estateName": "TABOR & HARMONY",
    "island": "stt",
    "quarter": "5 & 6 EAST END",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "tabor-and-harryvilld",
        "name": "Tabor and Harryvilld",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Tabor and Harryvilld; Estate between Sunst Bay and 614-foot Hill (Mount Tabor?) at fork of Mandal Road, % nille southwest, St. Thomas-Rolst."
      }
    ]
  },
  {
    "estateGeoid": "1819",
    "estateName": "THATCH CAY",
    "island": "stt",
    "quarter": "8 EASTEND",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1895",
    "estateName": "THOMAS",
    "island": "stt",
    "quarter": "6F, 6, 6C 6E, 6K, 6B, 6H, 6I NEW",
    "quarterGroup": "NEW",
    "features": [
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Thomas. -Oldenc'lorp; Hornbeck; Dan. 265; B. A. 2452. Also epellcd, Misgunst. Mi~gunat; Same as Miggen Estate, St. Thomas. -Z."
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Thomas; 80 designated In Bellin's Atlns, I, 78; French phrase, signifying eimply, '' Landlng for Boats. \" I n Spanish Derrotero, p. 278, described as -- 134 of 215 GEOGRAPHIC DICTIONARY OF TELE VIRGIN ISLANDS 131 \" Buen Desembarcadero en la Pequefla Ensenada de su Costa 0. \" (Good landing in the small cove on its west shore. )"
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Thomas. -Reichel; Hornbeck; Dewitz. Canebay Estate, St. Croix-L. Local name. -Map 3241."
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Thomas. Named for a colonial family; also spelled Bordeau and Bourdeaux. Buddhoe or Bordeaux, was the negro general of the slave insurrection of 3848, which won emancipation in St. Croix. -Taylor."
      },
      {
        "entryId": "thomas-harbor",
        "name": "Thomas Harbor",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Thomas Harbor; the \" best harbor in Lesser Antilles \" (De Booy & Faris, p. 139), and capable of even greater improvement by breakwaters: but within easy gun-range from Tortola. Branches into Coral Harbor, Hurricane Hole, and Round B a y. 4. P. Variants : Coralbay, Corallbay, Corral Bay, Bahia del Coral, Craal Bay, Crawl Bay, Kraal Bay. Good survey by H. M. 5. Scorpion, in 18Gl."
      },
      {
        "entryId": "thomas-i",
        "name": "Thomas I",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Thomas I. ; formerly called \"Tallard Bay, \" q. v. On south side of hay thus defined, i s an inner circular cove, Saata Maria Bay, properly so-called, 500 to 600 yards wlde, with a landing at Qley ( 7 Ole) in southeastern bend. Variant forms: St Marip, St. Mary, Marie."
      }
    ]
  },
  {
    "estateGeoid": "1810",
    "estateName": "THOMAS - LONG BAY",
    "island": "stt",
    "quarter": "KINGS",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "long-bay",
        "name": "Long Bay",
        "type": "bay",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Long Bay; East cove of St. Thomas Harbor. Southeast shore formed by WtbstIndia Dock, northeast shore called LongBay 13each. In Danish, Lnngbuy or Longbay; French, Bnie Longue; Spanish, Bahia Larga. Td, ongR o y; Common nnme of Stalley Bay, south shore of St. Thomas. -T. 377%. Much duplicated."
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Thomas. -Oldenc'lorp; Hornbeck; Dan. 265; B. A. 2452. Also epellcd, Misgunst. Mi~gunat; Same as Miggen Estate, St. Thomas. -Z."
      }
    ]
  },
  {
    "estateGeoid": "1809",
    "estateName": "THOMAS - SUGAR ESTATE",
    "island": "stt",
    "quarter": "6A NEW",
    "quarterGroup": "NEW",
    "features": [
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Thomas. -Oldenc'lorp; Hornbeck; Dan. 265; B. A. 2452. Also epellcd, Misgunst. Mi~gunat; Same as Miggen Estate, St. Thomas. -Z."
      }
    ]
  },
  {
    "estateGeoid": "1834",
    "estateName": "TURTLE DOVE CAY",
    "island": "stt",
    "quarter": "SOUTH SIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "2027",
    "estateName": "UPPER JOHN DUNKO",
    "island": "stt",
    "quarter": "3A LITTLE NORTH SIDE",
    "quarterGroup": "LITTLE_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1790",
    "estateName": "WATER ISLAND",
    "island": "stt",
    "quarter": "10 SOUTHSIDE",
    "quarterGroup": "SOUTHSIDE",
    "features": [
      {
        "entryId": "water-island-anchorage",
        "name": "Water Island Anchorage",
        "type": "point",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Water Island Anchorage; Approach to West Gregerie Channel, under west side of Water Island, for over ?4 mile offshore: excellent for deep-draft vessels, in 0 or 10 fathoms; Flamingo Point bearing lao, Careen Hill Ma, St. Thomas City, o g e n. 4. P. , p. 129."
      }
    ]
  },
  {
    "estateGeoid": "1822",
    "estateName": "WEST CAY",
    "island": "stt",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "west-cay",
        "name": "West Cay",
        "type": "cay_or_island",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "West Cay; Double Island, ?4 mile long, W mile wide, area 40. 3 acres: lylag northwest of Westend Point, St. Thomas; separated from Little St. Thomas only by a boat-chonnel, Big Current Hole. The northern hill has a double mmmlt; altitudes, 121 and 190 feet, respectively; the southern hill Imr 114 -- 200 of 215 aEOaFLAPHIC bICTIONABY OF THE VEQIN ISLANDS 197 feet hlgh. The two segments are joined by a low wind-neck SB yards across, forming the common beach of two coves, the southern of which afforda a landing. Name written bp Hornbeck, Weetkey."
      }
    ]
  },
  {
    "estateGeoid": "2033",
    "estateName": "WINTBERG",
    "island": "stt",
    "quarter": "3 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": [
      {
        "entryId": "wintberg",
        "name": "Wintberg",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Wintberg; Ruined Estate, on col of mnin ridge of St. Thomas, a t 710 feet elevation, lat. 18\" 20' 58\" (1, 776 meters), long. 64\" 54' 13\" (882 meters); 6OQ yards northeast of Wintberg P e a k. 4 R. 73600-49; T. 8771. Leas correctly, Winberg, Windberg. Named for colonial family De Wint; several members on record: Oerd, Ian, Anna, etc."
      },
      {
        "entryId": "wintberg-peak",
        "name": "Wintberg Peak",
        "type": "hill",
        "island": "stt",
        "quarter": "GREAT NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Wintberg Peak; 977 feet high, 1 mile east-northeast of St. Thomas Harbor, on main ridge and boundary between Great Northside and New Quarters. Named for colonial family De Wint. Spelled Windberg by De Booy and"
      },
      {
        "entryId": "pic-de-wintberg",
        "name": "Pic de Wintberg",
        "type": "hill",
        "island": "stt",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Pic de Wintberg; Wintberg Peak, St. Thomas. -French chart 2312."
      },
      {
        "entryId": "wintberg-mad",
        "name": "Wintberg mad",
        "type": "road",
        "island": "stt",
        "quarter": "NEW",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Wintberg mad; 3, 100yards long, turns north from Tutu Road between New Herrnhut and Charlotte Amalia, passes Wintberg, and continues to Mandal, St. Thomas. -T. 3771 and 3778a."
      }
    ]
  },
  {
    "estateGeoid": "1995",
    "estateName": "ZUFRIENDENHEIT",
    "island": "stt",
    "quarter": "5 GREAT NORTHSIDE",
    "quarterGroup": "GREAT_NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1923",
    "estateName": "A PIECE OF LAND EAST",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1947",
    "estateName": "ALL FOR THE BETTER",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1747",
    "estateName": "ALLENDALE (BOG OF ALLEN)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1683",
    "estateName": "ALTONA",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "altona-hill",
        "name": "Altona Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Altona Hill; Applied to either of two eminences south of the lagom and on the estate so called; the western, 1S5 feet high, nearest the estate house, ; and th8 eastern, 178 feet high, locally so kmwn, site of old French plantage Guillarmet."
      }
    ]
  },
  {
    "estateGeoid": "1845",
    "estateName": "ALTONA (FORT LOUISE AUGUSTA)",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1709",
    "estateName": "ANGUILLA",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1764",
    "estateName": "ANNABERG & SHANNON GROVE",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "annaberg",
        "name": "Annaberg",
        "type": "estate",
        "island": "stx",
        "quarter": "KING",
        "confidence": 520,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Annaberg; Estate, King Quarter, St. Croix, occupying south % of trtlct 28, and south ?. !! of east VZ of 27 (i. e. , 27h) : % mlle northwest of Krause Lagonn. Two hills of over 100 feet elevation rim on Estate; the higher, Annnherg Hill, 117 feet. I'ropcrty of \" Ohrist. rrleut. Krause '' (1754), who also owned Carsmuw Hall, Krause Lagoon, and Krause Peninsula. Attached to Angui1la. -BcorpCon."
      },
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 210,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      },
      {
        "entryId": "annaberg-point",
        "name": "Annaberg Point",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Annaberg Point; Curving bluff, rising to %-foot knoll, 350 yards northeast of Annaberg Mill, on northern shore of St. Zoha I s l a n d. 4. P. See Masonic Point and Drim Bay. Several authors associate this spot with a tragic legend, disputed by Westergaard; which recounts that, after the slave revolt of 173. 7 and massacre of the whit@ population, the blacks held possession for six months, but were hunted through the forest, and the 300 survivors were here rounded up in 1734 by 400 French troops from Martinique. After a feast, the slaves shot one another, destroyed their guns, and the remnant in despair leaped off this hluff."
      }
    ]
  },
  {
    "estateGeoid": "1713",
    "estateName": "ANNALY",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "annaly",
        "name": "Annaly",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Annaly; Estate, with extensive wttlement, a t source of Gut between Annaly Hill and Oxford Hill, a t junction of 5 Roads, viz. , Crequis, Springgarden, Bodkin, Annaly S. , and Oxford. Danish \" Ly '' means '' shelter ''; as f f \"Anna Lee. \" Also spelled, Annally. Tracts 18 and 7, Northside A, st. Crofx, property (1754) of Nicholas Tuite; tracts 29 and 19, of Laurence Bodkin, extendtng down Annaly Gut to Annaly Bay on north coast, St. Croix."
      },
      {
        "entryId": "annaly-bay",
        "name": "Annaly Bay",
        "type": "quarter",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Annaly Bay; 175 yards wide, about long. 64\" til', Northside Quarter, St, Cro1x. -Map 3242. -- 30 of 215 GEOQRAPHIC DICTIONARY OF THE VIRffIN ISLANDS 27"
      },
      {
        "entryId": "annaly-hill",
        "name": "Annaly Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Annaly Hill; 702 feet high, at northeast of Annaly Estate, on Bodkin Road"
      },
      {
        "entryId": "annaly-school",
        "name": "Annaly School",
        "type": "road",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Annaly School; On. Oxford Road, at foot of Oxford Ridge, west edge of"
      }
    ]
  },
  {
    "estateGeoid": "1879",
    "estateName": "ANNAS HOPE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "-1",
    "estateName": "BARREN SPOT (EAST)",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "barren-spot",
        "name": "Barren Spot",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Barren Spot; Estate in St. Croix. See : Barrenspot. -Dewitz : Zahriskie; Quin."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BARREN SPOT (WEST)",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "barren-spot",
        "name": "Barren Spot",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Barren Spot; Estate in St. Croix. See : Barrenspot. -Dewitz : Zahriskie; Quin."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BECK'S GROVE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      }
    ]
  },
  {
    "estateGeoid": "1885",
    "estateName": "BEESTON HILL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "beeston-hill",
        "name": "Beeston Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Beeston Hill; Estate, coniprising most of tract 6 and portion of 33, in Company Quarter, St. Croix : on brow of most-easterly bench of Bulowminde"
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BELLEVUE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "bellevue",
        "name": "Bellevue",
        "type": "unknown",
        "island": "stt",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Bellevue; Estatehouse and landing, nenr bench of cove 1. 10 yards wide, on e a s t shore of St. Thomas Harbor, opposite Rupert liock, and 330 yards northnorthwest of Bellevue or Lisenlund IIill. -Lawranc~."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BETSY'S JEWEL",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "betsy-s-jewel",
        "name": "Betsy's Jewel",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Betsy's Jewel; Estate, 12, patented to Jacob Boffron, just east of Canaan; settlement on gut in southwest corner. Mill indicated on old maps in southeast corner on south shoulder of 613-foot hill; Northslde B Quarter, St. Croix. I n 1864. with Canaan, constituted Skelton estates. feet. See: Adventure Hill. on ridge between Jealousy and Bethlehem Bseks. -L. & W. north of Centerline Road. -L. & W. -- 38 of 215 QEWRAPHIC DICTIONARY OF THE VIRGIN ISLANDS 35"
      }
    ]
  },
  {
    "estateGeoid": "1781",
    "estateName": "BETTYS HOPE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "-1",
    "estateName": "BLESSING",
    "island": "stx",
    "quarter": "KINGS",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "blessing",
        "name": "Blessing",
        "type": "estate",
        "island": "stx",
        "quarter": "SOUTHSIDE",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Blessing; Estate 30 and 31, King Quarter, on Southside Road, St. Croix. Dewitz. Also callecl, \" The Blessing. \"-T,. & W. ; H. 0. 1423; \" the Blessing. \"-Oxholm. Original owner, Martin Meyer. -Beck. I n 1861, with Anguilla, Spaniphtown, and Annaberg, owned by E. R. Tinling. 1 Traditionally occupied as headquarters of the celebrated buccaneer and deepdsed neoiindrel, John Teach, alias '' Blackheard \" : described in Tom Crlngle's Log, as ' I The mildest-manner'd man that ever scuttled ship or cut a throat: with RiiCh true breeding of a gtmtleman, you never could discern his thought. Pity he loved adventurous life'a variety; he was 80 great a loss to good eociety. \" For amuwment, he would imprison his crew in the ship's hold. and half suffocnte them with brlmstonematch fumes, or would extinguish the cabin candiw4 and hlnze away at random wlth hia pistola. IIe had 14 wives. He was kflled ln a desperate encounter with the frigates Lime and Pearl. -- 40 of 215 GEOGRAPHIC DICTIONARY OF THE MRaIN ISLANDS 37"
      }
    ]
  },
  {
    "estateGeoid": "1725",
    "estateName": "BODKIN",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "bodkin",
        "name": "Bodkin",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Bodkin; Estates of Lnurence lhdltin, who in 1754 owned: tracts 11 and 19 In"
      },
      {
        "entryId": "bodkin-hill",
        "name": "Bodkin Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bodkin Hill; 9Wd feet high, lat. 17\" 38' 12. 44\" (379 m. ), long. 64\" 50' 20. 94\" (618 m. ); peak of grassy ridge along western limit of Bodkin Estate in Northside A Quarter, St. Croix. -Eygers; T. 3798. Waterparting of Northside, Westend, and Southdope drainage. *"
      },
      {
        "entryId": "bodkin-r-i-d-e",
        "name": "Bodkin R i d e",
        "type": "quarter",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Bodkin R i d e; Spur (Udlllb) extending from Bodkin Hill souih about 1 mile along boundary between Stewart and Rodkiu Estates in Norbhside A Quarter, St. Croix, nncl south into Prince Quarter, continuiug as Montpellier Mountain. F o r 1, OOO yards, crest rises above 900 feet, with three peaks of !M3, 992, and 982 feet elevation, respectively. B'nrnel Hill is a northerly spur, and Mt. Stewart is 3/r mile west on maiu watershed."
      },
      {
        "entryId": "bodkin-bakker",
        "name": "Bodkin Bakker",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Bodkin Bakker; Danish, \" Bodkin Hills \" or Ridge, St. Cro1x. -Eggers."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BODY SLOB",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "-1",
    "estateName": "BOETZBERG",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "boetzberg",
        "name": "Boetzberg",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Boetzberg; Buteburg Estate, St. Croix. -Zabriskie."
      }
    ]
  },
  {
    "estateGeoid": "-1",
    "estateName": "BONNE ESPERANCE (NORTH)",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "-1",
    "estateName": "BONNE ESPERANCE (SOUTH)",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1751",
    "estateName": "BROOKS HILL",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "brook",
        "name": "Brook",
        "type": "estate",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 110,
        "reasons": [
          "estate name contains entry name",
          "quarter agreement"
        ],
        "description": "Brook; Estate, 29 in Westend Qu:it'trr, St. Crolx. Deeded to Cornelius Kortrrk (1754), named \" the brook \" on Oxliolm's map, \" The Brook \" by L. & W. Now overgrown with grass, thickets, and trees, and attached to Beck Grove Estnte."
      }
    ]
  },
  {
    "estateGeoid": "2042",
    "estateName": "BUCK ISLAND",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "buck-island",
        "name": "Buck Island",
        "type": "point",
        "island": "stt",
        "quarter": "WEST END",
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Buck Island; 110 feet high, YJ mile long, area 41. 55 acres; western and larger of Capella Cays, 2 miles south of St. Thomas Island. Light on white, square tower, 136 feet above low water; lat. 18\" 16' 48\", long. 64\" 53' 35\". Summit called by Bellin, I' Montagne Rouge \" (Rouge or Red Hill); Cove at west end, \" Mouillage pour les Barques \" (landing for the Boats, Mouillage Cove). The Spanish Derrotero describes the island a s partially covered by Matorral \" (heath); and mentions the '' Restinga \" (ledge) extending 100 yards off west point. Hest derives the island's name from its having been tenanted only by a few very wild \"Gedebukker\" (Buckgoats); whence, Dutch \" Boken \" or '' Bokken Eyland. \" Easterly companion island, severed by 60-yard passage, loosely regarded as portion of"
      },
      {
        "entryId": "buck-island-bar",
        "name": "Buck Island Bar",
        "type": "cay_or_island",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Buck Island Bar; Extension of Buck Island Reef; coral bank sweeping around 1 mile north of Ruck Islitnd, St. Croix, forming beaklike spit, 1% miles long, east-west; shallow patches continuing southeastward 1% mI1es. H. 0. Publ. 129."
      },
      {
        "entryId": "buck-island-channel",
        "name": "Buck Island Channel",
        "type": "point",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Buck Island Channel; 1% miles wide, between Buck Island with its adjacent reef8 and the north coast of St. Croix. Depths: at 1 mile west of Buck Island, 41h fathoms; from % mile south of west point to % mile south of east point, 7 fathoms or more; affording good warship anchorage. Spanish names: La Pasa de la Isla Buck; Fondeadero a1 Sudoeste de In Isla Buck."
      }
    ]
  },
  {
    "estateGeoid": "1745",
    "estateName": "BUGBY HOLE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "bugby-hole",
        "name": "Bugby Hole",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Bugby Hole; Estate, east-central part of Company Quarter, St. Croix: comprising tract 20 east % (P. Heyliger, sr. ), 21 south ?, $ (H. Helm's widow), 21 north y2, and 23 north % of west 1/2 (James Hansen)."
      }
    ]
  },
  {
    "estateGeoid": "1883",
    "estateName": "BULOWS MINDE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1886",
    "estateName": "BURNS HILL",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1661",
    "estateName": "BUTLER'S BAY",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1841",
    "estateName": "CALDWELL (KARAVAL)",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1888",
    "estateName": "CALEDONIA",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "caledonia",
        "name": "Caledonia",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Caledonia; Estate on south side of Caledonia a u t, about confluence of largest south tributary, on Cunningham Plantage, tract 83, Northside A Quarter, St. Croix. -H. 0. 1423. feet high, off east point of Savana Island. -Derrotero, p. 286. W. ; P. D. Y."
      },
      {
        "entryId": "caledonia-gut",
        "name": "Caledonia Gut",
        "type": "quarter",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Caledonia Gut; Stream draining Caledonia Valley; a l w the valley itself; Northside A Quarter, St. Croix."
      },
      {
        "entryId": "caledonia-hill",
        "name": "Caledonia Hill",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Caledonia Hill; 656 feet high, $OR north aide of Cakdonh Valley, and H mile south of Ham Bluff, St. CFoix. See Horae Hill. ."
      },
      {
        "entryId": "caledonia-spring",
        "name": "Caledonia Spring",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Caledonia Spring; 175 yards southeast of Springgarden Estate house; source of Caledonia Gut, St. Croirt."
      },
      {
        "entryId": "caledonia-valley",
        "name": "Caledonia Valley",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Caledonia Valley; Narrow gorge extending from Sprtnggurden along south slope of Maroon Ridge, west-northwest 1% miles to H a m Bag. -Map 3242."
      },
      {
        "entryId": "caledoniadalen",
        "name": "Caledoniadalen",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Caledoniadalen; Danlsh, ''Caledonla Valley, \" St. Cr0lx. -Eggers."
      }
    ]
  },
  {
    "estateGeoid": "2013",
    "estateName": "CANAAN",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "canaan",
        "name": "Canaan",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Canaan; Estate, 13 Northside B Quarter, St. Croix; occupying \" a pretty little valley (smuk lille Dal), \" planted In sugar cane, at head stream of Concordia Gut, here called Canaan Bsck, 1% miles from north coast. -L. & W. ; Dewitz. Combined with Betsy's Jewel. --Boorpdon (1861)."
      },
      {
        "entryId": "canaan-beck",
        "name": "Canaan Beck",
        "type": "hill",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Canaan Beck; Small unfailing mountain brook, rising just south of watershed, 1, 500 yards from north coast of St. Croix, at east foot of Mount Eagle, 600 yards from its summit, flowing along foot of Blue Mountain through Canaan DaL Described a8 \" tributary (Tillgb)\" to Concordia Gut; actually its head stream. -Eggers. Danish, \" Canaan Bsek. \""
      },
      {
        "entryId": "canaan-mad",
        "name": "Canaan mad",
        "type": "quarter",
        "island": "stt",
        "quarter": "GREAT NORTHSIDE",
        "confidence": 105,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Canaan mad; Mile-long stretch of turnplke, descending north slope of ridge southeast of Magens Bay, Great Northside Quarter, St. Thomas. -T. 3771. -- 50 of 215 QEOORAPHIC DICTIONARY OF THE VIRQlN ISLANDS 47"
      }
    ]
  },
  {
    "estateGeoid": "1957",
    "estateName": "CANE",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "cane",
        "name": "Cane",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 195,
        "reasons": [
          "exact estate name",
          "same island",
          "quarter agreement"
        ],
        "description": "Cane; Estate, tract 1 (M. Roger), east tier, southeast portion OS Westend Quarter, 2% miles east-southeast of Frederiksted, St. Croix; wlth detached tract, west U of 58, Prince Quarter, on south coast. Planted in sugar cane; whence name, according to Mr. Fleming, proprietor. Usually misspelled, Caln. -Quin."
      }
    ]
  },
  {
    "estateGeoid": "1863",
    "estateName": "CANE (South)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1693",
    "estateName": "CANE GARDEN",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1756",
    "estateName": "CANE VALLEY",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "cane-valley",
        "name": "Cane Valley",
        "type": "quarter",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Cane Valley; 1% miles long, W mile wide, flanked by hills 854 and 923 feet high. Beck Grove and Canevalley Estates are situated within the valley, Westend Quarter, St. Croix. -Oxholm; L. & W."
      },
      {
        "entryId": "valley",
        "name": "Valley",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Valley; Estate, 3 and 4a, Daniel Mallet's Plantage, Eastend B Quarter, St. Croix. Estate hoiise rulna in hcad of glen reached by trail from Hodge Estate. Mi11 formerly on ridge to east. -Map 3242. Called by Oxholm, \"the Valley. \""
      }
    ]
  },
  {
    "estateGeoid": "1733",
    "estateName": "CARINA",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "carina",
        "name": "Carina",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Carina; Estate, 24 (Michel), Eastend A Quarter; also called \"Carina Mountain \" or '' Salmon Hill, \" q. v. , St. Croix:-T. 3800."
      },
      {
        "entryId": "carina-nountain",
        "name": "Carina Nountain",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Carina Nountain; Ridge, 1% miles long, with two summits of 765 feet, forming part of the backbone rldge of St. Croix, between the Saddle at Springgut and Lowry HflI, in Enstend A Quarter. H. 0. 1423 applies name at s h a 9 peak, 629 feet high, north of Petronella Gut."
      }
    ]
  },
  {
    "estateGeoid": "1955",
    "estateName": "CARLTON",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "carlton-gut",
        "name": "Carlton Gut",
        "type": "estate",
        "island": "stj",
        "quarter": "WESTEND",
        "confidence": 105,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Carlton Gut; Stream rising in ravine on east slope of St. George Hill, near Robehill Estatehouse, flowing south through length of Carlton Estate, Westend Quarter, St. Croix. CarW-3-0, Point (Punta); Spanish name of Ram Head, St. John, q. v. -Der. , pp. 270, 280."
      }
    ]
  },
  {
    "estateGeoid": "1758",
    "estateName": "CASSAVA GARDEN",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1773",
    "estateName": "CASTLE COAKLEY",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "castle-coakley",
        "name": "Castle Coakley",
        "type": "estate",
        "island": null,
        "quarter": "QUEEN",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Castle Coakley; Estate, 33a and 34, Queen (Dronning) Quarter; south of Centerline Road, 1% miles north of Limetree Bay, south coast of St."
      },
      {
        "entryId": "castle",
        "name": "Castle",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Castle; Castle Burke, St. Croix. -H. 0. 1423."
      }
    ]
  },
  {
    "estateGeoid": "1681",
    "estateName": "CASTLE NUGENT",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "castle",
        "name": "Castle",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Castle; Castle Burke, St. Croix. -H. 0. 1423."
      },
      {
        "entryId": "nugent",
        "name": "Nugent",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Nugent; Estate, also called Castle Nugent \"; comprlsfng tracts 41 (Betsalie Hughes) and south M of 28 (Francis Surlaine), with manse or estatehoum y2 mile from shore, between Springs and Fareham Estates, in Enstend A Quarter, sou'th coast, St. Croix. -P. D. J."
      }
    ]
  },
  {
    "estateGeoid": "1873",
    "estateName": "CATHERINE'S HOPE",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "catherine-s-hope",
        "name": "Catherine's Hope",
        "type": "estate",
        "island": "stt",
        "quarter": "WESTEND",
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Catherine's Hope; Estate north of David Point or Fortuna Bay, Westend Quarter, St. Thomas."
      }
    ]
  },
  {
    "estateGeoid": "1961",
    "estateName": "CATHERINE'S REST",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "catherine-s-rest",
        "name": "Catherine's Rest",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Catherine's Rest; Estate, in centml part of Company Quarter, St. Croix; part of hoMing of Major de Nully (1754); comprising tract 12 to east of road (A), and the west % of 20 (B), Bounded- by Rermon Hill, Bugby Hole, Qranard, Work-and-Rest. Variani spellings : Catharine's Rest, Kathnrina8 Ryst, Katherine Rest, etc."
      }
    ]
  },
  {
    "estateGeoid": "1687",
    "estateName": "CHRISTIANSTED",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "christiansted",
        "name": "Christiansted",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Christiansted; Capital and chief town of St. Croix, near center of north coast, at head of deep bight which penetrates to within 2 % miles of south coast. Population (1017), 4, 574, D4 per cent colored. Variant spellings: Chrls -- 58 of 215 OEWRAPHICI DICTIONARY OF THE VIB5IN ISLANDS 55 tlanstsed, Christianstedt, Christlanstadt, Hristiansted, but generally known a s Bassin. \" Broad, clean streets, with a number of handsome buildings : with picturesque setting of sea and amphitheater of verdant hills. Once home of Alexander Hamilton. OWcial residence of Governor, half the year. A dispatching secretary is in charge of naval government affairs; a colonial council, of municipal (i. e. , insular) affairs. There are a post offlce, customhouse, radio station, law courts, schools, hospitals, banks, and churches of several denominations."
      },
      {
        "entryId": "christiansted-harbor",
        "name": "Christiansted Harbor",
        "type": "bay",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Christiansted Harbor; Main basin 1% miles wide, sheltered on north by Long Reef. Situated 10 miles east of Ham Bluff, 794 miles west of East Point, St. Croix. In Danish called, \" Christlanssted Havn \" or '' Christiansteds H a m \"; popularly, '' Bassin Harbor \"; from the early French name (1761), Le Bassin, or Bassin, meaning a harbor basin. Described in \"Port0 Rico and Virgin Islands Coast Pilot, \" pp. 137-8. The inter-island packet, Vigilant, built in 1802 for a Danlsh privateer, defeated a Spanish gunboat, turned slaveship, sank in the 1916 hurricane, was raised and retimbered. In 1921 a preliminary examination of the harbor was made by the United States Corps of Engineers."
      },
      {
        "entryId": "christiansted-hills",
        "name": "Christiansted Hills",
        "type": "hill",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Christiansted Hills; Irregular uplift on and east of Neck of St. Croix, extebding from Predensdal to Sight Gap. Slit by Springgut Notch, \"the Saddle\" into two massifs: Jacobsberg, 845 feet high at Signal Hill, and Carina Mountain, with two peaks of 765 feet. Maria Hill, 380 feet, outlylng spur on east."
      }
    ]
  },
  {
    "estateGeoid": "1660",
    "estateName": "CLAIRMONT",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "clairmont",
        "name": "Clairmont",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Clairmont; Extensive estate in Northside B Quarter, St. Croix; tracts 3b, 4, 8, 9; estate house on hill W mile south of Baron BlufP, summit 880 feet; mill on northwest spur, elevation 835 feet. French, Clair, \"clear, \" and Mont, '' mount. \" Also spelled, '' Claremont, \" \" Clermont \"; called \"Bodkin's Plantage, \" because patented to Laurence Bodkin, proprietor also of Windsor, adjacent estate on south, in Queen Quarter. Mudie's Estate (1851)embraced Clairmont with Windsor. 4corpWn."
      },
      {
        "entryId": "clairmont-hill",
        "name": "Clairmont Hill",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Clairmont Hill; 860 feet high, most northerly and conspicuous peak of Saltriver Hills, % mile east o f Clairmont Mill, St. Crolx."
      }
    ]
  },
  {
    "estateGeoid": "1746",
    "estateName": "CLAIRMONT",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "clairmont",
        "name": "Clairmont",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Clairmont; Extensive estate in Northside B Quarter, St. Croix; tracts 3b, 4, 8, 9; estate house on hill W mile south of Baron BlufP, summit 880 feet; mill on northwest spur, elevation 835 feet. French, Clair, \"clear, \" and Mont, '' mount. \" Also spelled, '' Claremont, \" \" Clermont \"; called \"Bodkin's Plantage, \" because patented to Laurence Bodkin, proprietor also of Windsor, adjacent estate on south, in Queen Quarter. Mudie's Estate (1851)embraced Clairmont with Windsor. 4corpWn."
      },
      {
        "entryId": "clairmont-hill",
        "name": "Clairmont Hill",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Clairmont Hill; 860 feet high, most northerly and conspicuous peak of Saltriver Hills, % mile east o f Clairmont Mill, St. Crolx."
      }
    ]
  },
  {
    "estateGeoid": "1702",
    "estateName": "CLIFTON HILL",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "clifton-hill",
        "name": "Clifton Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "KING",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Clifton Hill; Estate, 22, King Quarter, St. Croix. Deeded to Isaac Markoe. Called by Oxholm \" Cliftonhill, \" after plateau. Estatehouse is on point of bluff, elevation 188 feet; fan mill at foot, at 103 feet. Sugar cane and grassland."
      }
    ]
  },
  {
    "estateGeoid": "1668",
    "estateName": "COAKLEY BAY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "coakley-bay",
        "name": "Coakley Bay",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Coakley Bay; Curving bight, 750 yards wide, on north coast of Eastand Peninsula, St. Croix, $k mile east-southeast of Pull Point, St. Croix. Named in honor of John Coakly, owner of estate. Earlier French name, \"Grand Anse \" (Great Bay). One-half mile northeast is a cut through the fringing reef. Immediately east of Coakley Bay and Wlsmenog Point, is Carden Bay, to which also the name Coakley Bay has been less properly applied. -T. 3837; C. P. ; H. 0. 1423."
      }
    ]
  },
  {
    "estateGeoid": "1972",
    "estateName": "COLQUOHOUN",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "colquohoun-mt",
        "name": "Colquohoun Mt",
        "type": "estate",
        "island": "stx",
        "quarter": "KING",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Colquohoun Mt. Pleasant; Estate, 6 and 7, King Quarter, St. Croix; Mill and settlement on southeast slope of hill so called, 370 yards northeast of Bethlehem aut. Patrimony of Robert Calhuu's heirs; spelled by Oxholm, Mount Pleasant."
      }
    ]
  },
  {
    "estateGeoid": "1774",
    "estateName": "CONCORDIA",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "concordia",
        "name": "Concordia",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Concordia; Moth Plantage, Estate 8, Queen (Dronning) Quarter, St. Croix; at the north end of which, on north side of Concordia Gut, are the old mill tower and buildings. Included in estate is strip 490 yards wide, with mean length of 2, 720 yards, comprising 5a and 4a in Queen Quarter, with 3a, 2c, Qa, and lOc, in Northside B Quarter, ending at Concordia Bluff on north coast. Justitsraad Moth (or Mooth), proprietor. -Beck. Bounded on east by Saltriver and Morningstar, south by Mary's Fancy, west by Glynn, Windsor, and Clairmont Estates. Called also \"Upper Concordia, \" to distinguish this from Lower Concordia In Westend Quarter."
      },
      {
        "entryId": "concordia-creek",
        "name": "Concordia Creek",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Concordia Creek; Rises in Canaan Estate, northeast of Mount Eagle, in Northside B Quarter, flows southeast 2 miles into King Quarter, bends around northeast 2 miles farther, passes Glynn and Concordia, and emptiea into Sugar Ray, taking name of Salt River; whence Saltriver Bay, north coast of St. Croix. Also called '' Concordia Bsek, \" '' Concordia aut. \""
      },
      {
        "entryId": "concordia-saltpond",
        "name": "Concordia Saltpond",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Concordia Saltpond; See Saltpond, St. John."
      }
    ]
  },
  {
    "estateGeoid": "1859",
    "estateName": "CONCORDIA (South)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "concordia",
        "name": "Concordia",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Concordia; Moth Plantage, Estate 8, Queen (Dronning) Quarter, St. Croix; at the north end of which, on north side of Concordia Gut, are the old mill tower and buildings. Included in estate is strip 490 yards wide, with mean length of 2, 720 yards, comprising 5a and 4a in Queen Quarter, with 3a, 2c, Qa, and lOc, in Northside B Quarter, ending at Concordia Bluff on north coast. Justitsraad Moth (or Mooth), proprietor. -Beck. Bounded on east by Saltriver and Morningstar, south by Mary's Fancy, west by Glynn, Windsor, and Clairmont Estates. Called also \"Upper Concordia, \" to distinguish this from Lower Concordia In Westend Quarter."
      }
    ]
  },
  {
    "estateGeoid": "1651",
    "estateName": "CONCORDIA (West)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "concordia",
        "name": "Concordia",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Concordia; Moth Plantage, Estate 8, Queen (Dronning) Quarter, St. Croix; at the north end of which, on north side of Concordia Gut, are the old mill tower and buildings. Included in estate is strip 490 yards wide, with mean length of 2, 720 yards, comprising 5a and 4a in Queen Quarter, with 3a, 2c, Qa, and lOc, in Northside B Quarter, ending at Concordia Bluff on north coast. Justitsraad Moth (or Mooth), proprietor. -Beck. Bounded on east by Saltriver and Morningstar, south by Mary's Fancy, west by Glynn, Windsor, and Clairmont Estates. Called also \"Upper Concordia, \" to distinguish this from Lower Concordia In Westend Quarter."
      }
    ]
  },
  {
    "estateGeoid": "1904",
    "estateName": "CONSTITUTION HILL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "constitution-hill",
        "name": "Constitution Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Constitution Hill; Estate, on hill so called, 350 feet high, on tract 25 in Queen Quarter, with most of tract 7 in Company Quarter, St. Croix. Plantation of James Rely Hughes' widow (Enke). Spelled by Danish, Consti tutionliill."
      }
    ]
  },
  {
    "estateGeoid": "83",
    "estateName": "CONTENTMENT",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "contentment",
        "name": "Contentment",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Contentment; Small estate, mainly in Contentment Valley, south of Fredensdal and Richmond Estate; tract 10, Isaac Ewans' Plantation, Company Quarter, St. Croix."
      },
      {
        "entryId": "contentment-dakn",
        "name": "Contentment Dakn",
        "type": "quarter",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Contentment Dakn; Danish name of Contentment Valley, Company Quarter, St. Croix. -Eggers."
      },
      {
        "entryId": "contentment-gut",
        "name": "Contentment Gut",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Contentment Gut; Rivulet flowing northwest through Contentment Estate, St. Croix. -Eggers. Danish name, \" Contentment Brek. \""
      },
      {
        "entryId": "contentment-valley",
        "name": "Contentment Valley",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Contentment Valley; Hollow occupying center of Contentment Estate and drained by Contentment B z k or Gut, St. Croix."
      },
      {
        "entryId": "contentment-hill",
        "name": "Contentment Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Contentment Hill; Sharp acclivity, 300 feet high, at northwest corner of Contentment Estate, s t. Cmix."
      }
    ]
  },
  {
    "estateGeoid": "1769",
    "estateName": "COOPERS",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "cooper",
        "name": "Cooper",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Cooper; Estate, also called Cooper Bay, or Montpellier, tract 26, Prince Quarter, south coast of St. Croix. --Ivlap 3242."
      }
    ]
  },
  {
    "estateGeoid": "1762",
    "estateName": "CORN HILL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "corn-hill",
        "name": "Corn Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Corn Hill; =-foot knoll in Cornhill Estate, St. Uroix."
      }
    ]
  },
  {
    "estateGeoid": "1753",
    "estateName": "COTTAGE",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "cottage",
        "name": "Cottage",
        "type": "estate",
        "island": "stx",
        "quarter": "QUEEN",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Cottage; Estate, 32, in southwest part of Queen (Dronning) Quarter, St. Croix. Deeded to John Meyer. Has three cotbn patches and a cane patch; remainder, bush and gmss. --t)XhOlm."
      },
      {
        "entryId": "cottage-hill",
        "name": "Cottage Hill",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Cottage Hill; 158 feet high, small ridge in southeastern corner of Barrenspot Bbtdte, just west of Cottage EcJtatahouse, LJt. Croix."
      }
    ]
  },
  {
    "estateGeoid": "1669",
    "estateName": "COTTON GROVE",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      }
    ]
  },
  {
    "estateGeoid": "1666",
    "estateName": "COTTON VALLEY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "cotton-valley",
        "name": "Cotton Valley",
        "type": "quarter",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Cotton Valley; Plain nearly 400 yards wide, extending back from Lalu~itleor Gulklip (Yellowcliff) Bay on north coast of Eastend B Quarter, St. Croix, 1, 200 yards south. Mary's Fancy, at northwest corner, is terminus of nutomobile road toward east; whence a trail runs south along base of hills on west, passing Cotton Valley Mill tower, reticliing d t l Grove Estute. -T. 3 5 3 I). It. I n 'OOs, hundreds of acres were still covered with cotton aird cane, that are now desolate under a growth of cactus, maran, crotons, lunt:iuas, and other weeds. -Millspaugh (laon)."
      },
      {
        "entryId": "valley",
        "name": "Valley",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Valley; Estate, 3 and 4a, Daniel Mallet's Plantage, Eastend B Quarter, St. Croix. Estate hoiise rulna in hcad of glen reached by trail from Hodge Estate. Mi11 formerly on ridge to east. -Map 3242. Called by Oxholm, \"the Valley. \""
      }
    ]
  },
  {
    "estateGeoid": "1743",
    "estateName": "DIAMOND",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "diamond",
        "name": "Diamond",
        "type": "estate",
        "island": null,
        "quarter": "SOUTHSIDE",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Diamond; Estate in sotithwest central portion of Prince Quarter, St. Cvoix. Tracts 38 and 39, on south side of Ceiiterline Road, 8ep:mited by Southside Road, both tracts mostly in sugar cane, with west 1, 4 of 43 pnstnre land, in 1754 were the inheritance of '' Constantins Enkeq Arvingcr \" (Constantine's widow's heirs); 43b, now grassy grove, belorrged to Philip Prnncis. Estate vilkige, \" grent house \" and mill, ccntrnl on 100-foot a w c ~ l l. east of St. George Bek o r blint Gut and Southside Road. See Dianiond School."
      }
    ]
  },
  {
    "estateGeoid": "1766",
    "estateName": "DIAMOND",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "diamond",
        "name": "Diamond",
        "type": "estate",
        "island": null,
        "quarter": "SOUTHSIDE",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Diamond; Estate in sotithwest central portion of Prince Quarter, St. Cvoix. Tracts 38 and 39, on south side of Ceiiterline Road, 8ep:mited by Southside Road, both tracts mostly in sugar cane, with west 1, 4 of 43 pnstnre land, in 1754 were the inheritance of '' Constantins Enkeq Arvingcr \" (Constantine's widow's heirs); 43b, now grassy grove, belorrged to Philip Prnncis. Estate vilkige, \" grent house \" and mill, ccntrnl on 100-foot a w c ~ l l. east of St. George Bek o r blint Gut and Southside Road. See Dianiond School."
      }
    ]
  },
  {
    "estateGeoid": "1958",
    "estateName": "DIAMOND",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "diamond",
        "name": "Diamond",
        "type": "estate",
        "island": null,
        "quarter": "SOUTHSIDE",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Diamond; Estate in sotithwest central portion of Prince Quarter, St. Cvoix. Tracts 38 and 39, on south side of Ceiiterline Road, 8ep:mited by Southside Road, both tracts mostly in sugar cane, with west 1, 4 of 43 pnstnre land, in 1754 were the inheritance of '' Constantins Enkeq Arvingcr \" (Constantine's widow's heirs); 43b, now grassy grove, belorrged to Philip Prnncis. Estate vilkige, \" grent house \" and mill, ccntrnl on 100-foot a w c ~ l l. east of St. George Bek o r blint Gut and Southside Road. See Dianiond School."
      }
    ]
  },
  {
    "estateGeoid": "1928",
    "estateName": "ELIZA'S RETREAT",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "eliza-s-retreat",
        "name": "Eliza's Retreat",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Eliza's Retreat; Estate. 120 yards south of I. nng's Observatory and 1 mile cast-southpast of Chrlstiansted, St. Croix. -H. 0. 1088, 1423. (1omprisc. s most of tract 2 and north ya of 26 east of road to Springgut Aatldle (Salomon Plantage), with west M of 23 (Boffron, Jncobsbierg), and 36 (Roger). -T. 3799. Stockfnrm, in 1866 belonging to Maj. L a w, K. D."
      }
    ]
  },
  {
    "estateGeoid": "1768",
    "estateName": "ENFIELD GREEN",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1846",
    "estateName": "ENVY",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "envy",
        "name": "Envy",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 175,
        "reasons": [
          "exact estate name",
          "quarter agreement"
        ],
        "description": "Envy; ICctntc on south coast of Prince Quarter, St. Crois; buildings 700 yartls from Rhore on east % of traet 51; proprictnr (1754) Dnniel Bnrry; to which a r e now added the west 1h of 51 (John Willett), also, the west y2 of 60 (Wiliinm Kenny). Iknindctl on north by Nelgrobky Estate; on eust by Manning Bay Estate, sometimes identifled with former : either name being Winma s. -Ikr. -- 76 of 215 QEOORAPNIC DICTIONARY OF T H E VLCCIN ISIANDS 73 npplicahle to curved beach ou south. Bouncled on wMt by Cooper H:iy, tlic sliore of which is also culled \" Negro Ray \" or \"Cooper Gay. \""
      }
    ]
  },
  {
    "estateGeoid": "1933",
    "estateName": "FAREHAM",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1653",
    "estateName": "FOUNTAIN",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "fountain",
        "name": "Fountain",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Fountain; Estate of hfaj. de Kully, comprising tract 11 in Northside A Quarter, 37 in Northside I: Quarter, and north % of tract 4 (Willett) In Prince Quarter, St. Croix; together occupying the upper valley with the headstreams of Jealousy Hek. Estate buildings in southwest coruer of former trtict, on rouiided bench of hills, 380 feet high. Also called, Big Fountain. -L. &. W. I n 1x56, as Camrning sugar plantations, had acquired Parasol stockfarm."
      },
      {
        "entryId": "blp-fountain",
        "name": "Blp Fountain",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Blp Fountain; Fountain Estate, or Nully Plantage, in Northside Quarter, St. Croix."
      },
      {
        "entryId": "little-fountain",
        "name": "Little Fountain",
        "type": "unknown",
        "island": null,
        "quarter": "KING",
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Little Fountain; ICstatr, 3, in northern tier of King Qiinrtt?r, St. CJroix. Old Milltower and settlement on bench of hills west of Concordin Gut, 17/s m i l e s Croiti north coast. -Dewits; H. 0. 1423; Map 3242. Patrimony of Warn. Ahrtl hnni Rogiers' heirs. - -Reck. Also called, k'ountnin. Merged"
      }
    ]
  },
  {
    "estateGeoid": "2014",
    "estateName": "FREDERIKSHAAB",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "frederikshaab",
        "name": "Frederikshaab",
        "type": "estate",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Frederikshaab; Estate, 25 in Westend Quarter. 1% miles east of Frederikstetl,"
      }
    ]
  },
  {
    "estateGeoid": "1664",
    "estateName": "FREDERIKSTED",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "frederiksted",
        "name": "Frederiksted",
        "type": "point",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Frederiksted; I'ort of call, post office, and chief cotnniercial town of St. Uroiu : situated on Westend Hay, 2% mila9 north of Southwest Point, Hy2 niiies south of Iltim Bluff. Nearly destroyed during insurrection j i b 1878. Yopulation (1917), 3, 144; over 06 per cent ctrlored. -Dunisli 80; 13. 0. 1423; 2318; C. P. ; 1'. 0. ; Uensus. Variants: FrederichstmJ, Ihwlerickstud, Fredericlisted, IWderichstEdt, Frlederichsbdt, Friedrichstedt, Frederiksstecl, etc. Handles. % of export and import trade of St. Croix, including bulk of sugar shipments; several large H:stntt% maintaining agents. Viewed from sea, the town rest. mtiles tl bcautifnl Spanigh city, with Romanesque piazzas, churches, and ninny-itrched buildings, peeping through the tropical foliage. Stnndard time 1s furnished by telegraph and telephone and by thc new concrete clock tower 011 the fort."
      },
      {
        "entryId": "frederiksted-road",
        "name": "Frederiksted Road",
        "type": "road",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Frederiksted Road; Portion of Westend Hay adjacent to FrederiltuteJ, affording anchorage grounrl with 6 or 7 fathoms in t h e open ro:atlstrad, Vert E'rcderik bearing O P, Srindy Point 200\" t r u e. 4. P. : I,. H. S. Also culled $rectcrilrstrd Harbor. Passengers and cargoes are Iantlvtl by lighters. Quehec line steamers plying belween New Pork and lirit'sh Guiana call regularly."
      }
    ]
  },
  {
    "estateGeoid": "50",
    "estateName": "FRIEDENSTHAL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1970",
    "estateName": "GLYNN",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "glynn",
        "name": "Glynn",
        "type": "quarter",
        "island": "stx",
        "quarter": "QUEEN",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Glynn; 1i:stnte in Concortlia Valley, 2% miles south of Baron Clnff, St. Croix; comprising tract 10 in King Quarter, and 7 in Queen (Dronning) Quarter. Also called, \" The Glynn, \" and erroneously '' The Gynn. \" E'lnntuge of James Johnston, niisspelled '' Jhonston \" and \" Ionston. \" Century Inter (1854), with Jealousy arid Mt. Pleasant, constituted Ilucas Estates."
      },
      {
        "entryId": "the-glynn",
        "name": "The Glynn",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "The Glynn; Glynn Estate, St. Croix, q. v. -Oxholm; Dewita."
      }
    ]
  },
  {
    "estateGeoid": "1889",
    "estateName": "GOLDEN GROVE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "golden-grove",
        "name": "Golden Grove",
        "type": "quarter",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Golden Grove; IMate, comprising tracts 33h (south % of 33), 34b (southeast '/a of 34), 47a ( N. y* of E. of 47), 48a (N. sf, of 48), in Pri1ic. e Quarter,"
      },
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      }
    ]
  },
  {
    "estateGeoid": "1686",
    "estateName": "GOLDEN ROCK",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "golden-rock",
        "name": "Golden Rock",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Golden Rock; Estate, 4 in Company Quarter. on west shore of Christianstetl Harbor, Ilk miles west of Protestant ( h y, St. Croix; Estatehouse on 66-foot knoll. -H. 0. 3058, 1423. Iwac Ewuns' I'lantnge. Also spelled, Goldenrock. United to Little Princens, as Phillips' li; stnte. -b'oorpion."
      }
    ]
  },
  {
    "estateGeoid": "1691",
    "estateName": "GRANARD",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "granard",
        "name": "Granard",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Granard; Estate, in southerly portion of Company Quarter, Rt. Croix; embracing the following tracts : ICnst 112 of 16, 17, north 1/2 18, 19 (RI; *Woy); west 1/2 of 20, east 3/4 of 30 (Yurliiine), on south Coilst; north 2, 6(M)fwt of east 1/2 of 32 (Bodkin). Buildings on 17, 1, 250 ynrds nortl~~vestI I € Manchenil Bay. Granard envelops Cornhill, also 1)inmond Keturali, escept on south. a r u n d e A n s e; F r m c h, \"Great Bny, \" same as Coakley Bay, north coast. %. C:roix. -Lnpoin te."
      }
    ]
  },
  {
    "estateGeoid": "1880",
    "estateName": "GRANGE (North)",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1881",
    "estateName": "GRANGE (South)",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1882",
    "estateName": "GRANGE HILL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1877",
    "estateName": "GREAT POND",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "great-pond",
        "name": "Great Pond",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Great Pond; Bro; itl shallow l:igoon, cihout 1 foot clceli, wmwtinrc~sd r y; solin. rated from Great Pond Bay by a narrow barrier 1. 2SO yiirtls long; reaching back about 700 yards. Dfiniqh nnme, Storclwi, Storpandn, StoreSaltpan, Store-Saltpnndc; Spiinisli, Estnnqiie Crr; iiide. Also ciillc. A, Great Saltpond"
      }
    ]
  },
  {
    "estateGeoid": "1680",
    "estateName": "GREEN CAY",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "green-cay",
        "name": "Green Cay",
        "type": "cay_or_island",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Green Cay; IJriisliy islet, 24 fcet high, 08 yiir(iR long, iirrn 723 sqiinre rods, 200 yards off pnint soutlienst of French RWY, St. l'honi:is. i C ~ i c * l \\ h, tlry o r awash, arcti 13 squiire rods, ealeiid 120 J U ~ Ssouthwest. €r(ini Ureeu Cay. -- 91 of 215 88 U. S. COAST AND GEODETIC SURVEY Named Groen Eylnnd by Van Keulen (1719), rendered Capo Verde in"
      }
    ]
  },
  {
    "estateGeoid": "1750",
    "estateName": "GROVE PLACE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      }
    ]
  },
  {
    "estateGeoid": "1777",
    "estateName": "GUMBS LAND",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1884",
    "estateName": "HAFENSIGHT",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "sight",
        "name": "Sight",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Sight; Estnte, tracts 20 and 32, measuring 2, 000 by 4, 500 feet, Eastend Qunrter, St. Croix. In 1754 belonged to heirs of Oov. Johnnnes Heyliger. It occupies a gap of central ridge between Maria Hill and Mt. Washington. Road ncross island from Southgate to Great Pond traverses eastern edge of'Sig1it Estate. -Q. ; 2. Scorpion survey reported this united with Sally's Fancy, Petronella, and Lowry HIII."
      }
    ]
  },
  {
    "estateGeoid": "1887",
    "estateName": "HAMS BAY",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1656",
    "estateName": "HAMS BLUFF",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1650",
    "estateName": "HANNAHS REST",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1779",
    "estateName": "HARD LABOR",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1676",
    "estateName": "HARTMAN",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1723",
    "estateName": "HERMITAGE",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "hermitage",
        "name": "Hermitage",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Hermitage; Estate in inclosed valley near sources of Bethlehem Gut, now comprising tract 1 in Prince Quarter, with tracts 5 and 4a (west 1h) in King Quarter, St. Croix. All but 4a belonged to John Willett and his heirs, along with various scattered tracts. --0xholm; Dewitz, etc. I n 1851, with Manning Bay, Castle Coakley, etc. , owned by Ratcliffe."
      }
    ]
  },
  {
    "estateGeoid": "1962",
    "estateName": "HERMON HILL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "hermon-hill",
        "name": "Hermon Hill",
        "type": "hill",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Hermon Hill; 257 feet high, 1 mile southwest of Christiansted, St. Croix."
      }
    ]
  },
  {
    "estateGeoid": "1954",
    "estateName": "HOGENSBERG",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1851",
    "estateName": "HOLGER'S HOPE",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1759",
    "estateName": "HOPE",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "hope",
        "name": "Hope",
        "type": "quarter",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "Hope; 1':state 23, Prince Quarter, St. ('roix. Covered wrih praw, hushes, and trrws. Danish, Iicstbjerg. \" Ileu\"; same ns Sail Rock. See : Hiighes. (1. v. -2. -- 100 of 215 GEOGRAPHIU DICTION. 4RY OF T R E VIRGIN ISLANDS 97 and a smaller beach 500 yards west is cnlled Salonion Bag. Hull Ray was nrtmed durriaan Ilnusen Bay by Van IZwlen, I-Iansen Bay by Ilflst, Ensomhed Ray by Hornbeck, Lille Nordride Ray hy the 1)nne. l. Little Northside R81. v by uavigntors, and Irlull Bay locally. -'1'. Xi1 r). R. : (1. P. ; 0. I3. Hull I'oint; Local nyme for Troyitco Point, S t. Tlionias. --T. 3771. flumbrry; Error for EIuxnhug, St. C'roix. -Osliolni."
      }
    ]
  },
  {
    "estateGeoid": "1907",
    "estateName": "HOPE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "hope",
        "name": "Hope",
        "type": "quarter",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "Hope; 1':state 23, Prince Quarter, St. ('roix. Covered wrih praw, hushes, and trrws. Danish, Iicstbjerg. \" Ileu\"; same ns Sail Rock. See : Hiighes. (1. v. -2. -- 100 of 215 GEOGRAPHIU DICTION. 4RY OF T R E VIRGIN ISLANDS 97 and a smaller beach 500 yards west is cnlled Salonion Bag. Hull Ray was nrtmed durriaan Ilnusen Bay by Van IZwlen, I-Iansen Bay by Ilflst, Ensomhed Ray by Hornbeck, Lille Nordride Ray hy the 1)nne. l. Little Northside R81. v by uavigntors, and Irlull Bay locally. -'1'. Xi1 r). R. : (1. P. ; 0. I3. Hull I'oint; Local nyme for Troyitco Point, S t. Tlionias. --T. 3771. flumbrry; Error for EIuxnhug, St. C'roix. -Osliolni."
      }
    ]
  },
  {
    "estateGeoid": "1776",
    "estateName": "HOPE & CARTON HILL",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "hope",
        "name": "Hope",
        "type": "quarter",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 160,
        "reasons": [
          "exact estate name"
        ],
        "description": "Hope; 1':state 23, Prince Quarter, St. ('roix. Covered wrih praw, hushes, and trrws. Danish, Iicstbjerg. \" Ileu\"; same ns Sail Rock. See : Hiighes. (1. v. -2. -- 100 of 215 GEOGRAPHIU DICTION. 4RY OF T R E VIRGIN ISLANDS 97 and a smaller beach 500 yards west is cnlled Salonion Bag. Hull Ray was nrtmed durriaan Ilnusen Bay by Van IZwlen, I-Iansen Bay by Ilflst, Ensomhed Ray by Hornbeck, Lille Nordride Ray hy the 1)nne. l. Little Northside R81. v by uavigntors, and Irlull Bay locally. -'1'. Xi1 r). R. : (1. P. ; 0. I3. Hull I'oint; Local nyme for Troyitco Point, S t. Tlionias. --T. 3771. flumbrry; Error for EIuxnhug, St. C'roix. -Osliolni."
      }
    ]
  },
  {
    "estateGeoid": "1967",
    "estateName": "HUMBUG",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "humbug",
        "name": "Humbug",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Humbug; Estate, north 5!L of tracts 44 ani1 4b, Q n w n (Dronning) Quarter,"
      }
    ]
  },
  {
    "estateGeoid": "1926",
    "estateName": "ISAACS BAY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1927",
    "estateName": "JACKS BAY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1760",
    "estateName": "JERUSALEM & FIGTREE HILL",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "jerusalem",
        "name": "Jerusalem",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 440,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Jerusalem; Estate in Quem (1)ronning) Quarter, south rmist of St. (Croix. Milltower, top 11F frrt nlmvc sea, on 82-foot knhll, 850 pnrcls north o f Limetree I<ny. -L. Rr W. ; Dewits. Beck insrrilws name of Pieter 13eylizc. r on N. 1h o f tracts 40 and 41 : Jonnt1i:in Ewnn's widow, S. '4 o f 40 : John m i, S. of 41, and cqual-width strip to shore. Oxholni diows snit1 sl r i p as uncultivntrd Iiintl. Tract 52 011 east shore of Limetree Ray, belonged to Molr R Coakly. Spelletl Yrrse Thy, a180 Yer Hay. Jewel Coil : I'rewnt lot*nlname of Waterlemon Vay, St. John."
      }
    ]
  },
  {
    "estateGeoid": "1740",
    "estateName": "JOLLY HILL",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "jolly-hill",
        "name": "Jolly Hill",
        "type": "estate",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Jolly Hill; Estate, 32 in north tier of Westend C)ilnrtrr, St. C h i s; deivled to John Jordan. Little cultivation. Estatehouse 1)ctwwii 3 hills, in valley where Oxford Road strikes north from Mahogany Road. 111 south i w l stands old Brookhill Estatehouse, a t foot of Brook Hill or 1lidge. --L. C W. Joined to Little Grange (lS66) u s Logiin Estate."
      }
    ]
  },
  {
    "estateGeoid": "1701",
    "estateName": "JUDITHS FANCY",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1754",
    "estateName": "KINGSHILL",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "kingshill",
        "name": "Kingshill",
        "type": "hill",
        "island": "stx",
        "quarter": "KING",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Kingshill; Post ofnce at foot of King's Hill, on south side of Centerline Rulad, 7% miles east of Fredcriksted, 71& miles west of Christinnsted, St. Croix. E'. 0. Guide and Postroute map of P. 11. L V. I. Named from KfIigNhill (St:ition). -I)ewitz; Quin; Eggers. In 1921 a iicw building of reinforced concrete was conipleted, to serve as a courthouse, jail, policp inspwtor's quarters, patrolmen's barracks, and telephoue ceiitral; with cistern, stable, &e. -Governor's report. lCir, f!8hiZZ G u t; Bethlebetn Creek, one of the two lnrgcst wntercoiirses ('l'anclI@b) of St. Croix; the other Iwing Adveirtnre Gut or. Jealousy Bcek; both of wvhich h:i\\ e their source ul)out n i i t l u try in the western highland (Vestlrge IIprilund~. and not fur from south coast (Sydkysten), unite i o form E'alrplrtin Crcek ( Aa). --Eggers. h-ingshill H p i d c d r n g; Dttnidi name for Iiingsliill Iiiclge, St. Croix. --Eggers' Flor:t, p. 04."
      },
      {
        "entryId": "kingshill-ridge",
        "name": "Kingshill Ridge",
        "type": "quarter",
        "island": "stx",
        "quarter": "KING",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Kingshill Ridge; 1% nii1t. w long, exteiicling south froin Iiingsliill Stntiori. 232 feet high, with snmniit 560 yards south, 280 feet high, to S o n t h s i d ~ ~ Itostl nt 1~'airpluin. Dnnidi, '' IClngsliill IWidedrag. \" Part of I<ingsliIll Itiuige, q. v. , King Quarter, St. Croix. -Quin."
      },
      {
        "entryId": "kingshill-station",
        "name": "Kingshill Station",
        "type": "hill",
        "island": "stx",
        "quarter": "KING",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Kingshill Station; Uurracdlrs, in inclosurr 240 by 200 feet, 011 I<asc~riieHill (King's Hill), St. Croix. Danish, \" ICoii~sh~4liknscrne. \"ICiug's Elill Station, on ll. 0. 3423."
      },
      {
        "entryId": "kingshill-range",
        "name": "Kingshill Range",
        "type": "unknown",
        "island": null,
        "quarter": "KING",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Kingshill Range; Trinnyulw uplift, group of litnestone hills in King Qu:irtrr,"
      }
    ]
  },
  {
    "estateGeoid": "1975",
    "estateName": "LA GRANDE PRINCESSE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "princess",
        "name": "Princess",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Princess; Grand or Great Princess Estate, measuring 2, 100 yards north and south, about 1, 375 yards east and west, with frontage of 1, 200 yards on northern coast of St. Croix, 2 miles northwest of Christiansted; comprising equivalent of 4 tracts, at northern end of Company Quarter; including also tract 13 in Queen Quarter. Ledru (1801) stated, Princess Estate belonged to house of Schimmelman of Copenhagen. Variously called: La Princesa, La Princessn, La Princesse, La Grande Princesse, La Princeso Grande, Great Princess, Grand Princess, Plantagien Prinsessen, Prindsesse. Prinsesse, Yrintsessen, Princess, Prinzessin-Qunrtier."
      },
      {
        "entryId": "prince",
        "name": "Prince",
        "type": "quarter",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Prince; Quarter or rural district of St. Croix; 16, 000 feet wide, bounded north by Northside A and B, east by King Quarter, west by Westend, south by Caribbean Sea. Danish, Prindsens Kvarteer. Population (1917), 1, 678."
      }
    ]
  },
  {
    "estateGeoid": "2011",
    "estateName": "LA GRANGE",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1748",
    "estateName": "LA PRESVALLEE",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1738",
    "estateName": "LA REINE",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "baye-de-la-reine-anne",
        "name": "Baye de la Reine Anne",
        "type": "bay",
        "island": "stt",
        "quarter": "QUEEN",
        "confidence": 105,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Baye de la Reine Anne; French, ' 'Bay of the Queen Anne \"; name by which Annedewint Bay, now called Bolongo Bay, St. Thomas, was known to early French mariners. -Bellin."
      }
    ]
  },
  {
    "estateGeoid": "2010",
    "estateName": "LA VALLEE",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1689",
    "estateName": "LBJ GARDENS",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1716",
    "estateName": "LEBANON HILL",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "lebanon",
        "name": "Lebanon",
        "type": "hill",
        "island": "stx",
        "quarter": "KING",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Lebanon; Itstate; tracts 1, 2, and east edge of 3, in King Qnnrter. a t north edge of (:e~itrnl I'lnin, southwest foot of Snltrivrr IIlIIs, 11h miles froni north coast of St. Croix. P a r t of original holdings of Baron de 1; reloii. Also rrzlIcd Lihxnon, Lebnnon 11111. r, cBnnon Rakker; 13niiisl1, name of Lebanon Hills, St. Croix. '' Lebnnon Hill nalclcer. \"-l~; ~:gers."
      }
    ]
  },
  {
    "estateGeoid": "1720",
    "estateName": "LITTLE FOUNTAIN",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "little-fountain",
        "name": "Little Fountain",
        "type": "unknown",
        "island": null,
        "quarter": "KING",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Little Fountain; ICstatr, 3, in northern tier of King Qiinrtt?r, St. CJroix. Old Milltower and settlement on bench of hills west of Concordin Gut, 17/s m i l e s Croiti north coast. -Dewits; H. 0. 1423; Map 3242. Patrimony of Warn. Ahrtl hnni Rogiers' heirs. - -Reck. Also called, k'ountnin. Merged"
      },
      {
        "entryId": "fountain",
        "name": "Fountain",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Fountain; Estate of hfaj. de Kully, comprising tract 11 in Northside A Quarter, 37 in Northside I: Quarter, and north % of tract 4 (Willett) In Prince Quarter, St. Croix; together occupying the upper valley with the headstreams of Jealousy Hek. Estate buildings in southwest coruer of former trtict, on rouiided bench of hills, 380 feet high. Also called, Big Fountain. -L. &. W. I n 1x56, as Camrning sugar plantations, had acquired Parasol stockfarm."
      }
    ]
  },
  {
    "estateGeoid": "1782",
    "estateName": "LITTLE LA GRANGE",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1842",
    "estateName": "LITTLE MOUNT PLEASANT (MATR",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "mount-pleasant",
        "name": "Mount Pleasant",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Mount Pleasant; Estate, 36 and 37, on south side of Centerline Road, Prince Qr. , St. Croix. Buildings on northwest slope of grassy hill, so-called, 4 miles east of Frederiksted. Tract 37 was Irwin's Plantage, patented to Andreis Irvin. N. Jb of 36 belonged (1'7M) to Smith and Cunningham, remainder to \" Will. Ravensk. \"-Oxholm; D. Bounded north by Plessen, east by Adventure, south by Paradise, weat by (Big) Diamond Corn p:itch ( 525 yards square in southwest comer; remainder, except hill, in sugar cane, United to Plessen, as Qrant Estates. +fountPleasant; Mount Victory Estate, St. Urolx. --& 0. lrlw. ~ o u l a tPleasant; Testman's '' Little Fountain \" Estate, 11Northeide B Quarter, Yount Pleasant (Colquohoun) : Same a8 Colquohoun Mt. Pleasant, Q. v. , St."
      }
    ]
  },
  {
    "estateGeoid": "1960",
    "estateName": "LITTLE PRINCESSE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "little-princess",
        "name": "Little Princess",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Little Princess; Estate in Company Quarter, St. Croix; comprising house, mill, and settlement with landing at western extremity of Christiansted Hnrbor, 1% miles west-northwest of Protestant Cay, on tract 5; together with all of tract 13 except south of west s. Plantage of Peter Heyliger, jr. Also spelled, Little Princesse, Litt. Princessa, etc. ; contradistinguishrd from Great Princess. Little Princess and Goldenrock, combined as Phillips' Sugar Estates. -Hcorpion."
      },
      {
        "entryId": "princess",
        "name": "Princess",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Princess; Grand or Great Princess Estate, measuring 2, 100 yards north and south, about 1, 375 yards east and west, with frontage of 1, 200 yards on northern coast of St. Croix, 2 miles northwest of Christiansted; comprising equivalent of 4 tracts, at northern end of Company Quarter; including also tract 13 in Queen Quarter. Ledru (1801) stated, Princess Estate belonged to house of Schimmelman of Copenhagen. Variously called: La Princesa, La Princessn, La Princesse, La Grande Princesse, La Princeso Grande, Great Princess, Grand Princess, Plantagien Prinsessen, Prindsesse. Prinsesse, Yrintsessen, Princess, Prinzessin-Qunrtier."
      },
      {
        "entryId": "prince",
        "name": "Prince",
        "type": "quarter",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Prince; Quarter or rural district of St. Croix; 16, 000 feet wide, bounded north by Northside A and B, east by King Quarter, west by Westend, south by Caribbean Sea. Danish, Prindsens Kvarteer. Population (1917), 1, 678."
      }
    ]
  },
  {
    "estateGeoid": "1671",
    "estateName": "LITTLE PROFIT",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "profit",
        "name": "Profit",
        "type": "estate",
        "island": "stx",
        "quarter": "KING",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Profit; Estate, southern thirds of tracts 23 and 24, nnd iiorthern thirds of 27 and 28, King Quarter, St. Croix; same a s Raapznat Heylinger's Plantage (17%). Mill in southern bowl of Kingshill Range. -Dewitz."
      }
    ]
  },
  {
    "estateGeoid": "1924",
    "estateName": "LONG POINT & COTTON GARDEN",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "long-point",
        "name": "Long Point",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 505,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Long Point; Low, grassy, salient, projecting on south const of St. Croix, 3% miles east of Southwest Point, at southeast corner of Westend Quarter; formed by $ mile offset of shore trend. Part of estate patented to Kiammerraad Johrirines S$b@dker. Called by French, \" Pointe Espagnole \"; by Danish, \" Lang Pynt, \" or I ' Lnngpynten. \"-L. & W. 4 miles ESE. of Cockroach Cay. Derrotero as \" Pefion Escarpado \" ( LI rugged crag)."
      },
      {
        "entryId": "long-point-bay",
        "name": "Long Point Bay",
        "type": "bay",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Long Point Bay; Chart name of Longpoint or ltuan Bay, south coast of St. Croix. Variously called : Langpynt, Lung Pynt, Lang I'iint, Longpoint; Rowan, Rouan, Ruan; Bois-Abattu."
      },
      {
        "entryId": "point",
        "name": "Point",
        "type": "estate",
        "island": "stj",
        "quarter": null,
        "confidence": 145,
        "reasons": [
          "estate name contains entry name",
          "different island penalty"
        ],
        "description": "Point; but C. P. , pp. 116, 130-1, extends limit west to Lucas Pdnt, -H. 0. 3903, & Publ. 129. Spanislb Bahia, Perseverancia 6 BnaenQda de la Perseverancia. Called '' Flamingopop Bay, \" by -~oxAbeck; last applies k t to northwestern portion only, off low beach. Crolx. -- 148 of 215 GEOGRAPEZTC TJICTICINARY OF THE VIRGIN ISLANDS 145 Peru, : 'Bev&P&ntli trenfhry French Plantage, near present Humbug Estate, Peschdo, Gallo; Spanish equivrllent of Fleh Cay, St. John. Pcnmclo, lhtaenada ncl: Spanish name o f Fish Bay, St. John. -Den."
      }
    ]
  },
  {
    "estateGeoid": "1930",
    "estateName": "LONGFORD",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "longford",
        "name": "Longford",
        "type": "estate",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Longford; Large Estate, occupying southeast portion of Company Qu:irtcr, St. Croix. Comprising former Plantnges of Nicol: Tuite (N. ?. $ of 27 and 28, E. )/2 of 29), Francis Surlaine (remainder of 27 to 5. coast), E'errall (remainder of ZS), part of Christopher McWoy's Plantage (26 and 3. M of 22); and shore of Spring Bay. Farmstead centrnlly located, connected by road zh mile long with Halfpenny Bay. -Quln; Zabrisbie; Eggers. Also spelled, Langford."
      }
    ]
  },
  {
    "estateGeoid": "1752",
    "estateName": "LOWER LOVE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "lower-love",
        "name": "Lower Love",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Lower Love; Estate, comprising tiacts 30 aid-31 of Prince Quarter, St. Croix. With Ujqler Love, patriiriony of L n c n s c l r Windt's heirs. IZs~ritclic~urt~:; 50 yards north of Centerline Road, sam6 distance we#t of Jeiiloufiy Gut. -Q. ; %. ; Nap 3242. Yirst corn inill on Xt. Croix erected here in 1918."
      },
      {
        "entryId": "lower-love",
        "name": "Lower Love",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Lower Love. --Oxholm; Is, '& W:, With OM Love or Upper Love, patrimony of Lucas de \\VindO'e arvinger (heirs). -Beck."
      }
    ]
  },
  {
    "estateGeoid": "1945",
    "estateName": "LOWRY HILL",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "lowry-hill",
        "name": "Lowry Hill",
        "type": "quarter",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Lowry Hill; NstritC, 22, ICastend A Quarter, St. Croix. S i t n a t 4 1% Iniles enst of Cllristiairsted, west side of road to Petronella, a t 230-fmt col of main wiitersliecl, 360 yards east of 43S-foot hill. Called Lowry's Hill, by Oxholm, from C:wrge Loury, proln'ietor (li64). A century later, w e of the hrrirsei~ Estatrti. See Prt ronelh. ~LWWSTIiZl; Lowry Hill $Mute, Eastend A Quarter, S t. Croi1. --Oxho11~i; P. D. J."
      }
    ]
  },
  {
    "estateGeoid": "1775",
    "estateName": "MADAM CARTY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "carty",
        "name": "Carty",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Carty; Estate of Madame Carty. formerly western portion of Plantage of Darby Carty, on shore of Rod Bay; tract 14, Eastend B Quarter, south mast of St. Croix. -Oxholm; H. 0. 1423. On shore of Carty estate is a oonepicuoue point or projecting bluff, rising to 76-foot knoll, about middle of shore of Bod Bay. , CarVal Rock; Islet, 67 feet hlgh, 65 yards long, area 64 square rods; lat. 18' 22' l. 8\" (550 m. ); long. 64' 47' 41\" (1, 198 m. ); 440 yard6 eastward of"
      }
    ]
  },
  {
    "estateGeoid": "1707",
    "estateName": "MANNING'S BAY",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1946",
    "estateName": "MARIENHOJ",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1706",
    "estateName": "MARS HILL & STONY GROUND",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "mars-hill",
        "name": "Mars Hill",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 485,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Mars Hill; Estate, 22 of Weste~idQuartgy, St, G r o l e ~Qrk&allj on& a o r t h I, $ (22a), deeded to P4u3 Vauga4 qand called \"The Oval, \" or '' Marahlll\": enlarged by accretion Of WWl ?6, (?&I, deeded tQiJ?hll EI, Barn& W ~ k l on west-and south by Cknterline mad, Yoatly iq gugar cane; panatum 1oGG34\"--26~ I -- 129 of 215 126 U. 8. COAST AND GEODETIC SURVEY in northwest and southwest. Mill % mile southeast of Blederiksted. -f. b: W. Now united to Wheel-of-Fortune, adjoining Elstate on north. -Millspaugh."
      }
    ]
  },
  {
    "estateGeoid": "1700",
    "estateName": "MARY'S FANCY",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1890",
    "estateName": "MINT",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "mint",
        "name": "Mint",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 175,
        "reasons": [
          "exact estate name",
          "quarter agreement"
        ],
        "description": "Mint; Estate, 26b (east 1/$ of 26), adjoining Mountain Estate, north of 'Centerline Road, Prince Quarter, St, Croix. Deeded to George Gasling (1754), and hamed \" t h e Mint\" (1799). All i n sugar cane, as f a r as Mint Gut in northern cornel"
      }
    ]
  },
  {
    "estateGeoid": "1726",
    "estateName": "MON BIJOU",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1721",
    "estateName": "MON BIJOU / BLUE MT",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1976",
    "estateName": "MONTPELLIER",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "montpellier",
        "name": "Montpellier",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Montpellier; Estate, 7 and north % of 10, northern tier of Prince Quarter. deeded to Ferrall Nugent. Produces rrugar cane and guava@. Southeast ' of Mill, road crosses col on watershed between west and south slopes of"
      }
    ]
  },
  {
    "estateGeoid": "1732",
    "estateName": "MONTPELLIER (I)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "montpellier",
        "name": "Montpellier",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 110,
        "reasons": [
          "estate name contains entry name",
          "quarter agreement"
        ],
        "description": "Montpellier; Estate, 7 and north % of 10, northern tier of Prince Quarter. deeded to Ferrall Nugent. Produces rrugar cane and guava@. Southeast ' of Mill, road crosses col on watershed between west and south slopes of"
      }
    ]
  },
  {
    "estateGeoid": "1854",
    "estateName": "MONTPELLIER (II)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "montpellier",
        "name": "Montpellier",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 110,
        "reasons": [
          "estate name contains entry name",
          "quarter agreement"
        ],
        "description": "Montpellier; Estate, 7 and north % of 10, northern tier of Prince Quarter. deeded to Ferrall Nugent. Produces rrugar cane and guava@. Southeast ' of Mill, road crosses col on watershed between west and south slopes of"
      }
    ]
  },
  {
    "estateGeoid": "2007",
    "estateName": "MORNING STAR",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1715",
    "estateName": "MOUNT EAGLE",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "mount-eagle",
        "name": "Mount Eagle",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Mount Eagle; Loftiest peak on St. Croix, altitude 1, 165 feet; lat. 17\" 46' 47. 06\", long. 64\" 48' 43. 15\", in north end of Calhoun's Solitude Estate. Northside B Quarter, 3% miles east of Ham Bluff, St. Croix. On Oldendorp's map by Paul KIiffner (1767), called simply, \" Hijchste Berg\" (highest mountain)."
      }
    ]
  },
  {
    "estateGeoid": "1672",
    "estateName": "MOUNT FANCY",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "mount-fancy",
        "name": "Mount Fancy",
        "type": "bay",
        "island": null,
        "quarter": "EASTEND",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Mount Fancy; 245 feet high, lat. 17\" 43' 30\" (924 meters), long. 64\" 38' 25\" (729 meters). Con:. icuons double hill, forming east point of Great Pond Bay, southwest of Cottongrove, Eastend A Qr. , 8. coast of St. Oroir. Stock farm attached to Cottongrove. -8corpion."
      }
    ]
  },
  {
    "estateGeoid": "1948",
    "estateName": "MOUNT PLEASANT (East)",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "mount-pleasant",
        "name": "Mount Pleasant",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Mount Pleasant; Estate, 36 and 37, on south side of Centerline Road, Prince Qr. , St. Croix. Buildings on northwest slope of grassy hill, so-called, 4 miles east of Frederiksted. Tract 37 was Irwin's Plantage, patented to Andreis Irvin. N. Jb of 36 belonged (1'7M) to Smith and Cunningham, remainder to \" Will. Ravensk. \"-Oxholm; D. Bounded north by Plessen, east by Adventure, south by Paradise, weat by (Big) Diamond Corn p:itch ( 525 yards square in southwest comer; remainder, except hill, in sugar cane, United to Plessen, as Qrant Estates. +fountPleasant; Mount Victory Estate, St. Urolx. --& 0. lrlw. ~ o u l a tPleasant; Testman's '' Little Fountain \" Estate, 11Northeide B Quarter, Yount Pleasant (Colquohoun) : Same a8 Colquohoun Mt. Pleasant, Q. v. , St."
      }
    ]
  },
  {
    "estateGeoid": "1711",
    "estateName": "MOUNT PLEASANT (North)",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "mount-pleasant",
        "name": "Mount Pleasant",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Mount Pleasant; Estate, 36 and 37, on south side of Centerline Road, Prince Qr. , St. Croix. Buildings on northwest slope of grassy hill, so-called, 4 miles east of Frederiksted. Tract 37 was Irwin's Plantage, patented to Andreis Irvin. N. Jb of 36 belonged (1'7M) to Smith and Cunningham, remainder to \" Will. Ravensk. \"-Oxholm; D. Bounded north by Plessen, east by Adventure, south by Paradise, weat by (Big) Diamond Corn p:itch ( 525 yards square in southwest comer; remainder, except hill, in sugar cane, United to Plessen, as Qrant Estates. +fountPleasant; Mount Victory Estate, St. Urolx. --& 0. lrlw. ~ o u l a tPleasant; Testman's '' Little Fountain \" Estate, 11Northeide B Quarter, Yount Pleasant (Colquohoun) : Same a8 Colquohoun Mt. Pleasant, Q. v. , St."
      }
    ]
  },
  {
    "estateGeoid": "1763",
    "estateName": "MOUNT PLEASANT (South)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "mount-pleasant",
        "name": "Mount Pleasant",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Mount Pleasant; Estate, 36 and 37, on south side of Centerline Road, Prince Qr. , St. Croix. Buildings on northwest slope of grassy hill, so-called, 4 miles east of Frederiksted. Tract 37 was Irwin's Plantage, patented to Andreis Irvin. N. Jb of 36 belonged (1'7M) to Smith and Cunningham, remainder to \" Will. Ravensk. \"-Oxholm; D. Bounded north by Plessen, east by Adventure, south by Paradise, weat by (Big) Diamond Corn p:itch ( 525 yards square in southwest comer; remainder, except hill, in sugar cane, United to Plessen, as Qrant Estates. +fountPleasant; Mount Victory Estate, St. Urolx. --& 0. lrlw. ~ o u l a tPleasant; Testman's '' Little Fountain \" Estate, 11Northeide B Quarter, Yount Pleasant (Colquohoun) : Same a8 Colquohoun Mt. Pleasant, Q. v. , St."
      }
    ]
  },
  {
    "estateGeoid": "1670",
    "estateName": "MOUNT RETREAT",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1903",
    "estateName": "MOUNT STEWART",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "mount-stewart",
        "name": "Mount Stewart",
        "type": "hill",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Mount Stewart; 878 feet. high, pea on Northslde-Westend watershed, Jb mile St. Croix. Cr. -Qnln; L. and W. ; Dewitz. From name of 695-foot hill near wwt edge. weet of Bodkin Bill, St, C r o k -- 135 of 215 183"
      }
    ]
  },
  {
    "estateGeoid": "1722",
    "estateName": "MOUNT VICTORY",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1929",
    "estateName": "MOUNT WELCOME",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1761",
    "estateName": "MOUNTAIN",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "mountain",
        "name": "Mountain",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Mountain; Estate, 26a (West % of 26), Prince Quarter, St. Crolx; deeded to"
      },
      {
        "entryId": "wontpellier-mountain",
        "name": "Wontpellier Mountain",
        "type": "hill",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Wontpellier Mountain; Ridge west of upper course of Advwture Gut, southernmost spur of Bodkin Ridge, St. Croix."
      },
      {
        "entryId": "moatpellier-mountain",
        "name": "Moatpellier Mountain",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Moatpellier Mountain; Small Estate, of less than 60 acrw, west 48 of tract 12, Prince Quarter, on Ridge so called."
      },
      {
        "entryId": "blue-mountain",
        "name": "Blue Mountain",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Blue Mountain; Summit, 1, 090 feet high, 1%miles southeast of Cane Bay, cast of Hermitage Estate, o r west of Heytiger's tract 4, St. Croix. 4 x b o l m; Eggers."
      }
    ]
  },
  {
    "estateGeoid": "1847",
    "estateName": "NEGRO BAY",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "negro-bay",
        "name": "Negro Bay",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Negro Bay; open bight on eouthern coast of St. m i x; located by H. M. S. b'corpion at south shore of Bn+y Estate, but by recent surveys (T. 3838) at Cooper Bay Estate. Also called, Negerhay, Neeger Bay, Narrow Bay, etc. B. A. 130; Dewitz."
      }
    ]
  },
  {
    "estateGeoid": "1654",
    "estateName": "NICHOLAS",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "nicholas",
        "name": "Nicholas",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Nicholas; Egtate, comprising tracts 34, 25 and 15; together forming a block - 2, 000 Danlsh feet i n width, and 6, 600 Danish feet north-south; chiefly eitw ated on a plateau over 700 feet above sea level; Mill 725 yards northeast of Mount Washington, Northside A Quarter, St. &ob. Spelled &o, Niceias. See: Prospect Hill. ' lPIcoZaef Nicholas Estate, St. Croix. -H. 0. f42. 3, NEeek~; Same as Nisky, Moravian Mission in SL Thomas; named for Niwky in Silesia, near Baxonytt8tWer; 2. ; B4. b F. ; Knox; Oldendorp; B. k 2452, n83."
      }
    ]
  },
  {
    "estateGeoid": "1922",
    "estateName": "NORTH GRAPETREE BAY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1728",
    "estateName": "NORTH HALL",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "north-hall",
        "name": "North Hall",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "North Hall; Old Estate in dell north of Crequis Gat, west of Nicholas Road,"
      }
    ]
  },
  {
    "estateGeoid": "1665",
    "estateName": "NORTH SLOB",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1784",
    "estateName": "NORTH STAR",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1659",
    "estateName": "NORTHSIDE",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "northside",
        "name": "Northside",
        "type": "estate",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Northside; Estate on seacoast a t northwestern extremity of St. Crojx; including tracts originally patented to both Richard Richardson and Obrist. Lieut. Ripstorff. Some sugar cane cultivated In nostheast portion; remainder but&, Village 4Q lalie southwest of Ham Bay. Also spelled,"
      },
      {
        "entryId": "northside-bay",
        "name": "Northside Bay",
        "type": "bay",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Northside Bay; 4 milee wide, irlwularly crescentic big& extending b e t w w Ham Bluff and Canebay Point, along shores of Northside A and Northside B Quarters, St. Croix. . . 4"
      },
      {
        "entryId": "northside-road",
        "name": "Northside Road",
        "type": "road",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Northside Road; Turns off north from Centerline Road, St. Croix, betweenMount Pleasant and Plessen; skirts Groveplace; travereas Upper Love, River, Parasol, and Prosperity, to north coast; thence east alongshore passing Northstar, Canebay, Lavallee, and Rustoptwist Estates, arid Baron Bluff, to Salt River."
      },
      {
        "entryId": "little-northside",
        "name": "Little Northside",
        "type": "quarter",
        "island": null,
        "quarter": "LITTLE NORTHSIDE",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Little Northside; Quarter of R t. Thomas Island, bounded by a line following the watersheds from Vluck Point to Crown Mountain, Signal Hill, and Dorothea Point, and including the Brass Islands. Population (1917) 86, including 4 whites."
      },
      {
        "entryId": "northside-a-quarter",
        "name": "Northside A Quarter",
        "type": "estate",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Northside A Quarter; now part of Prosperity Estate, Q. v."
      },
      {
        "entryId": "northside-b",
        "name": "Northside B",
        "type": "quarter",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 150,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Northside B; Quarter or rural district of St. Crois; conterminous on south with Company, Queen, Kin& and Prince Quarters; bounded west by Northside A, and north by Caribbean Sea. Population (1917) 108. DanIsh, Nordside B. -Letter OE Gtoveraor of VIrgin Wands of United States, 4-18-25"
      },
      {
        "entryId": "great-northside",
        "name": "Great Northside",
        "type": "bay",
        "island": "stt",
        "quarter": "GREAT NORTHSIDE",
        "confidence": 105,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Great Northside; ()ii:irttv of St. Tlioni:is, enhrric*inc t h r nnrthrrri sliore and slope from J)orothra l'oirit to Tutu Buy, part of ilie ~ i o r t h c i ~ ~ i canvirons of St. 'I'lioin:is City, nnct the Hiins-Lollik lnlfrritis. Populiitiori (1O17), 292; including 74 whites. (Jrwt Northrtidc I j n l i : Sniiie as Tiiwk, hfiigctn. Nor(h+lr, or Store-Nortl4tle Bay, q. v. , St. Thomas. -Censi~s Report of 1917, p. 164 (Northside Qmirter). Also writtcn Great North Ride I(ay. -West Indian Pilot, H. 0. and I;. A. ; €3. A. 130, 2452; H. 0. 1002. ffreot h70rt7t Side Qiiartsr; Great Northside Qusrtcr, St. Tlioniiis --C'ensus."
      }
    ]
  },
  {
    "estateGeoid": "1850",
    "estateName": "OLD HOSPITAL GROUNDS",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "hospital",
        "name": "Hospital",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Hospital; (:roiiii!ls, 750 by 7, OOO feot, :itlJtiiniiig (, I ~ P \\ ~ Iiiiiihted, St. Croix, on southeast, with Iwildlngs on spur of Recovery Ridge."
      }
    ]
  },
  {
    "estateGeoid": "353",
    "estateName": "ORANGE GROVE (East)",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      }
    ]
  },
  {
    "estateGeoid": "1735",
    "estateName": "ORANGE GROVE (West)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "grove",
        "name": "Grove",
        "type": "quarter",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Grove; Idst:itc, , eaqt W of trxct 11 (. John Willimiq), Eastentl B Quarter, St. Croix. Called by Oxholm, \" the grove. \" Ruins, chimney, and row of pillnrs found (1W1) a t Cotton Valley Trail's-eqd."
      }
    ]
  },
  {
    "estateGeoid": "1729",
    "estateName": "OXFORD",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "oxford",
        "name": "Oxford",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Oxford; IZstritr, 5 :ind G, southern tier of Nortlislde A Qimrter, St. Crofs. In 176-1, prol)tvfh of \\ V i l l i n i n Lowk widow. Estateliouse in picturcsqiie v1111eph ~ : i d. Ciirr~lieldthencc along north slde of roud to Oxford IIiII. --L. & W. ; D. Ndthrope's Estnte, with Rustoptwist (1881). -Scorpion."
      },
      {
        "entryId": "oxford-road",
        "name": "Oxford Road",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Oxford Road; Lenrcs n1:ihogany Roritl u t 'Jolly Hill Estate, ascends Oxford Giit, mund crosses hills north-northeast to Annnly, St. Croix. O d l < J h I; in 1661, X ~ t n t o sof F. von Oxholm embraced Dinmond nnd Ilr~by;"
      }
    ]
  },
  {
    "estateGeoid": "1767",
    "estateName": "PARADISE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "paradise",
        "name": "Paradise",
        "type": "estate",
        "island": null,
        "quarter": "PRINCE",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Paradise; Estate, northern % of tracts 44 and 45, Prince Quarter, St. boix."
      }
    ]
  },
  {
    "estateGeoid": "1719",
    "estateName": "PARASOL",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "parasol",
        "name": "Parasol",
        "type": "estate",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Parasol; Estate 16, Northside B Quarter, St. Crolx. 747-foot peak on main watershed, about center; along western slope, road from River to Prosperity; mill on road in southwest corder. Stockform, nttached to Fountain."
      },
      {
        "entryId": "parasol-hill",
        "name": "Parasol Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Parasol Hill; Ridge extending southeast from 747-foot penk about center of Parasol Estate, on Northside watershed, % mile from northern coust of St. Croix. -Eggers."
      }
    ]
  },
  {
    "estateGeoid": "1692",
    "estateName": "PEARL",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "pearl",
        "name": "Pearl",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Pearl; Estate, 38, 43, e, Qneen (Dronning) Quarter, St. Oroiat: emtsaciag 3, 000 feet square, southwest of intersection of Seuthside and Canegarden Roads, with strip 1, OOO feet wide to Canegarden Bay, southera coust. Abraham Heyliger's Plantage."
      }
    ]
  },
  {
    "estateGeoid": "1749",
    "estateName": "PETER'S REST",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1734",
    "estateName": "PETERS FARM",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1742",
    "estateName": "PETRONELLA",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "petronella",
        "name": "Petronella",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Petronella; Estate in Eastend A Quarter, St. Croix; comprising tracts 30 (inherited from William Strltiron) and 39a (of which the north l/r, originally belonged to Elizabeth Farrington, and the south % to Hecky & Anderson). The present Petronella Ektate measures 2, 000 to 8, 000 Danish feet, with a small added parcel for a landing on Great Pond Bay. Petronella Mill is on the brow of a low ridge forming the southeast spur of Carina Mountain, % mile northwest of Great Pond. South of the mill, and east of the road, is a cotton plantatioa. --Oxholm; Dewitz. Name misspelled Petranella In 1854 refirted under joint ownership with Sally's Funcy, Sight, Lowry Hill, etc."
      }
    ]
  },
  {
    "estateGeoid": "1724",
    "estateName": "PLEASANT VALE",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1778",
    "estateName": "PLEASANT VALLEY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "pleasant-valley",
        "name": "Pleasant Valley",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Pleasant Valley; Estate, western tract 17, deeded to Thomas anrl Seth Smith, situated on Crequis Road, near head of Crequjs Valley, Northside A Quarter, St. Croix. Produces guavas, some cane. A h called, Pleasant Vale, or Pleasantvale."
      },
      {
        "entryId": "valley",
        "name": "Valley",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Valley; Estate, 3 and 4a, Daniel Mallet's Plantage, Eastend B Quarter, St. Croix. Estate hoiise rulna in hcad of glen reached by trail from Hodge Estate. Mi11 formerly on ridge to east. -Map 3242. Called by Oxholm, \"the Valley. \""
      }
    ]
  },
  {
    "estateGeoid": "1780",
    "estateName": "PLESSEN (North)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "plessen",
        "name": "Plessen",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Plessen; Estate, 28 and 29, center of Prince Quarter, St. Croix; measuring 4, 000 by 3, 000 feet, on north side of Centerllne Road, and intersected bp south end of Northside Road, to east of which are estnte buildings on 117-foot rise. Produces sugar cane, provisions, and pasturage. Inheritance. from Wllllam Ryan. East % of tract 12, portion of John Baker's plantage, now belongu to Plessen. -Oxholrn; L. Sr W; Dewitr, Mount Pleasant, adjoining on south, united under ownership of Sir R. J. Want. --Scorpion."
      }
    ]
  },
  {
    "estateGeoid": "1755",
    "estateName": "PLESSEN (South)",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "plessen",
        "name": "Plessen",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Plessen; Estate, 28 and 29, center of Prince Quarter, St. Croix; measuring 4, 000 by 3, 000 feet, on north side of Centerllne Road, and intersected bp south end of Northside Road, to east of which are estnte buildings on 117-foot rise. Produces sugar cane, provisions, and pasturage. Inheritance. from Wllllam Ryan. East % of tract 12, portion of John Baker's plantage, now belongu to Plessen. -Oxholrn; L. Sr W; Dewitr, Mount Pleasant, adjoining on south, united under ownership of Sir R. J. Want. --Scorpion."
      }
    ]
  },
  {
    "estateGeoid": "1703",
    "estateName": "PROFIT",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "profit",
        "name": "Profit",
        "type": "estate",
        "island": "stx",
        "quarter": "KING",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Profit; Estate, southern thirds of tracts 23 and 24, nnd iiorthern thirds of 27 and 28, King Quarter, St. Croix; same a s Raapznat Heylinger's Plantage (17%). Mill in southern bowl of Kingshill Range. -Dewitz."
      }
    ]
  },
  {
    "estateGeoid": "1744",
    "estateName": "PROSPECT HILL",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "prospect-hill",
        "name": "Prospect Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Prospect Hill; Estate in Eastend A Quarter, St. Croix; compriglng, accordlng to recent survey, tracts 28 (Elisabeth Farrington) and 29 (Crlstopher McWoy). Corresponding estate, not named, according to Oxholm, comprised tract 28, with estate buildings on 11111 in southeast corner, with addition of tract 40b (John Hodge) on south, but leaving 29 to Petronella."
      }
    ]
  },
  {
    "estateGeoid": "1839",
    "estateName": "PROSPECT HILL WEST",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "prospect-hill",
        "name": "Prospect Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Prospect Hill; Estate in Eastend A Quarter, St. Croix; compriglng, accordlng to recent survey, tracts 28 (Elisabeth Farrington) and 29 (Crlstopher McWoy). Corresponding estate, not named, according to Oxholm, comprised tract 28, with estate buildings on 11111 in southeast corner, with addition of tract 40b (John Hodge) on south, but leaving 29 to Petronella."
      }
    ]
  },
  {
    "estateGeoid": "1663",
    "estateName": "PROSPERITY",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "prosperity",
        "name": "Prosperity",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Prosperity; Estate, on we8tern coast of St. Croix, % mile north of Fredericksted, between William and Lagrange Estates; comprising tracts 31, 36, and 36, in north tier of Westend Quarter, measuring 6, 360 by 3, 000 feet. Bulldlngs from 140 to 560 yards from shore. Beach in pasture: west % and southeast corner in sugar cane: mahogany grove adjoining Prosperity Garden; hill covered with buah. Prosperity and William together were patented to John Boyd. -L C W. : Dewltz; Beck. H. 0. 1409 indicates"
      },
      {
        "entryId": "prosperity-clarden",
        "name": "Prosperity Clarden",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Prosperity Clarden; I n lower portion of Prosperity V a l l t ~;, with a mahpgi1n. 1' grove, 800 to 1, OOO yards. east of Prosperity Estate village, Westend Quarter, St. Croix. -T. 3798."
      },
      {
        "entryId": "prosperity-gut",
        "name": "Prosperity Gut",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Prosperity Gut; Torrentbed W mile long, from near northeastern corner of Prosperity Estate, watering Prosperity Valley a d Garden, Westend Quarter, St. Croix."
      },
      {
        "entryId": "prosperity-ridge",
        "name": "Prosperity Ridge",
        "type": "road",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Prosperity Ridge; Northerly apur of St. Croix dividing ridge, formiag bluff at shore, where Northside 'Road descends elope, mile east of Prbsperitg MLII."
      }
    ]
  },
  {
    "estateGeoid": "1652",
    "estateName": "PROSPERITY EAST",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "prosperity",
        "name": "Prosperity",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Prosperity; Estate, on we8tern coast of St. Croix, % mile north of Fredericksted, between William and Lagrange Estates; comprising tracts 31, 36, and 36, in north tier of Westend Quarter, measuring 6, 360 by 3, 000 feet. Bulldlngs from 140 to 560 yards from shore. Beach in pasture: west % and southeast corner in sugar cane: mahogany grove adjoining Prosperity Garden; hill covered with buah. Prosperity and William together were patented to John Boyd. -L C W. : Dewltz; Beck. H. 0. 1409 indicates"
      }
    ]
  },
  {
    "estateGeoid": "2041",
    "estateName": "PROTESTANT CAY",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "protestant-cay",
        "name": "Protestant Cay",
        "type": "cay_or_island",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Protestant Cay; Islet, 38 feet high, 300 yatds long, area 3. 94 acres, 160 yards from shore, in Christiansted Harbor, St. Croix, Flagstaff marks Pilot station (Danish, \" Lods \"); whence sometimes called Lodskaien. Composed of conglomerate, consisting of well-waterworn Bluebeach pebble, embedded in calcareous mud. %foot reef extends northwrst 270 yards. Called by Spanish, \" Cayo Proteeante \"; by Dutch, '' Loots Kay \"; by Danish, \"Protestantkai \"; by LHru, I' Illot a u nard de la Ville. \" Site of Fort Sofla Frederika, q. v. ; also of large cistern. U. 8. C086T AND GaoDETIc SURVEY"
      }
    ]
  },
  {
    "estateGeoid": "1785",
    "estateName": "PUBLIC PORT SITE (Filled Lands)",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1731",
    "estateName": "PUNCH",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "punch",
        "name": "Punch",
        "type": "estate",
        "island": null,
        "quarter": "NORTHSIDE",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Punch; Estate, 4 (Roger Verrall) in southern tier of Northside A Quarter,"
      },
      {
        "entryId": "punch-valley",
        "name": "Punch Valley",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 170,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Punch Valley; One 00 three ravfnes heading in Punch Estate, Northside A Quarter, St. Croix; two supplied by springs; one in head of ravine 140 yards northwest of Punch Mill on 086-foot hill; whence flows a torrent 1, oOO yards northwest to join Crequis Gut, with waterfall 100 yards from mouth."
      },
      {
        "entryId": "punch-hill",
        "name": "Punch Hill",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Punch Hill; 704 feet high, lat. 17\" 44' 39\" (1, 204meters), long. 64\" 52' 31\" (922 meters); 710 yards west of Punch Mill, on old Sebodker or Soebetker Estate, St. Croix."
      },
      {
        "entryId": "punch-l-alen",
        "name": "Punch L)alen",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Punch L)alen; Dnnlsh name of Punch Valley, St. Uroix. -Eggers."
      }
    ]
  },
  {
    "estateGeoid": "1974",
    "estateName": "RATTAN & BELVEDERE",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "rattan",
        "name": "Rattan",
        "type": "estate",
        "island": "stx",
        "quarter": "WEST END",
        "confidence": 505,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Rattan; Estate in Queen (Dronning) Quarter, St. Croix; comprising tract 14 (Atkins Plantage), 15 with south I/a of 10 (Schuster Plantage). Estatehouse and mill on southwest end of ridge rising to 550 feet."
      },
      {
        "entryId": "belvedere",
        "name": "Belvedere",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 485,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Belvedere; Estate, tract 23, Kortlisitlr Quarter W, r& mile from north coast,"
      },
      {
        "entryId": "rattan-hills",
        "name": "Rattan Hills",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Rattan Hills; Mountain mnss occupying most of Rattan Estate, and southwestern edge of St. , Jobn Estate, St. Croix. Roadway from east here t u r w north to climb scarp of 500-foot hill (Locally called \"Rattan Hill\"), thence turns northwest, following crest of ridge as far as 660-foot summit (\"Rattan Peak \"), thence southwest to Rattan Mill."
      },
      {
        "entryId": "belvedere-mil",
        "name": "Belvedere mil",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Belvedere mil; Peak, 780 feet high, lat. 17\" 46' 08. 2\" (252 m. ), long. 04\" 48' 07\" (206 m. ), in southwestern portion of Belvedere Estate, % mile south of Lavallee Bay; St. Uroix."
      },
      {
        "entryId": "rattan-peak",
        "name": "Rattan Peak",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Rattan Peak; 650 feet high, principal and most northerly summit of Rattan Hills, St. Cmix."
      }
    ]
  },
  {
    "estateGeoid": "1855",
    "estateName": "RECLAIMED LAND (FILLED)",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1684",
    "estateName": "RECOVERY HILL",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "recovery-hill",
        "name": "Recovery Hill",
        "type": "quarter",
        "island": "stx",
        "quarter": "COMPANY",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Recovery Hill; Signal Hill, summit of Jacobsberg Ridge. Company Quarter, St. Croix. -- 159 of 215 156 U. 8. COA59f AND QBVRET~c?i:&UBVEY Rock, is known a s Vessup Bay, q. v. -l'. 377&1. Fessup's Biglit, alternar the. -H. 0. 3903."
      },
      {
        "entryId": "recovery",
        "name": "Recovery",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 110,
        "reasons": [
          "estate name contains entry name",
          "quarter agreement"
        ],
        "description": "Recovery; Estate, occupying much of the Cliristiansted Hills, south of eastern portion of city, comprising all of tract 24 except Hospitsl grounds, and northeast Ya of 23, Company Quarter, St. Croir. Plantage of Peter Wood. Resldence at end of trail in glen, % mile south-southeast of t'ort. See Recovery 13111, Rezovery, Jacohsherg, Signal Hill, Hospital, Wood. So-called by C. &"
      }
    ]
  },
  {
    "estateGeoid": "1852",
    "estateName": "RECOVERY-WELCOME",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1968",
    "estateName": "RETREAT",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "retreat",
        "name": "Retreat",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Retreat; Estate, 16a (western s ) in Company Quarter. and 44b (sothem 1h)"
      },
      {
        "entryId": "eliza-s-retreat",
        "name": "Eliza's Retreat",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Eliza's Retreat; Estate. 120 yards south of I. nng's Observatory and 1 mile cast-southpast of Chrlstiansted, St. Croix. -H. 0. 1088, 1423. (1omprisc. s most of tract 2 and north ya of 26 east of road to Springgut Aatldle (Salomon Plantage), with west M of 23 (Boffron, Jncobsbierg), and 36 (Roger). -T. 3799. Stockfnrm, in 1866 belonging to Maj. L a w, K. D."
      }
    ]
  },
  {
    "estateGeoid": "1690",
    "estateName": "RETREAT & PETER'S MINDE",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "retreat",
        "name": "Retreat",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 500,
        "reasons": [
          "estate name contains entry name",
          "exact estate name",
          "entry name contains estate name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Retreat; Estate, 16a (western s ) in Company Quarter. and 44b (sothem 1h)"
      },
      {
        "entryId": "eliza-s-retreat",
        "name": "Eliza's Retreat",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Eliza's Retreat; Estate. 120 yards south of I. nng's Observatory and 1 mile cast-southpast of Chrlstiansted, St. Croix. -H. 0. 1088, 1423. (1omprisc. s most of tract 2 and north ya of 26 east of road to Springgut Aatldle (Salomon Plantage), with west M of 23 (Boffron, Jncobsbierg), and 36 (Roger). -T. 3799. Stockfnrm, in 1866 belonging to Maj. L a w, K. D."
      }
    ]
  },
  {
    "estateGeoid": "53",
    "estateName": "RICHMOND",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "richmond",
        "name": "Richmond",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Richmond; Estate, composed of portlons of tracts 1 and 2, Company, Quarter,"
      },
      {
        "entryId": "richmond-jail",
        "name": "Richmond Jail",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Richmond Jail; Penltentiary for the Virgin Islands of the United States, located 400 yards northwest of Richmond Estatehouse, St. Croix. -Lightbourn; Scorpton."
      },
      {
        "entryId": "richmond-prisonland",
        "name": "Richmond Prisonland",
        "type": "estate",
        "island": "stj",
        "quarter": "COMPANY",
        "confidence": 105,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "different island penalty",
          "quarter agreement"
        ],
        "description": "Richmond Prisonland; Portion of tract 2, Company Quarter, St. Croix, lyisp along west side of Christiansted Harbor, north of Richmond Estate aztd Alderhvile, east of Orangegrove, Lloutheast of Qolden Rock. Site of jail, insane asylum, leper asylum, nad central sugar factory, q. v. Point. -€3. A. 2183. Spanlsh, Playa Reveage (Vengapza). fiit Bay; Same as Reef Day, St. John; -P. D. J. i Dan. 80, 266."
      }
    ]
  },
  {
    "estateGeoid": "2424",
    "estateName": "RICHMOND (ALDERSVILLE)",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "richmond",
        "name": "Richmond",
        "type": "estate",
        "island": null,
        "quarter": "COMPANY",
        "confidence": 110,
        "reasons": [
          "estate name contains entry name",
          "quarter agreement"
        ],
        "description": "Richmond; Estate, composed of portlons of tracts 1 and 2, Company, Quarter,"
      }
    ]
  },
  {
    "estateGeoid": "1727",
    "estateName": "RIVER",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "river",
        "name": "River",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "River; Estate in northeast part of Prince Quarter, St. Croix; cninprisinn tracts 2, 3, 14, 15, patented to Governor Johann d e Windt 6 St. Eustatius; with addition of 4a (S. 2/Y, portion of inheritance of. John Willet's heirs). Tptal area, about 682 acres. Watered by Jealousy Gut. Traversed by Northside Road. G. P. , \" River Mill. \" W. Newton, owner; also of Castle Burke. -Scorpion."
      },
      {
        "entryId": "saltriver-b-and-y",
        "name": "Saltriver B&Y",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Saltriver B&Y; Ifi. efgll&*inlet, W i t h BeOeral a m Liordered by mbngrove ewamps, spdning dh northern Cmet oi. m. Croix, long. 84. 46' 11\" to @\". Chart 905. Variants : Salt Revier Bay, Saltrewierbdyen, SaltrlvGr Fiord, Salt River Bdy, XiaWivi~Ww, S6ltfladi9ord, Bahia del N o Sblado, e&. dazt altcer kqy; &me as Saitriqer Bag, St. fMiIx. -P. D. J. ; Dewita,"
      }
    ]
  },
  {
    "estateGeoid": "1679",
    "estateName": "ROBERTS HILL",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1902",
    "estateName": "ROSE HILL",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1699",
    "estateName": "RUBY",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1739",
    "estateName": "SALLYS FANCY",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "2008",
    "estateName": "SALT RIVER",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "river",
        "name": "River",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "River; Estate in northeast part of Prince Quarter, St. Croix; cninprisinn tracts 2, 3, 14, 15, patented to Governor Johann d e Windt 6 St. Eustatius; with addition of 4a (S. 2/Y, portion of inheritance of. John Willet's heirs). Tptal area, about 682 acres. Watered by Jealousy Gut. Traversed by Northside Road. G. P. , \" River Mill. \" W. Newton, owner; also of Castle Burke. -Scorpion."
      }
    ]
  },
  {
    "estateGeoid": "1677",
    "estateName": "SEVEN HILLS",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "seven-hills",
        "name": "Seven Hills",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Seven Hills; Group of hills in eastern part of St. Croix, including Maupt"
      }
    ]
  },
  {
    "estateGeoid": "1655",
    "estateName": "SHOYS",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1951",
    "estateName": "SIGHT",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "sight",
        "name": "Sight",
        "type": "estate",
        "island": "stx",
        "quarter": "EASTEND",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Sight; Estnte, tracts 20 and 32, measuring 2, 000 by 4, 500 feet, Eastend Qunrter, St. Croix. In 1754 belonged to heirs of Oov. Johnnnes Heyliger. It occupies a gap of central ridge between Maria Hill and Mt. Washington. Road ncross island from Southgate to Great Pond traverses eastern edge of'Sig1it Estate. -Q. ; 2. Scorpion survey reported this united with Sally's Fancy, Petronella, and Lowry HIII."
      },
      {
        "entryId": "sight-gap",
        "name": "Sight Gap",
        "type": "hill",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Sight Gap; Space over 1, 000 yards wide, on main watershed of St. Croix between Mnria Hill and Mt. Washington, where elevation suddenly drops to chain of low hills; lowest co1, where road from Southgate Plain crosses townrd Greutpond Pinin, only 140 feet above sea level."
      },
      {
        "entryId": "sight-mill",
        "name": "Sight Mill",
        "type": "hill",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Sight Mill; Prominent object observed by navigntors entering Buck Island Channel, north b? St. Croix. Mill 1s 2% miles east of Christinnsted, in lat. 17\" 44' 32. 01'' (1, 012 meters), long. 64\" 40' 08. 45\" (249 meters), on summit of 180-foot hill commanding view or I' sight \" of both north nnd south coasts, and in sight of mhriners off either: 175 yards east is 200-foot summlt; 260 yards east, 140-foot co1, where road across Island passes gap."
      },
      {
        "entryId": "havensight-point",
        "name": "Havensight Point",
        "type": "point",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Havensight Point; On east sliorc of St. Thomas lliirbor, 400 yurtls"
      },
      {
        "entryId": "sight-mound",
        "name": "Sight Mound",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Sight Mound; H111, site of Sight Mill, q. v. -Bcorpion survey, view."
      }
    ]
  },
  {
    "estateGeoid": "1905",
    "estateName": "SION FARM",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "sion-farm",
        "name": "Sion Farm",
        "type": "estate",
        "island": "stx",
        "quarter": "QUEEN",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Sion Farm; Estate, 26 and 27 on north slde of Centerline Road, with 33b to soiithwest, nll in Queen (Dronning) Quarter; house on 180-foot hill, -- 181 of 215 178 U. S. COAST AND GEODETI0 SURVEY mile south of Sion Hili, St. Croix. Tracts 24, 26, 27, 33b, constituted"
      }
    ]
  },
  {
    "estateGeoid": "1696",
    "estateName": "SION HILL",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "sion-hill",
        "name": "Sion Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "QUEEN",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Sion Hill; 359 feet high, site of estate so-called, Queen Quarter, St. Crolx. l o n Hill; Estate, 22 apd 23, Queen (Dranning) Quarter, St. Croix. L. & W. John Bradskaw's Plantage. -Beck, Bradskaw (Bradshaw) Place. -Oldendorp. Sion hill. -Oxholm."
      }
    ]
  },
  {
    "estateGeoid": "1667",
    "estateName": "SOLITUDE (East)",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1717",
    "estateName": "SOLITUDE (North)",
    "island": "stx",
    "quarter": "NORTHSIDE B",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1925",
    "estateName": "SOUTH GRAPETREE BAY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1875",
    "estateName": "SOUTH SLOB",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1950",
    "estateName": "SOUTHGATE FARM",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "southgate-farm",
        "name": "Southgate Farm",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Southgate Farm; Common name of Southgate Estate, SL Ctoirt, Q. v. -P. D. J. ;"
      }
    ]
  },
  {
    "estateGeoid": "1708",
    "estateName": "SPANISH TOWN",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": []
  },
  {
    "estateGeoid": "1658",
    "estateName": "SPRATT HALL",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "sprat",
        "name": "Sprat",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Sprat; Dutch, S p of; Danish, Brlsling; Spanish, Sardineta or Machuelo. Sprat>IEall; Estate on west coast of St. Croix, Northside A Quarter, between"
      }
    ]
  },
  {
    "estateGeoid": "1712",
    "estateName": "SPRING GARDEN",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1931",
    "estateName": "SPRING GUT",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": [
      {
        "entryId": "spring-gut",
        "name": "Spring Gut",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Spring Gut; Stream, flowing north 1% miles from the Saddle to G a l l o w Bay, north slope of St, Croix. -Eggera"
      }
    ]
  },
  {
    "estateGeoid": "1741",
    "estateName": "SPRINGFIELD",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1956",
    "estateName": "ST GEORGES",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1757",
    "estateName": "ST GEORGES HILL",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1973",
    "estateName": "ST JOHN'S",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": []
  },
  {
    "estateGeoid": "1682",
    "estateName": "ST PETERS",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1770",
    "estateName": "STONEY GROUND (East)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1862",
    "estateName": "STONEY GROUND (West)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1698",
    "estateName": "STRAWBERRY HILL",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "strawberry-hill",
        "name": "Strawberry Hill",
        "type": "estate",
        "island": "stx",
        "quarter": "QUEEN",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Strawberry Hill; Broad bench, with summits 290' to 300 feet high, spur of ridges- on Mary's Fancy Estate, reaching Strawberry hletabviHage, St. Croix. -L. Bt W. 8trawberryhiZl; Strawberry Esttate, Queen (Drondng) Quarter, F3L Ckoix. Oxholm, Dewitz."
      },
      {
        "entryId": "strawberry",
        "name": "Strawberry",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Strawberry. Bill; Original and proper name of Strawberry Estate, St. Croix; named for a suburb of London, England."
      }
    ]
  },
  {
    "estateGeoid": "1718",
    "estateName": "SWEET BOTTOM",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1906",
    "estateName": "TEAGUE BAY",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1932",
    "estateName": "THE SPRINGS",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1695",
    "estateName": "THOMAS",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "unknown",
        "island": "stx",
        "quarter": null,
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Thomas. Named for a colonial family; also spelled Bordeau and Bourdeaux. Buddhoe or Bordeaux, was the negro general of the slave insurrection of 3848, which won emancipation in St. Croix. -Taylor."
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "unknown",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Thomas; 80 designated In Bellin's Atlns, I, 78; French phrase, signifying eimply, '' Landlng for Boats. \" I n Spanish Derrotero, p. 278, described as -- 134 of 215 GEOGRAPHIC DICTIONARY OF TELE VIRGIN ISLANDS 131 \" Buen Desembarcadero en la Pequefla Ensenada de su Costa 0. \" (Good landing in the small cove on its west shore. )"
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 390,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate"
        ],
        "description": "Thomas. -Reichel; Hornbeck; Dewitz. Canebay Estate, St. Croix-L. Local name. -Map 3241."
      },
      {
        "entryId": "thomas",
        "name": "Thomas",
        "type": "estate",
        "island": "stt",
        "quarter": null,
        "confidence": 345,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "different island penalty"
        ],
        "description": "Thomas. -Oldenc'lorp; Hornbeck; Dan. 265; B. A. 2452. Also epellcd, Misgunst. Mi~gunat; Same as Miggen Estate, St. Thomas. -Z."
      },
      {
        "entryId": "thomas-hill",
        "name": "Thomas Hill",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Thomas Hill; 180 feet high, on old Thomas Estate, q. v. , St. Croix."
      },
      {
        "entryId": "thomas-harbor",
        "name": "Thomas Harbor",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Thomas Harbor; the \" best harbor in Lesser Antilles \" (De Booy & Faris, p. 139), and capable of even greater improvement by breakwaters: but within easy gun-range from Tortola. Branches into Coral Harbor, Hurricane Hole, and Round B a y. 4. P. Variants : Coralbay, Corallbay, Corral Bay, Bahia del Coral, Craal Bay, Crawl Bay, Kraal Bay. Good survey by H. M. 5. Scorpion, in 18Gl."
      },
      {
        "entryId": "thomas-i",
        "name": "Thomas I",
        "type": "bay",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Thomas I. ; formerly called \"Tallard Bay, \" q. v. On south side of hay thus defined, i s an inner circular cove, Saata Maria Bay, properly so-called, 500 to 600 yards wlde, with a landing at Qley ( 7 Ole) in southeastern bend. Variant forms: St Marip, St. Mary, Marie."
      }
    ]
  },
  {
    "estateGeoid": "1678",
    "estateName": "TIPPERARY",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1675",
    "estateName": "TURNER HOLE",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "2026",
    "estateName": "TWO BROTHERS / SMITHFIELD / HESSELBERG",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "two-brothers",
        "name": "Two Brothers",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "Two Brothers; Estate, 37, Westend Quarter, St. Croix; immediately south O f"
      }
    ]
  },
  {
    "estateGeoid": "1730",
    "estateName": "TWO FRIENDS",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "two-friends-hill",
        "name": "Two-Friends Hill",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Two-Friends Hill; 818 feet high, iu northwest corner of estate, apd !J$ mile NNW. of village, BO called, St. Croix."
      }
    ]
  },
  {
    "estateGeoid": "1876",
    "estateName": "UNION & MOUNT WASHINGTON",
    "island": "stx",
    "quarter": "EASTEND A",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "washington",
        "name": "Washington",
        "type": "hill",
        "island": null,
        "quarter": null,
        "confidence": 190,
        "reasons": [
          "estate name contains entry name"
        ],
        "description": "Washington; 640-foOt peak f40 yards east; FGO-foot peak % mile east, marked G. P. \"Seven\"; 740-foot bench north of last; Pole Hill, 573 feet high, to northwest; and two other summit+ of 554 and 507 feet, respectlvely, on $pur recurving westward. G. P. , \" Seven \"; lat. 17\" 44' 40. 17\" (1, 235meters), long. 64\" 38' 28. 81\" (849 meters)."
      }
    ]
  },
  {
    "estateGeoid": "1737",
    "estateName": "UPPER LOVE",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1971",
    "estateName": "VICORP LAND",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": []
  },
  {
    "estateGeoid": "1704",
    "estateName": "VICORP LAND (BETHLEHEM & FRED)",
    "island": "stx",
    "quarter": "KING'S (KONGENS)",
    "quarterGroup": "KING",
    "features": [
      {
        "entryId": "bethlehem",
        "name": "Bethlehem",
        "type": "estate",
        "island": null,
        "quarter": "SOUTHSIDE",
        "confidence": 190,
        "reasons": [
          "estate name contains entry name"
        ],
        "description": "Bethlehem; Large Estate, comprising over 1, 100 ncres, including all of tracts 15, 16, 25, 26, 34, and west half of adjacent tracts on east, 14, 1'7, 24, 27, 33, King Quarter, St. Croir. Patented to John de Windt; hence called by Oldendorp, \" John de Wint Plantage. \" Traversed from N. to S. by Bethlehem and Fairplain Creeks. Crossed by Centerline and Southside Roads. Large sugar mill and vlllage in northern portion, at \"Old Work. \" Scorpion survey reported De Forrest owner of Old and New Bethlehem and Fairplain."
      }
    ]
  },
  {
    "estateGeoid": "1908",
    "estateName": "WALDBERGGAARD",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "waldberggaard",
        "name": "Waldberggaard",
        "type": "estate",
        "island": "stx",
        "quarter": "PRINCE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "Waldberggaard; Estate 24, western tier of Prince Quarter, St. Croix. Belonging (1754) to Engelb. Hesselberg. Stream, well, road, and old mlllsite, in southwest corner; remainder. sloping spurs of 923-foot peak just north of Estate; covered with grass, bushes and trees. Variants: Walberg. gaard, Walberg Guard, Waldberg Gnartl, Watberg Gaard. holm. . P, D. J. Mistaken translation of last component. -- 198 of 215 GEOGRAPHIC DICTIONARY OF THE VIRQIN ISLANDS 195"
      }
    ]
  },
  {
    "estateGeoid": "1657",
    "estateName": "WASHINGTON HILL",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1783",
    "estateName": "WHEEL OF FORTUNE",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "wheel-of-fortune",
        "name": "Wheel-of-Fortune",
        "type": "estate",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 405,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "quarter agreement"
        ],
        "description": "Wheel-of-Fortune; Estate, 38-39 Westend Quarter, measuring 1, 590 feet northsouth, by 6, 180 feet enst-west, south of Frederiksted and Lagrange, St. Crbix. Estate-village, 1, 500, yards east of Frederiksted waterfront. Owned (1754) by Jgrgen Hardung. 4xholm : L. &"
      }
    ]
  },
  {
    "estateGeoid": "1953",
    "estateName": "WHIM (East)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1858",
    "estateName": "WHIM (West)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": []
  },
  {
    "estateGeoid": "1772",
    "estateName": "WHITE LADY",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "white",
        "name": "White",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "White; Estate Qa, Westend Quarter, southern coast of St. Croix. Origtnally,"
      }
    ]
  },
  {
    "estateGeoid": "1860",
    "estateName": "WHITES BAY (East)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "white",
        "name": "White",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "White; Estate Qa, Westend Quarter, southern coast of St. Croix. Origtnally,"
      }
    ]
  },
  {
    "estateGeoid": "1771",
    "estateName": "WHITES BAY (North)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "white",
        "name": "White",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "White; Estate Qa, Westend Quarter, southern coast of St. Croix. Origtnally,"
      }
    ]
  },
  {
    "estateGeoid": "1861",
    "estateName": "WHITES BAY (South)",
    "island": "stx",
    "quarter": "WEST END",
    "quarterGroup": "WEST_END",
    "features": [
      {
        "entryId": "white",
        "name": "White",
        "type": "estate",
        "island": "stx",
        "quarter": "WESTEND",
        "confidence": 130,
        "reasons": [
          "estate name contains entry name",
          "same island",
          "quarter agreement"
        ],
        "description": "White; Estate Qa, Westend Quarter, southern coast of St. Croix. Origtnally,"
      }
    ]
  },
  {
    "estateGeoid": "1901",
    "estateName": "WILL'S BAY",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": []
  },
  {
    "estateGeoid": "1662",
    "estateName": "WILLIAM",
    "island": "stx",
    "quarter": "NORTHSIDE A",
    "quarterGroup": "NORTHSIDE",
    "features": [
      {
        "entryId": "william",
        "name": "William",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 425,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island",
          "quarter agreement"
        ],
        "description": "William; Estate, 1, 2, 8, suulhwest corner of Northside A Quarter, St. Croix; extending along shore 1, OOO yards, inlqnd over 2, 000 yards. Village on shore road, 1 W miles north of Frederiksted. Willlam's Ohlmney, prominent object. Extensive cnneflelda in west; eastern portion in grasa. With Prosperity, adjoining on south, belonged (17M), to John Boyd A180 called, *'Willlams \" or '' The William. \""
      },
      {
        "entryId": "william-valley",
        "name": "William valley",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "William valley; I n center of William Estate, extending enst over 1 mile and into Punch Estate, St. Croix. Danish. The William Dalen."
      },
      {
        "entryId": "butler-bay-and-william-estate",
        "name": "Butler Bay and William Estate",
        "type": "estate",
        "island": null,
        "quarter": null,
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "Butler Bay and William Estate; comprising a strip of shore, 780 yards long, part of Charles Daly Plantage; a t south end being Estate-village, near Bpsat Hole; with all of tract 12 (William Roger) south OS Great"
      },
      {
        "entryId": "william-s-delight",
        "name": "William's Delight",
        "type": "estate",
        "island": null,
        "quarter": "WESTEND",
        "confidence": 135,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate"
        ],
        "description": "William's Delight; Estate near Old We, q. v. , St. Croix. -Zabriskie. Located in Westend Quarter by Dewitz. Tract 41b in Prince Quarter belonged (11764) to Wllliam Richardson. -Beck."
      }
    ]
  },
  {
    "estateGeoid": "1963",
    "estateName": "WILLIAMS DELIGHT",
    "island": "stx",
    "quarter": "PRINCE",
    "quarterGroup": "PRINCE",
    "features": [
      {
        "entryId": "william",
        "name": "William",
        "type": "estate",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "William; Estate, 1, 2, 8, suulhwest corner of Northside A Quarter, St. Croix; extending along shore 1, OOO yards, inlqnd over 2, 000 yards. Village on shore road, 1 W miles north of Frederiksted. Willlam's Ohlmney, prominent object. Extensive cnneflelda in west; eastern portion in grasa. With Prosperity, adjoining on south, belonged (17M), to John Boyd A180 called, *'Willlams \" or '' The William. \""
      }
    ]
  },
  {
    "estateGeoid": "1714",
    "estateName": "WINDSOR",
    "island": "stx",
    "quarter": "QUEEN",
    "quarterGroup": "QUEEN",
    "features": [
      {
        "entryId": "windsor",
        "name": "Windsor",
        "type": "quarter",
        "island": "stx",
        "quarter": "NORTHSIDE",
        "confidence": 410,
        "reasons": [
          "exact estate name",
          "entry name contains estate name",
          "estate name contains entry name",
          "description mentions estate",
          "same island"
        ],
        "description": "Windsor; Edate, also known as \" Windsor Forest, \" comprising t r a m 56 and 6, northwest corner of Queen Quarter, St. Croix. This and Clairmont in Northside B Quarter belonged to Laurence Bodkin in 1754; to G. J. Mudie In 1861. G. P. Windsor Mill: lat. 17' 46' 20' (807 meters) long. 64' 46' 37\" (1, 084meters)."
      },
      {
        "entryId": "windsor-forest",
        "name": "Windsor Forest",
        "type": "estate",
        "island": "stx",
        "quarter": null,
        "confidence": 155,
        "reasons": [
          "entry name contains estate name",
          "description mentions estate",
          "same island"
        ],
        "description": "Windsor Forest; Woodland covering slopes of Saltriver Hills in northern portion of Windsor Estate: St. Croix; also, the estate itself. Wimdsor Hill; 872 feet high, rovered with low trees; surmounted by Windsor Mill, $/a mile north of Windsor Estatehouse in Clairmont, St. Croix. Highest of Saltriver Hills. So called by triangulation party."
      }
    ]
  },
  {
    "estateGeoid": "1674",
    "estateName": "WOOD COTTAGE",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": [
      {
        "entryId": "cottage",
        "name": "Cottage",
        "type": "estate",
        "island": "stx",
        "quarter": "QUEEN",
        "confidence": 115,
        "reasons": [
          "estate name contains entry name",
          "same island"
        ],
        "description": "Cottage; Estate, 32, in southwest part of Queen (Dronning) Quarter, St. Croix. Deeded to John Meyer. Has three cotbn patches and a cane patch; remainder, bush and gmss. --t)XhOlm."
      }
    ]
  },
  {
    "estateGeoid": "1694",
    "estateName": "WORK & REST",
    "island": "stx",
    "quarter": "COMPANY",
    "quarterGroup": "COMPANY",
    "features": []
  },
  {
    "estateGeoid": "1843",
    "estateName": "YELLOW CLIFF (North)",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  },
  {
    "estateGeoid": "1673",
    "estateName": "YELLOW CLIFF (South)",
    "island": "stx",
    "quarter": "EASTEND B",
    "quarterGroup": "EAST_END",
    "features": []
  }
];

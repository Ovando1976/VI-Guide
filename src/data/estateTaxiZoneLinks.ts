export type MobilityIsland = "stt" | "stj" | "stx" | "wat";

export type EstateTaxiZoneRelationship =
  | "primary"
  | "secondary"
  | "nearest"
  | "manual_review";

export type EstateTaxiZoneLink = {
  id: string;
  island: MobilityIsland;
  estateGeoid?: string;
  estateName: string;
  taxiZoneId: string;
  relationship: EstateTaxiZoneRelationship;
  confidence: number;
};

export const estateTaxiZoneLinks: EstateTaxiZoneLink[] = [
  {
    "id": "stj:abrahams-fancy-maho-bay:stj_trunk_bay",
    "island": "stj",
    "estateGeoid": "1989",
    "estateName": "Estate ABRAHAMS FANCY / MAHO BAY",
    "taxiZoneId": "stj_trunk_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:adrian:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1891",
    "estateName": "Estate ADRIAN",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:annaberg:stj_maho_bay",
    "island": "stj",
    "estateGeoid": "1982",
    "estateName": "Estate ANNABERG",
    "taxiZoneId": "stj_maho_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:bellevue:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "-1",
    "estateName": "Estate BELLEVUE",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:ben-runnell-s-gut:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1952",
    "estateName": "Estate BEN RUNNELL'S GUT",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:bethany:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "-1",
    "estateName": "Estate BETHANY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:beverhoudtsberg:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "-1",
    "estateName": "Estate BEVERHOUDTSBERG",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:bordeaux:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1978",
    "estateName": "Estate BORDEAUX",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:browns-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1990",
    "estateName": "Estate BROWNS BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:buck-island:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1649",
    "estateName": "Estate BUCK ISLAND",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:calabash-boom:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "2018",
    "estateName": "Estate CALABASH BOOM",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:caneel-bay:stj_caneel_bay",
    "island": "stj",
    "estateGeoid": "1893",
    "estateName": "Estate CANEEL BAY",
    "taxiZoneId": "stj_caneel_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:carolina:stj_coral_bay",
    "island": "stj",
    "estateGeoid": "2009",
    "estateName": "Estate CAROLINA",
    "taxiZoneId": "stj_coral_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:caval-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1818",
    "estateName": "Estate CAVAL CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:chocolate-hole:stj_chocolate_hole",
    "island": "stj",
    "estateGeoid": "2004",
    "estateName": "Estate CHOCOLATE HOLE",
    "taxiZoneId": "stj_chocolate_hole",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:cinnamon-cay:stj_cinnamon_bay",
    "island": "stj",
    "estateGeoid": "1642",
    "estateName": "Estate CINNAMON CAY",
    "taxiZoneId": "stj_cinnamon_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:concordia-a:stj_salt_pond",
    "island": "stj",
    "estateGeoid": "1625",
    "estateName": "Estate CONCORDIA A",
    "taxiZoneId": "stj_salt_pond",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:concordia-b:stj_salt_pond",
    "island": "stj",
    "estateGeoid": "1627",
    "estateName": "Estate CONCORDIA B",
    "taxiZoneId": "stj_salt_pond",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:congo-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1817",
    "estateName": "Estate CONGO CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:contant:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1871",
    "estateName": "Estate CONTANT",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:cruz-bay-town:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1894",
    "estateName": "Estate CRUZ BAY TOWN",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:dennis-bay-hawknest:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1914",
    "estateName": "Estate DENNIS BAY/ HAWKNEST",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:eden:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1964",
    "estateName": "Estate EDEN",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:emmaus:stj_coral_bay",
    "island": "stj",
    "estateGeoid": "1966",
    "estateName": "Estate EMMAUS",
    "taxiZoneId": "stj_coral_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:enighed:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "2003",
    "estateName": "Estate ENIGHED",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:fish-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1912",
    "estateName": "Estate FISH BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:flannigan-island:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1648",
    "estateName": "Estate FLANNIGAN ISLAND",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:fortsberg:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1965",
    "estateName": "Estate FORTSBERG",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:freeman-s-ground:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "2017",
    "estateName": "Estate FREEMAN'S GROUND",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:friise:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1635",
    "estateName": "Estate FRIISE",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:gifft-regenback:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1988",
    "estateName": "Estate GIFFT & REGENBACK",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:glucksberg:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1631",
    "estateName": "Estate GLUCKSBERG",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:great-cinnamon-bay:stj_cinnamon_bay",
    "island": "stj",
    "estateGeoid": "1917",
    "estateName": "Estate GREAT CINNAMON BAY",
    "taxiZoneId": "stj_cinnamon_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:grunwald:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1632",
    "estateName": "Estate GRUNWALD",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:hammer-farm-cathrineberg:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1977",
    "estateName": "Estate HAMMER FARM / CATHRINEBERG",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:hansen-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1935",
    "estateName": "Estate HANSEN BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:hard-labor:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1910",
    "estateName": "Estate HARD LABOR",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:haulover:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1936",
    "estateName": "Estate HAULOVER",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:henley-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1645",
    "estateName": "Estate HENLEY CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:hermitage:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "-1",
    "estateName": "Estate HERMITAGE",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:hope:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "3630",
    "estateName": "Estate HOPE",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:johns-folly:stj_coral_bay",
    "island": "stj",
    "estateGeoid": "1634",
    "estateName": "Estate JOHNS FOLLY",
    "taxiZoneId": "stj_coral_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:l-esperance:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1633",
    "estateName": "Estate L'ESPERANCE",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:lameshur-complex:stj_salt_pond",
    "island": "stj",
    "estateGeoid": "3633",
    "estateName": "Estate LAMESHUR COMPLEX",
    "taxiZoneId": "stj_salt_pond",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:leinster-bay:stj_leinster_bay",
    "island": "stj",
    "estateGeoid": "1638",
    "estateName": "Estate LEINSTER BAY",
    "taxiZoneId": "stj_leinster_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:little-plantation-lohman:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1979",
    "estateName": "Estate LITTLE PLANTATION (Lohman)",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:lovango-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1626",
    "estateName": "Estate LOVANGO CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:mandahl:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1629",
    "estateName": "Estate MANDAHL",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:miland:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1919",
    "estateName": "Estate MILAND",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:mingo-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1641",
    "estateName": "Estate MINGO CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:molledahl-little-reef-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1918",
    "estateName": "Estate MOLLEDAHL & LITTLE REEF BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:mt-pleasant-retreat:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1934",
    "estateName": "Estate MT PLEASANT & RETREAT",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:newfound-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "6477",
    "estateName": "Estate NEWFOUND BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:palestina:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1637",
    "estateName": "Estate PALESTINA",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:pastory:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1838",
    "estateName": "Estate PASTORY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:peter-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1636",
    "estateName": "Estate PETER BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:ram-goat-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1646",
    "estateName": "Estate RAM GOAT CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:rata-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1644",
    "estateName": "Estate RATA CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:reef-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1624",
    "estateName": "Estate REEF BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:rendezvous-ditleff:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1987",
    "estateName": "Estate RENDEZVOUS & DITLEFF",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:rustenberg-adventure:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1623",
    "estateName": "Estate RUSTENBERG & ADVENTURE",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:saba-bay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "6077",
    "estateName": "Estate SABA BAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:san-soucci-guinea-gut:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "2006",
    "estateName": "Estate SAN SOUCCI & GUINEA GUT",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:saunder-s-gut:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1981",
    "estateName": "Estate SAUNDER'S GUT",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:sieben:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1985",
    "estateName": "Estate SIEBEN",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:saint-quacco-zimmerman:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "2039",
    "estateName": "Estate ST QUACCO & ZIMMERMAN",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:steven-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1643",
    "estateName": "Estate STEVEN CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:susannaberg:stj_maho_bay",
    "island": "stj",
    "estateGeoid": "1913",
    "estateName": "Estate SUSANNABERG",
    "taxiZoneId": "stj_maho_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:trunk-bay:stj_trunk_bay",
    "island": "stj",
    "estateGeoid": "1892",
    "estateName": "Estate TRUNK BAY",
    "taxiZoneId": "stj_trunk_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:trunk-cay:stj_trunk_bay",
    "island": "stj",
    "estateGeoid": "1647",
    "estateName": "Estate TRUNK CAY",
    "taxiZoneId": "stj_trunk_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stj:turner-point:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1628",
    "estateName": "Estate TURNER POINT",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:usher-s-quay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1639",
    "estateName": "Estate USHER'S QUAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:whistling-cay:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1640",
    "estateName": "Estate WHISTLING CAY",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stj:zootenval:stj_cruz_bay",
    "island": "stj",
    "estateGeoid": "1991",
    "estateName": "Estate ZOOTENVAL",
    "taxiZoneId": "stj_cruz_bay",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:adelphi:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1795",
    "estateName": "Estate ADELPHI",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:agnes-fancy:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1898",
    "estateName": "Estate AGNES FANCY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:altona-welgunst:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2032",
    "estateName": "Estate ALTONA & WELGUNST",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:anna-s-fancy:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2031",
    "estateName": "Estate ANNA'S FANCY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:anna-s-retreat:stt_tutu",
    "island": "stt",
    "estateGeoid": "2022",
    "estateName": "Estate ANNA'S RETREAT",
    "taxiZoneId": "stt_tutu",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:bakkero:stt_frenchmans_reef",
    "island": "stt",
    "estateGeoid": "1897",
    "estateName": "Estate BAKKERO",
    "taxiZoneId": "stt_frenchmans_reef",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:bellevue:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "-1",
    "estateName": "Estate BELLEVUE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:bethesda:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "-1",
    "estateName": "Estate BETHESDA",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:bolongo:stt_bolongo",
    "island": "stt",
    "estateGeoid": "-1",
    "estateName": "Estate BOLONGO",
    "taxiZoneId": "stt_bolongo",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:bonne-esperance:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1999",
    "estateName": "Estate BONNE ESPERANCE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:bonne-resolution:stt_mountain_top",
    "island": "stt",
    "estateGeoid": "-1",
    "estateName": "Estate BONNE RESOLUTION",
    "taxiZoneId": "stt_mountain_top",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:bordeaux:stt_west_end",
    "island": "stt",
    "estateGeoid": "1797",
    "estateName": "Estate BORDEAUX",
    "taxiZoneId": "stt_west_end",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:botany-bay:stt_west_end",
    "island": "stt",
    "estateGeoid": "1943",
    "estateName": "Estate BOTANY BAY",
    "taxiZoneId": "stt_west_end",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:bovoni:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1998",
    "estateName": "Estate BOVONI",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:bovoni-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1833",
    "estateName": "Estate BOVONI CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:buck-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1821",
    "estateName": "Estate BUCK ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:canaan-scherpenjewel:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1799",
    "estateName": "Estate CANAAN & SCHERPENJEWEL",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:careening-hole:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1801",
    "estateName": "Estate CAREENING HOLE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:caret-bay:stt_west_end",
    "island": "stt",
    "estateGeoid": "2015",
    "estateName": "Estate CARET BAY",
    "taxiZoneId": "stt_west_end",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:cas-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1831",
    "estateName": "Estate CAS CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:catherineberg:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1011",
    "estateName": "Estate CATHERINEBERG",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:charlotte-amalie:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2029",
    "estateName": "Estate CHARLOTTE AMALIE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:coculus-rock:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1830",
    "estateName": "Estate COCULUS ROCK",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:coki-point:stt_coki",
    "island": "stt",
    "estateGeoid": "1804",
    "estateName": "Estate COKI POINT",
    "taxiZoneId": "stt_coki",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:contant-7a:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2024",
    "estateName": "Estate CONTANT 7A",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:contant-7b:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1868",
    "estateName": "Estate CONTANT 7b",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:contant-7b:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1865",
    "estateName": "Estate CONTANT 7B",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:contant-7ba:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1874",
    "estateName": "Estate CONTANT 7BA",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:contant-7bb:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "-1",
    "estateName": "Estate CONTANT 7Bb",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:crown-hawk:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2016",
    "estateName": "Estate CROWN & HAWK",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:demarara:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1803",
    "estateName": "Estate DEMARARA",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:dog-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1829",
    "estateName": "Estate DOG ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:donoe:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1938",
    "estateName": "Estate DONOE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:dorothea:stt_hull_bay",
    "island": "stt",
    "estateGeoid": "1916",
    "estateName": "Estate DOROTHEA",
    "taxiZoneId": "stt_hull_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:dutchman-cap:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1825",
    "estateName": "Estate DUTCHMAN CAP",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:eastern-water-island-sprat-bay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1791",
    "estateName": "Estate EASTERN WATER ISLAND / SPRAT BAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:elizabeth:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1900",
    "estateName": "Estate ELIZABETH",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:fortuna:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1944",
    "estateName": "Estate FORTUNA",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:frenchman-s-bay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1920",
    "estateName": "Estate FRENCHMAN'S BAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:frydendal:stt_red_hook",
    "island": "stt",
    "estateGeoid": "1942",
    "estateName": "Estate FRYDENDAL",
    "taxiZoneId": "stt_red_hook",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:frydenhoj:stt_red_hook",
    "island": "stt",
    "estateGeoid": "2037",
    "estateName": "Estate FRYDENHOJ",
    "taxiZoneId": "stt_red_hook",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:great-saint-james-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1793",
    "estateName": "Estate GREAT ST JAMES ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:green-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1828",
    "estateName": "Estate GREEN CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:hanslollik-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1811",
    "estateName": "Estate HANSLOLLIK ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:hassel-island-orkanshullet:stt_hull_bay",
    "island": "stt",
    "estateGeoid": "1792",
    "estateName": "Estate HASSEL ISLAND / ORKANSHULLET",
    "taxiZoneId": "stt_hull_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:havensight:stt_havensight",
    "island": "stt",
    "estateGeoid": "1896",
    "estateName": "Estate HAVENSIGHT",
    "taxiZoneId": "stt_havensight",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:heerlein-s-buy:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2002",
    "estateName": "Estate HEERLEIN'S BUY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:hoffman:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2030",
    "estateName": "Estate HOFFMAN",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:honduras:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1802",
    "estateName": "Estate HONDURAS",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:hope:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1807",
    "estateName": "Estate HOPE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:hospital-ground:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1940",
    "estateName": "Estate HOSPITAL GROUND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:hull:stt_hull_bay",
    "island": "stt",
    "estateGeoid": "1808",
    "estateName": "Estate HULL",
    "taxiZoneId": "stt_hull_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:inner-brass-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1788",
    "estateName": "Estate INNER BRASS ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:john-brewer-s:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1787",
    "estateName": "Estate JOHN BREWER'S",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:kalkum-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1824",
    "estateName": "Estate KALKUM CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:kings-quarter:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2035",
    "estateName": "Estate KINGS' QUARTER",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:kronprinsens-quarter:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1805",
    "estateName": "Estate KRONPRINSENS QUARTER",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:langmath:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1869",
    "estateName": "Estate LANGMATH",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:lerkenlund:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2019",
    "estateName": "Estate LERKENLUND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:lilliendal-marienhoj:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2028",
    "estateName": "Estate LILLIENDAL & MARIENHOJ",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:lindbergh-bay:stt_airport",
    "island": "stt",
    "estateGeoid": "2025",
    "estateName": "Estate LINDBERGH BAY",
    "taxiZoneId": "stt_airport",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:little-flat-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1826",
    "estateName": "Estate LITTLE FLAT CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:little-hanslollik:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1812",
    "estateName": "Estate LITTLE HANSLOLLIK",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:little-saint-james-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1794",
    "estateName": "Estate LITTLE ST JAMES ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:little-thatch-key:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1820",
    "estateName": "Estate LITTLE THATCH KEY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:liver-pool:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1836",
    "estateName": "Estate LIVER POOL",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:louisenhoj:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1994",
    "estateName": "Estate LOUISENHOJ",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:lovenlund:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1937",
    "estateName": "Estate LOVENLUND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:lower-john-dunko:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1909",
    "estateName": "Estate LOWER JOHN DUNKO",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:lytton-s-fancy:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1939",
    "estateName": "Estate LYTTON'S FANCY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:mafolie:stt_mafolie",
    "island": "stt",
    "estateGeoid": "1939",
    "estateName": "Estate MAFOLIE",
    "taxiZoneId": "stt_mafolie",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:mandahl:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2023",
    "estateName": "Estate MANDAHL",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:mariendal:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1997",
    "estateName": "Estate MARIENDAL",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:misgunst:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1800",
    "estateName": "Estate MISGUNST",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:nadir:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1870",
    "estateName": "Estate NADIR",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:nazareth:stt_red_hook",
    "island": "stt",
    "estateGeoid": "2038",
    "estateName": "Estate NAZARETH",
    "taxiZoneId": "stt_red_hook",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:neltjeberg:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1786",
    "estateName": "Estate NELTJEBERG",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:new-hernhut:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1911",
    "estateName": "Estate NEW HERNHUT",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:nisky:stt_crown_bay",
    "island": "stt",
    "estateGeoid": "1796",
    "estateName": "Estate NISKY",
    "taxiZoneId": "stt_crown_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:nullyberg:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1921",
    "estateName": "Estate NULLYBERG",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:outer-brass-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1789",
    "estateName": "Estate OUTER BRASS ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:patricia-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1832",
    "estateName": "Estate PATRICIA CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:pearl:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "-1",
    "estateName": "Estate PEARL",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:pelican-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1813",
    "estateName": "Estate PELICAN CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:perseverance:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1992",
    "estateName": "Estate PERSEVERANCE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:peterborg:stt_magens_bay",
    "island": "stt",
    "estateGeoid": "1872",
    "estateName": "Estate PETERBORG",
    "taxiZoneId": "stt_magens_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:queens-quarter:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2036",
    "estateName": "Estate QUEENS' QUARTER",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:raphune:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1996",
    "estateName": "Estate RAPHUNE",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:ross:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1867",
    "estateName": "Estate ROSS",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:rotto-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1840",
    "estateName": "Estate ROTTO CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:saba-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1835",
    "estateName": "Estate SABA ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:salt-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1823",
    "estateName": "Estate SALT CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:santa-maria:stt_frenchtown",
    "island": "stt",
    "estateGeoid": "2000",
    "estateName": "Estate SANTA MARIA",
    "taxiZoneId": "stt_frenchtown",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:savana-island:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "5646",
    "estateName": "Estate SAVANA ISLAND",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:smith-bay:stt_smith_bay",
    "island": "stt",
    "estateGeoid": "1941",
    "estateName": "Estate SMITH BAY",
    "taxiZoneId": "stt_smith_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:solberg:stt_mafolie",
    "island": "stt",
    "estateGeoid": "2021",
    "estateName": "Estate SOLBERG",
    "taxiZoneId": "stt_mafolie",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:sorgenfri-eastern-portion:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1816",
    "estateName": "Estate SORGENFRI EASTERN PORTION",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:sorgenfri-western-portion:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1815",
    "estateName": "Estate SORGENFRI WESTERN PORTION",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:saint-joseph-rosendahl:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2034",
    "estateName": "Estate ST JOSEPH & ROSENDAHL",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:saint-peter:stt_mountain_top",
    "island": "stt",
    "estateGeoid": "5631",
    "estateName": "Estate St. PETER",
    "taxiZoneId": "stt_mountain_top",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:staabi:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1806",
    "estateName": "Estate STAABI",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:subbase-crown-bay:stt_airport",
    "island": "stt",
    "estateGeoid": "1844",
    "estateName": "Estate SUBBASE/CROWN BAY",
    "taxiZoneId": "stt_airport",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:taarneberg:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1856",
    "estateName": "Estate TAARNEBERG",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:tabor-harmony:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1915",
    "estateName": "Estate TABOR & HARMONY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:thatch-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1819",
    "estateName": "Estate THATCH CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:thomas:stt_havensight",
    "island": "stt",
    "estateGeoid": "1895",
    "estateName": "Estate THOMAS",
    "taxiZoneId": "stt_havensight",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:thomas-long-bay:stt_havensight",
    "island": "stt",
    "estateGeoid": "1810",
    "estateName": "Estate THOMAS - LONG BAY",
    "taxiZoneId": "stt_havensight",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:thomas-sugar-estate:stt_havensight",
    "island": "stt",
    "estateGeoid": "1809",
    "estateName": "Estate THOMAS - SUGAR ESTATE",
    "taxiZoneId": "stt_havensight",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:turtle-dove-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1834",
    "estateName": "Estate TURTLE DOVE CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:upper-john-dunko:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2027",
    "estateName": "Estate UPPER JOHN DUNKO",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:water-island:stt_water_island_ferry",
    "island": "stt",
    "estateGeoid": "1790",
    "estateName": "Estate WATER ISLAND",
    "taxiZoneId": "stt_water_island_ferry",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stt:west-cay:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1822",
    "estateName": "Estate WEST CAY",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:wintberg:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "2033",
    "estateName": "Estate WINTBERG",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stt:zufriendenheit:stt_charlotte_amalie",
    "island": "stt",
    "estateGeoid": "1995",
    "estateName": "Estate ZUFRIENDENHEIT",
    "taxiZoneId": "stt_charlotte_amalie",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:a-piece-of-land-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1923",
    "estateName": "Estate A PIECE OF LAND EAST",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:all-for-the-better:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1947",
    "estateName": "Estate ALL FOR THE BETTER",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:allendale-bog-of-allen:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1747",
    "estateName": "Estate ALLENDALE (BOG OF ALLEN)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:altona:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1683",
    "estateName": "Estate ALTONA",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:altona-fort-louise-augusta:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1845",
    "estateName": "Estate ALTONA (FORT LOUISE AUGUSTA)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:anguilla:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1709",
    "estateName": "Estate ANGUILLA",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:annaberg-shannon-grove:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1764",
    "estateName": "Estate ANNABERG & SHANNON GROVE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:annaly:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1713",
    "estateName": "Estate ANNALY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:annas-hope:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1879",
    "estateName": "Estate ANNAS HOPE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:barren-spot-east:stx_sunny_isle",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BARREN SPOT (EAST)",
    "taxiZoneId": "stx_sunny_isle",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:barren-spot-west:stx_sunny_isle",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BARREN SPOT (WEST)",
    "taxiZoneId": "stx_sunny_isle",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:beck-s-grove:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BECK'S GROVE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:beeston-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1885",
    "estateName": "Estate BEESTON HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bellevue:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BELLEVUE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:betsy-s-jewel:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BETSY'S JEWEL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bettys-hope:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1781",
    "estateName": "Estate BETTYS HOPE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:blessing:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BLESSING",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bodkin:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1725",
    "estateName": "Estate BODKIN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:body-slob:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BODY SLOB",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:boetzberg:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BOETZBERG",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bonne-esperance-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BONNE ESPERANCE (NORTH)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bonne-esperance-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "-1",
    "estateName": "Estate BONNE ESPERANCE (SOUTH)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:brooks-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1751",
    "estateName": "Estate BROOKS HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:buck-island:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2042",
    "estateName": "Estate BUCK ISLAND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bugby-hole:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1745",
    "estateName": "Estate BUGBY HOLE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:bulows-minde:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1883",
    "estateName": "Estate BULOWS MINDE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:burns-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1886",
    "estateName": "Estate BURNS HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:butler-s-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1661",
    "estateName": "Estate BUTLER'S BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:caldwell-karaval:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1841",
    "estateName": "Estate CALDWELL (KARAVAL)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:caledonia:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1888",
    "estateName": "Estate CALEDONIA",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:canaan:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2013",
    "estateName": "Estate CANAAN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cane:stx_buccaneer",
    "island": "stx",
    "estateGeoid": "1957",
    "estateName": "Estate CANE",
    "taxiZoneId": "stx_buccaneer",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:cane-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1863",
    "estateName": "Estate CANE (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cane-garden:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1693",
    "estateName": "Estate CANE GARDEN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cane-valley:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1756",
    "estateName": "Estate CANE VALLEY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:carina:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1733",
    "estateName": "Estate CARINA",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:carlton:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1955",
    "estateName": "Estate CARLTON",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cassava-garden:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1758",
    "estateName": "Estate CASSAVA GARDEN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:castle-coakley:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1773",
    "estateName": "Estate CASTLE COAKLEY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:castle-nugent:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1681",
    "estateName": "Estate CASTLE NUGENT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:catherine-s-hope:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1873",
    "estateName": "Estate CATHERINE'S HOPE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:catherine-s-rest:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1961",
    "estateName": "Estate CATHERINE'S REST",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:christiansted:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1687",
    "estateName": "Estate CHRISTIANSTED",
    "taxiZoneId": "stx_christiansted",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:clairmont:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1660",
    "estateName": "Estate CLAIRMONT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:clairmont:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1746",
    "estateName": "Estate CLAIRMONT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:clifton-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1702",
    "estateName": "Estate CLIFTON HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:coakley-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1668",
    "estateName": "Estate COAKLEY BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:colquohoun:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1972",
    "estateName": "Estate COLQUOHOUN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:concordia:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1774",
    "estateName": "Estate CONCORDIA",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:concordia-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1859",
    "estateName": "Estate CONCORDIA (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:concordia-west:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1651",
    "estateName": "Estate CONCORDIA (West)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:constitution-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1904",
    "estateName": "Estate CONSTITUTION HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:contentment:stx_christiansted",
    "island": "stx",
    "estateGeoid": "83",
    "estateName": "Estate CONTENTMENT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:coopers:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1769",
    "estateName": "Estate COOPERS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:corn-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1762",
    "estateName": "Estate CORN HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cottage:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1753",
    "estateName": "Estate COTTAGE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cotton-grove:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1669",
    "estateName": "Estate COTTON GROVE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:cotton-valley:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1666",
    "estateName": "Estate COTTON VALLEY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:diamond:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1743",
    "estateName": "Estate DIAMOND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:diamond:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1766",
    "estateName": "Estate DIAMOND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:diamond:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1958",
    "estateName": "Estate DIAMOND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:eliza-s-retreat:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1928",
    "estateName": "Estate ELIZA'S RETREAT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:enfield-green:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1768",
    "estateName": "Estate ENFIELD GREEN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:envy:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1846",
    "estateName": "Estate ENVY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:fareham:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1933",
    "estateName": "Estate FAREHAM",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:fountain:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1653",
    "estateName": "Estate FOUNTAIN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:frederikshaab:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2014",
    "estateName": "Estate FREDERIKSHAAB",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:frederiksted:stx_frederiksted",
    "island": "stx",
    "estateGeoid": "1664",
    "estateName": "Estate FREDERIKSTED",
    "taxiZoneId": "stx_frederiksted",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:friedensthal:stx_christiansted",
    "island": "stx",
    "estateGeoid": "50",
    "estateName": "Estate FRIEDENSTHAL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:glynn:stx_kingshill",
    "island": "stx",
    "estateGeoid": "1970",
    "estateName": "Estate GLYNN",
    "taxiZoneId": "stx_kingshill",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:golden-grove:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1889",
    "estateName": "Estate GOLDEN GROVE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:golden-rock:stx_golden_rock",
    "island": "stx",
    "estateGeoid": "1686",
    "estateName": "Estate GOLDEN ROCK",
    "taxiZoneId": "stx_golden_rock",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:granard:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1691",
    "estateName": "Estate GRANARD",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:grange-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1880",
    "estateName": "Estate GRANGE (North)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:grange-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1881",
    "estateName": "Estate GRANGE (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:grange-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1882",
    "estateName": "Estate GRANGE HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:great-pond:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1877",
    "estateName": "Estate GREAT POND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:green-cay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1680",
    "estateName": "Estate GREEN CAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:grove-place:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1750",
    "estateName": "Estate GROVE PLACE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:gumbs-land:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1777",
    "estateName": "Estate GUMBS LAND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hafensight:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1884",
    "estateName": "Estate HAFENSIGHT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hams-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1887",
    "estateName": "Estate HAMS BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hams-bluff:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1656",
    "estateName": "Estate HAMS BLUFF",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hannahs-rest:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1650",
    "estateName": "Estate HANNAHS REST",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hard-labor:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1779",
    "estateName": "Estate HARD LABOR",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hartman:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1676",
    "estateName": "Estate HARTMAN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hermitage:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1723",
    "estateName": "Estate HERMITAGE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hermon-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1962",
    "estateName": "Estate HERMON HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hogensberg:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1954",
    "estateName": "Estate HOGENSBERG",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:holger-s-hope:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1851",
    "estateName": "Estate HOLGER'S HOPE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hope:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1759",
    "estateName": "Estate HOPE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hope:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1907",
    "estateName": "Estate HOPE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:hope-carton-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1776",
    "estateName": "Estate HOPE & CARTON HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:humbug:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1967",
    "estateName": "Estate HUMBUG",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:isaacs-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1926",
    "estateName": "Estate ISAACS BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:jacks-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1927",
    "estateName": "Estate JACKS BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:jerusalem-figtree-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1760",
    "estateName": "Estate JERUSALEM & FIGTREE HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:jolly-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1740",
    "estateName": "Estate JOLLY HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:judiths-fancy:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1701",
    "estateName": "Estate JUDITHS FANCY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:kingshill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1754",
    "estateName": "Estate KINGSHILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:la-grande-princesse:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1975",
    "estateName": "Estate LA GRANDE PRINCESSE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:la-grange:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2011",
    "estateName": "Estate LA GRANGE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:la-presvallee:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1748",
    "estateName": "Estate LA PRESVALLEE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:la-reine:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1738",
    "estateName": "Estate LA REINE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:la-vallee:stx_cane_bay",
    "island": "stx",
    "estateGeoid": "2010",
    "estateName": "Estate LA VALLEE",
    "taxiZoneId": "stx_cane_bay",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:lbj-gardens:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1689",
    "estateName": "Estate LBJ GARDENS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:lebanon-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1716",
    "estateName": "Estate LEBANON HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:little-fountain:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1720",
    "estateName": "Estate LITTLE FOUNTAIN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:little-la-grange:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1782",
    "estateName": "Estate LITTLE LA GRANGE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:little-mount-pleasant-matr-11:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1842",
    "estateName": "Estate LITTLE MOUNT PLEASANT (MATR. 11)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:little-princesse:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1960",
    "estateName": "Estate LITTLE PRINCESSE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:little-profit:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1671",
    "estateName": "Estate LITTLE PROFIT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:long-point-cotton-garden:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1924",
    "estateName": "Estate LONG POINT & COTTON GARDEN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:longford:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1930",
    "estateName": "Estate LONGFORD",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:lower-love:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1752",
    "estateName": "Estate LOWER LOVE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:lowry-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1945",
    "estateName": "Estate LOWRY HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:madam-carty:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1775",
    "estateName": "Estate MADAM CARTY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:manning-s-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1707",
    "estateName": "Estate MANNING'S BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:marienhoj:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1946",
    "estateName": "Estate MARIENHOJ",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mars-hill-stony-ground:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1706",
    "estateName": "Estate MARS HILL & STONY GROUND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mary-s-fancy:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1700",
    "estateName": "Estate MARY'S FANCY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mint:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1890",
    "estateName": "Estate MINT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mon-bijou:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1726",
    "estateName": "Estate MON BIJOU",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mon-bijou-blue-mt:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1721",
    "estateName": "Estate MON BIJOU / BLUE MT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:montpellier:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1976",
    "estateName": "Estate MONTPELLIER",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:montpellier-i:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1732",
    "estateName": "Estate MONTPELLIER (I)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:montpellier-ii:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1854",
    "estateName": "Estate MONTPELLIER (II)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:morning-star:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2007",
    "estateName": "Estate MORNING STAR",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-eagle:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1715",
    "estateName": "Estate MOUNT EAGLE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-fancy:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1672",
    "estateName": "Estate MOUNT FANCY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-pleasant-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1948",
    "estateName": "Estate MOUNT PLEASANT (East)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-pleasant-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1711",
    "estateName": "Estate MOUNT PLEASANT (North)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-pleasant-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1763",
    "estateName": "Estate MOUNT PLEASANT (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-retreat:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1670",
    "estateName": "Estate MOUNT RETREAT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-stewart:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1903",
    "estateName": "Estate MOUNT STEWART",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-victory:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1722",
    "estateName": "Estate MOUNT VICTORY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mount-welcome:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1929",
    "estateName": "Estate MOUNT WELCOME",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:mountain:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1761",
    "estateName": "Estate MOUNTAIN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:negro-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1847",
    "estateName": "Estate NEGRO BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:nicholas:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1654",
    "estateName": "Estate NICHOLAS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:north-grapetree-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1922",
    "estateName": "Estate NORTH GRAPETREE BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:north-hall:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1728",
    "estateName": "Estate NORTH HALL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:north-slob:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1665",
    "estateName": "Estate NORTH SLOB",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:north-star:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1784",
    "estateName": "Estate NORTH STAR",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:northside:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1659",
    "estateName": "Estate NORTHSIDE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:old-hospital-grounds:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1850",
    "estateName": "Estate OLD HOSPITAL GROUNDS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:orange-grove-east:stx_golden_rock",
    "island": "stx",
    "estateGeoid": "353",
    "estateName": "Estate ORANGE GROVE (East)",
    "taxiZoneId": "stx_golden_rock",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:orange-grove-west:stx_golden_rock",
    "island": "stx",
    "estateGeoid": "1735",
    "estateName": "Estate ORANGE GROVE (West)",
    "taxiZoneId": "stx_golden_rock",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:oxford:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1729",
    "estateName": "Estate OXFORD",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:paradise:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1767",
    "estateName": "Estate PARADISE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:parasol:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1719",
    "estateName": "Estate PARASOL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:pearl:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1692",
    "estateName": "Estate PEARL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:peter-s-rest:stx_mid_island",
    "island": "stx",
    "estateGeoid": "1749",
    "estateName": "Estate PETER'S REST",
    "taxiZoneId": "stx_mid_island",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:peters-farm:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1734",
    "estateName": "Estate PETERS FARM",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:petronella:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1742",
    "estateName": "Estate PETRONELLA",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:pleasant-vale:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1724",
    "estateName": "Estate PLEASANT VALE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:pleasant-valley:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1778",
    "estateName": "Estate PLEASANT VALLEY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:plessen-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1780",
    "estateName": "Estate PLESSEN (North)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:plessen-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1755",
    "estateName": "Estate PLESSEN (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:profit:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1703",
    "estateName": "Estate PROFIT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:prospect-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1744",
    "estateName": "Estate PROSPECT HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:prospect-hill-west:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1839",
    "estateName": "Estate PROSPECT HILL WEST",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:prosperity:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1663",
    "estateName": "Estate PROSPERITY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:prosperity-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1652",
    "estateName": "Estate PROSPERITY EAST",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:protestant-cay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2041",
    "estateName": "Estate PROTESTANT CAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:public-port-site-filled-lands:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1785",
    "estateName": "Estate PUBLIC PORT SITE (Filled Lands)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:punch:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1731",
    "estateName": "Estate PUNCH",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:rattan-belvedere:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1974",
    "estateName": "Estate RATTAN & BELVEDERE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:reclaimed-land-filled:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1855",
    "estateName": "Estate RECLAIMED LAND (FILLED)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:recovery-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1684",
    "estateName": "Estate RECOVERY HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:recovery-welcome:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1852",
    "estateName": "Estate RECOVERY-WELCOME",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:retreat:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1968",
    "estateName": "Estate RETREAT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:retreat-peter-s-minde:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1690",
    "estateName": "Estate RETREAT & PETER'S MINDE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:richmond:stx_christiansted",
    "island": "stx",
    "estateGeoid": "53",
    "estateName": "Estate RICHMOND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:richmond-aldersville:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2424",
    "estateName": "Estate RICHMOND (ALDERSVILLE)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:river:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1727",
    "estateName": "Estate RIVER",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:roberts-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1679",
    "estateName": "Estate ROBERTS HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:rose-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1902",
    "estateName": "Estate ROSE HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:ruby:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1699",
    "estateName": "Estate RUBY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:sallys-fancy:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1739",
    "estateName": "Estate SALLYS FANCY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:salt-river:stx_christiansted",
    "island": "stx",
    "estateGeoid": "2008",
    "estateName": "Estate SALT RIVER",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:seven-hills:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1677",
    "estateName": "Estate SEVEN HILLS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:shoys:stx_buccaneer",
    "island": "stx",
    "estateGeoid": "1655",
    "estateName": "Estate SHOYS",
    "taxiZoneId": "stx_buccaneer",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:sight:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1951",
    "estateName": "Estate SIGHT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:sion-farm:stx_sunny_isle",
    "island": "stx",
    "estateGeoid": "1905",
    "estateName": "Estate SION FARM",
    "taxiZoneId": "stx_sunny_isle",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:sion-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1696",
    "estateName": "Estate SION HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:solitude-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1667",
    "estateName": "Estate SOLITUDE (East)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:solitude-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1717",
    "estateName": "Estate SOLITUDE (North)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:south-grapetree-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1925",
    "estateName": "Estate SOUTH GRAPETREE BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:south-slob:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1875",
    "estateName": "Estate SOUTH SLOB",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:southgate-farm:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1950",
    "estateName": "Estate SOUTHGATE FARM",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:spanish-town:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1708",
    "estateName": "Estate SPANISH TOWN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:spratt-hall:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1658",
    "estateName": "Estate SPRATT HALL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:spring-garden:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1712",
    "estateName": "Estate SPRING GARDEN",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:spring-gut:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1931",
    "estateName": "Estate SPRING GUT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:springfield:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1741",
    "estateName": "Estate SPRINGFIELD",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:saint-georges:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1956",
    "estateName": "Estate ST GEORGES",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:saint-georges-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1757",
    "estateName": "Estate ST GEORGES HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:saint-john-s:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1973",
    "estateName": "Estate ST JOHN'S",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:saint-peters:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1682",
    "estateName": "Estate ST PETERS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:stoney-ground-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1770",
    "estateName": "Estate STONEY GROUND (East)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:stoney-ground-west:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1862",
    "estateName": "Estate STONEY GROUND (West)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:strawberry-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1698",
    "estateName": "Estate STRAWBERRY HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:sweet-bottom:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1718",
    "estateName": "Estate SWEET BOTTOM",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:teague-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1906",
    "estateName": "Estate TEAGUE BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:the-springs:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1932",
    "estateName": "Estate THE SPRINGS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:thomas:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1695",
    "estateName": "Estate THOMAS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:tipperary:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1678",
    "estateName": "Estate TIPPERARY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:turner-hole:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1675",
    "estateName": "Estate TURNER HOLE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:two-brothers-smithfield-hesselberg:stx_frederiksted",
    "island": "stx",
    "estateGeoid": "2026",
    "estateName": "Estate TWO BROTHERS / SMITHFIELD / HESSELBERG",
    "taxiZoneId": "stx_frederiksted",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:two-friends:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1730",
    "estateName": "Estate TWO FRIENDS",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:union-mount-washington:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1876",
    "estateName": "Estate UNION & MOUNT WASHINGTON",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:upper-love:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1737",
    "estateName": "Estate UPPER LOVE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:vicorp-land:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1971",
    "estateName": "Estate VICORP LAND",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:vicorp-land-bethlehem-fred:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1704",
    "estateName": "Estate VICORP LAND (BETHLEHEM & FRED)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:waldberggaard:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1908",
    "estateName": "Estate WALDBERGGAARD",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:washington-hill:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1657",
    "estateName": "Estate WASHINGTON HILL",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:wheel-of-fortune:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1783",
    "estateName": "Estate WHEEL OF FORTUNE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:whim-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1953",
    "estateName": "Estate WHIM (East)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:whim-west:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1858",
    "estateName": "Estate WHIM (West)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:white-lady:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1772",
    "estateName": "Estate WHITE LADY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:whites-bay-east:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1860",
    "estateName": "Estate WHITES BAY (East)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:whites-bay-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1771",
    "estateName": "Estate WHITES BAY (North)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:whites-bay-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1861",
    "estateName": "Estate WHITES BAY (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:will-s-bay:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1901",
    "estateName": "Estate WILL'S BAY",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:william:stx_frederiksted",
    "island": "stx",
    "estateGeoid": "1662",
    "estateName": "Estate WILLIAM",
    "taxiZoneId": "stx_frederiksted",
    "relationship": "primary",
    "confidence": 0.9
  },
  {
    "id": "stx:williams-delight:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1963",
    "estateName": "Estate WILLIAMS DELIGHT",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:windsor:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1714",
    "estateName": "Estate WINDSOR",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:wood-cottage:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1674",
    "estateName": "Estate WOOD COTTAGE",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:work-rest:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1694",
    "estateName": "Estate WORK & REST",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:yellow-cliff-north:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1843",
    "estateName": "Estate YELLOW CLIFF (North)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  },
  {
    "id": "stx:yellow-cliff-south:stx_christiansted",
    "island": "stx",
    "estateGeoid": "1673",
    "estateName": "Estate YELLOW CLIFF (South)",
    "taxiZoneId": "stx_christiansted",
    "relationship": "manual_review",
    "confidence": 0.45
  }
];

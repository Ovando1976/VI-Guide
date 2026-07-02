import type { IslandCode, ServiceClass, TripType } from "../../types";

export type TaxiZoneId =
  // --- St. Thomas Official Legal Zones ---
  | "stt_airport"
  | "stt_charlotte_amalie"
  | "stt_agnes_fancy"
  | "stt_black_point"
  | "stt_bonne_esperance"
  | "stt_bolongo"
  | "stt_bordeaux"
  | "stt_botany_bay"
  | "stt_bournefield"
  | "stt_bovoni"
  | "stt_brookman"
  | "stt_canaan"
  | "stt_caret_bay"
  | "stt_cassi_hill"
  | "stt_coki_point"
  | "stt_contant"
  | "stt_crown_mountain"
  | "stt_crown_bay"
  | "stt_dorothea"
  | "stt_drakes_seat"
  | "stt_elizabeth_estate"
  | "stt_flag_hill"
  | "stt_fort_mylner"
  | "stt_fortuna"
  | "stt_frenchtown"
  | "stt_frydenhoj"
  | "stt_frenchmans_bay"
  | "stt_havensight"
  | "stt_hawk_hill"
  | "stt_hull_bay"
  | "stt_louisenhoj"
  | "stt_lovenlund"
  | "stt_magens_bay"
  | "stt_mahogany_run"
  | "stt_mandahl"
  | "stt_market_square_east"
  | "stt_mountain_top"
  | "stt_nisky"
  | "stt_paradise_point"
  | "stt_peterborg"
  | "stt_raphune_hill"
  | "stt_red_hook"
  | "stt_rosendahl"
  | "stt_scott_free"
  | "stt_smith_bay"
  | "stt_solberg"
  | "stt_sorgenfri"
  | "stt_st_peter_mt"
  | "stt_tabor_harmony"
  | "stt_tutu"
  | "stt_uvi"
  | "stt_wintberg"
  | "stt_yacht_haven"
  | "stt_secret_harbour"
  | "stt_ritz_carlton"
  | "stt_sapphire_beach"
  | "stt_general"
  // --- St. John Official Legal Zones ---
  | "stj_cruz_bay"
  | "stj_coral_bay"
  | "stj_adrian_housing"
  | "stj_annaberg"
  | "stj_bordeaux_mt"
  | "stj_caneel_bay"
  | "stj_cinnamon_bay"
  | "stj_chocolate_hole"
  | "stj_fish_bay"
  | "stj_francis_bay"
  | "stj_gallows_point"
  | "stj_hawksnest"
  | "stj_maho_bay"
  | "stj_salt_pond"
  | "stj_susannaberg"
  | "stj_trunk_bay"
  | "stj_westin"
  | "stj_general"
  // --- St. Croix Official Legal Zones ---
  | "stx_airport"
  | "stx_christiansted"
  | "stx_frederiksted"
  | "stx_sunny_isle"
  | "stx_annaly"
  | "stx_belvedere"
  | "stx_buccaneer"
  | "stx_cane_bay"
  | "stx_carambola"
  | "stx_castle_nugent"
  | "stx_chenay_bay"
  | "stx_coakley_bay"
  | "stx_cotton_valley"
  | "stx_divi_carina"
  | "stx_gentle_winds"
  | "stx_grapetree_bay"
  | "stx_green_cay"
  | "stx_la_grande_princesse"
  | "stx_la_reine"
  | "stx_mon_bijou"
  | "stx_salt_river"
  | "stx_shoys"
  | "stx_solitude"
  | "stx_sprat_hall"
  | "stx_tamarind_reef"
  | "stx_tide_village"
  | "stx_whim_plantation"
  | "stx_williams_delight"
  | "stx_work_and_rest"
  | "stx_general"
  // --- Water Island Legal Zones ---
  | "wat_general"
  | "wat_honeymoon_beach"
  | "wat_phillips_landing";

export type TariffZone = {
  id: TaxiZoneId;
  island: IslandCode;
  name: string;
  aliases: string[];
};

export type TariffQuote = {
  currency: "USD";
  island: IslandCode;
  originZone: TaxiZoneId;
  destinationZone: TaxiZoneId;
  tripType: TripType;
  serviceClass: ServiceClass;
  passengers: number;
  luggage: number;
  baseFare: number;
  passengerFee: number;
  luggageFee: number;
  premiumFee: number;
  total: number;
  confidence: "official_seed" | "estimated_zone" | "fallback";
  notes: string[];
};

export const tariffZones: TariffZone[] = [
  // --- St. Thomas ---
  { id: "stt_airport", island: "st_thomas", name: "Cyril E. King Airport Terminal", aliases: ["airport", "cek", "stt terminal"] },
  { id: "stt_charlotte_amalie", island: "st_thomas", name: "Charlotte Amalie (Town Limits)", aliases: ["town", "downtown", "market square", "fort christian"] },
  { id: "stt_agnes_fancy", island: "st_thomas", name: "Agnes Fancy", aliases: ["agnes fancy"] },
  { id: "stt_black_point", island: "st_thomas", name: "Black Point", aliases: ["black point"] },
  { id: "stt_bonne_esperance", island: "st_thomas", name: "Bonne Esperance", aliases: ["bonne esperance"] },
  { id: "stt_bolongo", island: "st_thomas", name: "Bolongo Bay", aliases: ["bolongo", "bolongo bay resort", "limetree"] },
  { id: "stt_bordeaux", island: "st_thomas", name: "Estate Bordeaux", aliases: ["bordeaux", "bordeaux mountain"] },
  { id: "stt_botany_bay", island: "st_thomas", name: "Botany Bay", aliases: ["botany bay", "preserve at botany bay"] },
  { id: "stt_bournefield", island: "st_thomas", name: "Bournefield", aliases: ["bournefield"] },
  { id: "stt_bovoni", island: "st_thomas", name: "Bovoni / Nadir", aliases: ["bovoni", "nadir", "nadir hill"] },
  { id: "stt_brookman", island: "st_thomas", name: "Brookman Estate", aliases: ["brookman"] },
  { id: "stt_canaan", island: "st_thomas", name: "Estate Canaan", aliases: ["canaan"] },
  { id: "stt_caret_bay", island: "st_thomas", name: "Caret Bay", aliases: ["caret bay", "caret bay upper", "caret bay lower"] },
  { id: "stt_cassi_hill", island: "st_thomas", name: "Cassi Hill", aliases: ["cassi hill"] },
  { id: "stt_coki_point", island: "st_thomas", name: "Coki Point & Beach", aliases: ["coki", "coki beach", "coral world"] },
  { id: "stt_contant", island: "st_thomas", name: "Estate Contant", aliases: ["contant", "contant tower", "contant development"] },
  { id: "stt_crown_mountain", island: "st_thomas", name: "Crown Mountain", aliases: ["crown mountain"] },
  { id: "stt_crown_bay", island: "st_thomas", name: "Crown Bay Marina & Port", aliases: ["crown bay", "sub base", "crown bay dock"] },
  { id: "stt_dorothea", island: "st_thomas", name: "Estate Dorothea", aliases: ["dorothea", "dorothea upper", "dorothea lower"] },
  { id: "stt_drakes_seat", island: "st_thomas", name: "Drake's Seat", aliases: ["drakes seat"] },
  { id: "stt_elizabeth_estate", island: "st_thomas", name: "Elizabeth Estate", aliases: ["elizabeth estate"] },
  { id: "stt_flag_hill", island: "st_thomas", name: "Flag Hill", aliases: ["flag hill"] },
  { id: "stt_fort_mylner", island: "st_thomas", name: "Fort Mylner", aliases: ["fort mylner"] },
  { id: "stt_fortuna", island: "st_thomas", name: "Estate Fortuna", aliases: ["fortuna", "fortuna mill", "fortuna point"] },
  { id: "stt_frenchtown", island: "st_thomas", name: "Frenchtown", aliases: ["frenchtown"] },
  { id: "stt_frydenhoj", island: "st_thomas", name: "Frydenhoj", aliases: ["frydenhoj", "fredenhoj"] },
  { id: "stt_frenchmans_bay", island: "st_thomas", name: "Frenchman's Bay", aliases: ["frenchmans reef", "marriott reef", "morningstar"] },
  { id: "stt_havensight", island: "st_thomas", name: "Havensight / WICO", aliases: ["havensight", "wico", "cruise pier", "west indian dock"] },
  { id: "stt_hawk_hill", island: "st_thomas", name: "Hawk Hill", aliases: ["hawk hill"] },
  { id: "stt_hull_bay", island: "st_thomas", name: "Hull Bay", aliases: ["hull bay"] },
  { id: "stt_louisenhoj", island: "st_thomas", name: "Louisenhoj Castle", aliases: ["louisenhoj"] },
  { id: "stt_lovenlund", island: "st_thomas", name: "Estate Lovenlund", aliases: ["lovenlund"] },
  { id: "stt_magens_bay", island: "st_thomas", name: "Magens Bay", aliases: ["magens", "magen", "magens beach", "magens point"] },
  { id: "stt_mahogany_run", island: "st_thomas", name: "Mahogany Run", aliases: ["mahogany run"] },
  { id: "stt_mandahl", island: "st_thomas", name: "Mandahl Bay", aliases: ["mandahl", "mandahl bay"] },
  { id: "stt_market_square_east", island: "st_thomas", name: "Market Square East", aliases: ["market square east", "cost u less"] },
  { id: "stt_mountain_top", island: "st_thomas", name: "Mountain Top", aliases: ["mountain top"] },
  { id: "stt_nisky", island: "st_thomas", name: "Nisky", aliases: ["nisky center", "nisky moravian"] },
  { id: "stt_paradise_point", island: "st_thomas", name: "Paradise Point", aliases: ["paradise point tramway"] },
  { id: "stt_peterborg", island: "st_thomas", name: "Peterborg Peninsula", aliases: ["peterborg"] },
  { id: "stt_raphune_hill", island: "st_thomas", name: "Raphune Hill", aliases: ["raphune"] },
  { id: "stt_red_hook", island: "st_thomas", name: "Red Hook Ferry Terminal", aliases: ["red hook", "urman fredericks", "stj ferry"] },
  { id: "stt_rosendahl", island: "st_thomas", name: "Rosendahl", aliases: ["rosendahl"] },
  { id: "stt_scott_free", island: "st_thomas", name: "Scott Free", aliases: ["scott free"] },
  { id: "stt_smith_bay", island: "st_thomas", name: "Smith Bay", aliases: ["smith bay", "coki crossroad"] },
  { id: "stt_solberg", island: "st_thomas", name: "Solberg", aliases: ["solberg lookout", "solberg upper"] },
  { id: "stt_sorgenfri", island: "st_thomas", name: "Sorgenfri", aliases: ["sorgenfri"] },
  { id: "stt_st_peter_mt", island: "st_thomas", name: "St. Peter Mountain", aliases: ["st peter mt"] },
  { id: "stt_tabor_harmony", island: "st_thomas", name: "Tabor and Harmony", aliases: ["tabor", "harmony"] },
  { id: "stt_tutu", island: "st_thomas", name: "Tutu / Anna's Retreat", aliases: ["tutu", "anna", "annas retreat", "tutu park mall"] },
  { id: "stt_uvi", island: "st_thomas", name: "University of the Virgin Islands", aliases: ["uvi", "college"] },
  { id: "stt_wintberg", island: "st_thomas", name: "Estate Wintberg", aliases: ["wintberg"] },
  { id: "stt_yacht_haven", island: "st_thomas", name: "Yacht Haven Grande", aliases: ["yacht haven", "yhg"] },
  { id: "stt_secret_harbour", island: "st_thomas", name: "Secret Harbour Resort", aliases: ["secret harbour"] },
  { id: "stt_ritz_carlton", island: "st_thomas", name: "Ritz Carlton Resort", aliases: ["ritz", "ritz carlton"] },
  { id: "stt_sapphire_beach", island: "st_thomas", name: "Sapphire Beach Resort", aliases: ["sapphire", "sapphire beach"] },
  { id: "stt_general", island: "st_thomas", name: "St. Thomas Unlisted Destination", aliases: ["st thomas"] },

  // --- St. John ---
  { id: "stj_cruz_bay", island: "st_john", name: "Cruz Bay Ferry Dock", aliases: ["cruz bay", "loredon boynes", "town"] },
  { id: "stj_coral_bay", island: "st_john", name: "Coral Bay", aliases: ["coral bay", "skinny legs"] },
  { id: "stj_adrian_housing", island: "st_john", name: "Adrian Housing", aliases: ["adrian"] },
  { id: "stj_annaberg", island: "st_john", name: "Annaberg Ruins", aliases: ["annaberg"] },
  { id: "stj_bordeaux_mt", island: "st_john", name: "Bordeaux Mountain", aliases: ["bordeaux mt", "chateau de bordeaux"] },
  { id: "stj_caneel_bay", island: "st_john", name: "Caneel Bay Plantation", aliases: ["caneel", "caneel bay"] },
  { id: "stj_cinnamon_bay", island: "st_john", name: "Cinnamon Bay Campground", aliases: ["cinnamon", "cinnamon bay"] },
  { id: "stj_chocolate_hole", island: "st_john", name: "Chocolate Hole", aliases: ["chocolate hole"] },
  { id: "stj_fish_bay", island: "st_john", name: "Fish Bay", aliases: ["fish bay"] },
  { id: "stj_francis_bay", island: "st_john", name: "Francis Bay Beach", aliases: ["francis bay"] },
  { id: "stj_gallows_point", island: "st_john", name: "Gallows Point Resort", aliases: ["gallows point"] },
  { id: "stj_hawksnest", island: "st_john", name: "Hawksnest Beach", aliases: ["hawksnest"] },
  { id: "stj_maho_bay", island: "st_john", name: "Maho Bay Beach", aliases: ["maho", "maho bay", "maho campground"] },
  { id: "stj_salt_pond", island: "st_john", name: "Salt Pond Bay", aliases: ["salt pond"] },
  { id: "stj_susannaberg", island: "st_john", name: "Susannaberg", aliases: ["susannaberg"] },
  { id: "stj_trunk_bay", island: "st_john", name: "Trunk Bay Beach", aliases: ["trunk bay"] },
  { id: "stj_westin", island: "st_john", name: "The Westin Resort", aliases: ["westin", "great cruz bay"] },
  { id: "stj_general", island: "st_john", name: "St. John Unlisted Destination", aliases: ["st john"] },

  // --- St. Croix ---
  { id: "stx_airport", island: "st_croix", name: "Henry E. Rohlsen Airport", aliases: ["airport", "rohlson", "stx terminal"] },
  { id: "stx_christiansted", island: "st_croix", name: "Christiansted Town", aliases: ["christiansted", "csted", "gallows bay", "town"] },
  { id: "stx_frederiksted", island: "st_croix", name: "Frederiksted Town & Pier", aliases: ["frederiksted", "fsted", "buddhoe park", "pier"] },
  { id: "stx_sunny_isle", island: "st_croix", name: "Sunny Isle Shopping Center", aliases: ["sunny isle", "mid island"] },
  { id: "stx_annaly", island: "st_croix", name: "Estate Annaly", aliases: ["annaly", "annaly bay"] },
  { id: "stx_belvedere", island: "st_croix", name: "Estate Belvedere", aliases: ["belvedere"] },
  { id: "stx_buccaneer", island: "st_croix", name: "The Buccaneer Hotel", aliases: ["buccaneer"] },
  { id: "stx_cane_bay", island: "st_croix", name: "Cane Bay Beach", aliases: ["cane bay"] },
  { id: "stx_carambola", island: "st_croix", name: "Carambola Beach Resort", aliases: ["carambola"] },
  { id: "stx_castle_nugent", island: "st_croix", name: "Castle Nugent", aliases: ["castle nugent"] },
  { id: "stx_chenay_bay", island: "st_croix", name: "Chenay Bay Resort", aliases: ["chenay bay"] },
  { id: "stx_coakley_bay", island: "st_croix", name: "Coakley Bay", aliases: ["coakley bay"] },
  { id: "stx_cotton_valley", island: "st_croix", name: "Cotton Valley", aliases: ["cotton valley"] },
  { id: "stx_divi_carina", island: "st_croix", name: "Divi Carina Bay Resort", aliases: ["divi", "divi carina"] },
  { id: "stx_gentle_winds", island: "st_croix", name: "Gentle Winds Condos", aliases: ["gentle winds"] },
  { id: "stx_grapetree_bay", island: "st_croix", name: "Grapetree Bay", aliases: ["grapetree"] },
  { id: "stx_green_cay", island: "st_croix", name: "Green Cay Marina", aliases: ["green cay"] },
  { id: "stx_la_grande_princesse", island: "st_croix", name: "La Grande Princesse", aliases: ["princesse", "la grande princesse"] },
  { id: "stx_la_reine", island: "st_croix", name: "Estate La Reine", aliases: ["la reine"] },
  { id: "stx_mon_bijou", island: "st_croix", name: "Mon Bijou", aliases: ["mon bijou"] },
  { id: "stx_salt_river", island: "st_croix", name: "Salt River National Park", aliases: ["salt river"] },
  { id: "stx_shoys", island: "st_croix", name: "Estate Shoys", aliases: ["shoys", "buccaneer golf"] },
  { id: "stx_solitude", island: "st_croix", name: "Estate Solitude", aliases: ["solitude"] },
  { id: "stx_sprat_hall", island: "st_croix", name: "Sprat Hall Plantation", aliases: ["sprat hall"] },
  { id: "stx_tamarind_reef", island: "st_croix", name: "Tamarind Reef Hotel", aliases: ["tamarind reef"] },
  { id: "stx_tide_village", island: "st_croix", name: "Tide Village", aliases: ["tide village"] },
  { id: "stx_whim_plantation", island: "st_croix", name: "Whim Plantation Museum", aliases: ["whim"] },
  { id: "stx_williams_delight", island: "st_croix", name: "Williams Delight", aliases: ["williams delight"] },
  { id: "stx_work_and_rest", island: "st_croix", name: "Work and Rest", aliases: ["work and rest"] },
  { id: "stx_general", island: "st_croix", name: "St. Croix Unlisted Destination", aliases: ["st croix"] },

  // --- Water Island ---
  { id: "wat_general", island: "water_island", name: "Water Island General", aliases: ["water island"] },
  { id: "wat_honeymoon_beach", island: "water_island", name: "Honeymoon Beach", aliases: ["honeymoon"] },
  { id: "wat_phillips_landing", island: "water_island", name: "Phillips Landing Ferry Dock", aliases: ["phillips landing", "ferry dock"] },
];


export const zoneCoordinates: Record<string, { lat: number; lng: number }> = {
  stt_airport: { lat: 18.3373, lng: -64.9734 },
  stt_charlotte_amalie: { lat: 18.3419, lng: -64.9307 },
  stt_agnes_fancy: { lat: 18.3562, lng: -64.9319 },
  stt_black_point: { lat: 18.3340, lng: -64.9520 },
  stt_bonne_esperance: { lat: 18.3580, lng: -64.9350 },
  stt_bolongo: { lat: 18.3127, lng: -64.8966 },
  stt_bordeaux: { lat: 18.3534, lng: -64.9587 },
  stt_botany_bay: { lat: 18.3498, lng: -65.0266 },
  stt_bournefield: { lat: 18.3380, lng: -64.9700 },
  stt_bovoni: { lat: 18.3189, lng: -64.8853 },
  stt_brookman: { lat: 18.3420, lng: -64.9100 },
  stt_canaan: { lat: 18.3480, lng: -64.9150 },
  stt_caret_bay: { lat: 18.3650, lng: -64.9450 },
  stt_cassi_hill: { lat: 18.3440, lng: -64.9050 },
  stt_coki_point: { lat: 18.3425, lng: -64.8625 },
  stt_contant: { lat: 18.3390, lng: -64.9420 },
  stt_crown_mountain: { lat: 18.3510, lng: -64.9480 },
  stt_crown_bay: { lat: 18.3354, lng: -64.9473 },
  stt_dorothea: { lat: 18.3620, lng: -64.9350 },
  stt_drakes_seat: { lat: 18.3550, lng: -64.9220 },
  stt_elizabeth_estate: { lat: 18.3580, lng: -64.9420 },
  stt_flag_hill: { lat: 18.3280, lng: -64.9150 },
  stt_fort_mylner: { lat: 18.3410, lng: -64.9080 },
  stt_fortuna: { lat: 18.3450, lng: -64.9850 },
  stt_frenchtown: { lat: 18.3385, lng: -64.9380 },
  stt_frydenhoj: { lat: 18.3250, lng: -64.8780 },
  stt_frenchmans_bay: { lat: 18.3190, lng: -64.9080 },
  stt_havensight: { lat: 18.3347, lng: -64.9201 },
  stt_hawk_hill: { lat: 18.3500, lng: -64.9250 },
  stt_hull_bay: { lat: 18.3680, lng: -64.9420 },
  stt_louisenhoj: { lat: 18.3520, lng: -64.9280 },
  stt_lovenlund: { lat: 18.3550, lng: -64.9050 },
  stt_magens_bay: { lat: 18.3611, lng: -64.9297 },
  stt_mahogany_run: { lat: 18.3600, lng: -64.9020 },
  stt_mandahl: { lat: 18.3620, lng: -64.8980 },
  stt_market_square_east: { lat: 18.3400, lng: -64.9280 },
  stt_mountain_top: { lat: 18.3560, lng: -64.9420 },
  stt_nisky: { lat: 18.3370, lng: -64.9500 },
  stt_paradise_point: { lat: 18.3350, lng: -64.9250 },
  stt_peterborg: { lat: 18.3680, lng: -64.9150 },
  stt_raphune_hill: { lat: 18.3450, lng: -64.9120 },
  stt_red_hook: { lat: 18.3269, lng: -64.8460 },
  stt_rosendahl: { lat: 18.3480, lng: -64.9020 },
  stt_scott_free: { lat: 18.3520, lng: -64.9120 },
  stt_smith_bay: { lat: 18.3380, lng: -64.8650 },
  stt_solberg: { lat: 18.3460, lng: -64.9350 },
  stt_sorgenfri: { lat: 18.3540, lng: -64.9300 },
  stt_st_peter_mt: { lat: 18.3550, lng: -64.9380 },
  stt_tabor_harmony: { lat: 18.3480, lng: -64.9250 },
  stt_tutu: { lat: 18.3460, lng: -64.9000 },
  stt_uvi: { lat: 18.3420, lng: -64.9480 },
  stt_wintberg: { lat: 18.3500, lng: -64.9150 },
  stt_yacht_haven: { lat: 18.3340, lng: -64.9250 },
  stt_secret_harbour: { lat: 18.3185, lng: -64.8575 },
  stt_ritz_carlton: { lat: 18.3220, lng: -64.8520 },
  stt_sapphire_beach: { lat: 18.3325, lng: -64.8455 },
  stt_general: { lat: 18.3400, lng: -64.9300 },

  // --- St. John ---
  stj_cruz_bay: { lat: 18.3300, lng: -64.7900 },
  stj_coral_bay: { lat: 18.3435, lng: -64.7335 },
  stj_adrian_housing: { lat: 18.3250, lng: -64.7750 },
  stj_annaberg: { lat: 18.3620, lng: -64.7380 },
  stj_bordeaux_mt: { lat: 18.3450, lng: -64.7250 },
  stj_caneel_bay: { lat: 18.3450, lng: -64.7830 },
  stj_cinnamon_bay: { lat: 18.3520, lng: -64.7550 },
  stj_chocolate_hole: { lat: 18.3200, lng: -64.7850 },
  stj_fish_bay: { lat: 18.3180, lng: -64.7700 },
  stj_francis_bay: { lat: 18.3580, lng: -64.7430 },
  stj_gallows_point: { lat: 18.3280, lng: -64.7920 },
  stj_hawksnest: { lat: 18.3480, lng: -64.7750 },
  stj_maho_bay: { lat: 18.3580, lng: -64.7430 },
  stj_salt_pond: { lat: 18.3050, lng: -64.7350 },
  stj_susannaberg: { lat: 18.3380, lng: -64.7650 },
  stj_trunk_bay: { lat: 18.3490, lng: -64.7730 },
  stj_westin: { lat: 18.3150, lng: -64.7820 },
  stj_general: { lat: 18.3300, lng: -64.7500 },

  // --- St. Croix ---
  stx_airport: { lat: 17.7019, lng: -64.7972 },
  stx_christiansted: { lat: 17.7466, lng: -64.7021 },
  stx_frederiksted: { lat: 17.7122, lng: -64.8816 },
  stx_sunny_isle: { lat: 17.7280, lng: -64.7650 },
  stx_annaly: { lat: 17.7650, lng: -64.8350 },
  stx_belvedere: { lat: 17.7550, lng: -64.8050 },
  stx_buccaneer: { lat: 17.7480, lng: -64.6750 },
  stx_cane_bay: { lat: 17.7720, lng: -64.7580 },
  stx_carambola: { lat: 17.7580, lng: -64.7430 },
  stx_castle_nugent: { lat: 17.7300, lng: -64.6050 },
  stx_chenay_bay: { lat: 17.7420, lng: -64.6650 },
  stx_coakley_bay: { lat: 17.7450, lng: -64.6550 },
  stx_cotton_valley: { lat: 17.7500, lng: -64.6450 },
  stx_divi_carina: { lat: 17.7300, lng: -64.6300 },
  stx_gentle_winds: { lat: 17.7700, lng: -64.7650 },
  stx_grapetree_bay: { lat: 17.7250, lng: -64.6150 },
  stx_green_cay: { lat: 17.7520, lng: -64.6850 },
  stx_la_grande_princesse: { lat: 17.7480, lng: -64.7150 },
  stx_la_reine: { lat: 17.7350, lng: -64.7600 },
  stx_mon_bijou: { lat: 17.7400, lng: -64.7500 },
  stx_salt_river: { lat: 17.7650, lng: -64.7550 },
  stx_shoys: { lat: 17.7520, lng: -64.6800 },
  stx_solitude: { lat: 17.7480, lng: -64.6400 },
  stx_sprat_hall: { lat: 17.7250, lng: -64.8750 },
  stx_tamarind_reef: { lat: 17.7460, lng: -64.6600 },
  stx_tide_village: { lat: 17.7380, lng: -64.6550 },
  stx_whim_plantation: { lat: 17.7150, lng: -64.8450 },
  stx_williams_delight: { lat: 17.7180, lng: -64.8150 },
  stx_work_and_rest: { lat: 17.7300, lng: -64.7800 },
  stx_general: { lat: 17.7300, lng: -64.7300 },

  // --- Water Island ---
  wat_general: { lat: 18.3200, lng: -64.9450 },
  wat_honeymoon_beach: { lat: 18.3220, lng: -64.9480 },
  wat_phillips_landing: { lat: 18.3180, lng: -64.9420 }
};
/**
 * VITC Standard Single-Passenger Fares Matrix Seed
 * (Rates are dynamically halved or shifted lower when 2+ people travel together per VITC provisions)
 */
export const baseZoneFares: Partial<Record<TaxiZoneId, Partial<Record<TaxiZoneId, number>>>> = {
  stt_airport: {
    stt_charlotte_amalie: 11,
    stt_havensight: 12,
    stt_crown_bay: 8,
    stt_red_hook: 23,
    stt_tutu: 17,
    stt_bovoni: 17,
    stt_peterborg: 23,
    stt_magens_bay: 18,
    stt_ritz_carlton: 27,
    stt_sapphire_beach: 23,
    stt_bolongo: 18,
    stt_coki_point: 21,
    stt_mahogany_run: 20,
    stt_secret_harbour: 27,
  },
  stt_charlotte_amalie: {
    stt_airport: 11,
    stt_havensight: 6,
    stt_crown_bay: 5,
    stt_red_hook: 13,
    stt_tutu: 9,
    stt_bovoni: 10,
    stt_peterborg: 12,
    stt_magens_bay: 10,
    stt_coki_point: 12,
  },
  stj_cruz_bay: {
    stj_coral_bay: 11,
    stj_trunk_bay: 5.5,
    stj_cinnamon_bay: 7,
    stj_maho_bay: 8,
    stj_salt_pond: 15,
    stj_westin: 4,
  },
  stx_airport: {
    stx_christiansted: 24,
    stx_frederiksted: 20,
    stx_sunny_isle: 18,
    stx_buccaneer: 30,
    stx_carambola: 30,
    stx_divi_carina: 36,
  },
};

export const tariffSettings = {
  additionalPassengerFee: 6, 
  luggageFeePerBag: 3,        // Legal standard rate per standard bag
  privateServiceMultiplier: 1.85, 
  cruiseDemandMultiplier: 1.15,
  minimumFare: 6,             // Official inside town limit baseline
};

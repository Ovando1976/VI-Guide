import type { MobilityIsland } from "./mobilityOs";

export type TaxiPricingModel =
  | "per_person_same_group"
  | "stx_one_or_two_then_three_plus_each";

export type TaxiFareRule = {
  id: string;
  island: MobilityIsland;
  from: string;
  to: string;
  pricingModel: TaxiPricingModel;
  onePassengerFare?: number;
  sameGroupTwoPlusPerPerson?: number;
  oneOrTwoPeopleFare?: number;
  threePlusEachFare?: number;
  sourceTable: string;
};

export type TaxiAdditionalChargeRule = {
  island: MobilityIsland;
  waitingPerMinuteAfterFirstFive: number;
  luggagePerBag: number;
  oversizedLuggageMax: number;
  afterHoursPerPassenger: number;
  radioCallMoreThanOnePerPassenger: number;
  kennelLarge: number;
  kennelSmall: number;
  exclusivePolicy: string;
  roundTripPolicy: string;
  hourlyRates: string;
  sightseeingRates: string;
};

export const TAXI_TARIFF_SOURCES = {
  st_thomas:
    "Island of St. Thomas Motor Vehicles For Hire Official Minimum/Maximum Rates · 2022 published table",
  st_john:
    "Island of St. John Taxi Rate Sheet and Provisions · 2022 published table",
  st_croix:
    "Island of St. Croix Taxi Rate Sheet and Provisions · 2022 published table",
} as const;

export const TAXI_ADDITIONAL_CHARGES: Record<
  Exclude<MobilityIsland, "water_island">,
  TaxiAdditionalChargeRule
> = {
  st_thomas: {
    island: "st_thomas",
    waitingPerMinuteAfterFirstFive: 2,
    luggagePerBag: 3,
    oversizedLuggageMax: 6,
    afterHoursPerPassenger: 3,
    radioCallMoreThanOnePerPassenger: 2,
    kennelLarge: 45,
    kennelSmall: 30,
    exclusivePolicy:
      "Airport to Red Hook: $135 for 1-4 passengers, 5+ add $23 each. Within Town Limits: $83 for 1-4 passengers, 5+ add $11 each. Other exclusive routes must be negotiated between taxi operator and passenger(s).",
    roundTripPolicy: "Double the one-way fare plus waiting charges.",
    hourlyRates:
      "1-4 passengers: Sedan/Mini Van $60; Van/Safari 14 passenger capacity $83; Safari $120. Additional passengers negotiated.",
    sightseeingRates:
      "2 hours: 1 passenger $75, 2+ passengers $38 per person. 3 hours: 1 passenger $90, 2+ passengers $45 per person.",
  },
  st_john: {
    island: "st_john",
    waitingPerMinuteAfterFirstFive: 1,
    luggagePerBag: 3,
    oversizedLuggageMax: 6,
    afterHoursPerPassenger: 3,
    radioCallMoreThanOnePerPassenger: 2,
    kennelLarge: 45,
    kennelSmall: 30,
    exclusivePolicy:
      "Any person requesting a taxi exclusively for themselves: rate to be negotiated between taxi operator and passenger(s).",
    roundTripPolicy: "Double the one-way fare plus waiting charges.",
    hourlyRates:
      "1-4 passengers: Sedan/Mini Van $60; Van/Safari 14 passenger capacity $70; Safari $90. Additional passengers negotiated.",
    sightseeingRates:
      "Limited 2-hour tour: 1 passenger $70; 2+ passengers $35 per person.",
  },
  st_croix: {
    island: "st_croix",
    waitingPerMinuteAfterFirstFive: 2,
    luggagePerBag: 3,
    oversizedLuggageMax: 6,
    afterHoursPerPassenger: 3,
    radioCallMoreThanOnePerPassenger: 2,
    kennelLarge: 45,
    kennelSmall: 30,
    exclusivePolicy:
      "Anyone requesting a taxi exclusively for themselves shall pay the rate for four passengers.",
    roundTripPolicy: "Double the one-way fare plus waiting charges.",
    hourlyRates:
      "1-4 passengers: Sedan/Mini Van $60; Van/Safari 14 passenger capacity $83; Safari $120. Additional passengers negotiated.",
    sightseeingRates:
      "Limited 3-hour tour: 1-4 people $150; 5+ people $30 per person.",
  },
};

const STT_HOTELS_TO_CHARLOTTE_AMALIE_AND_AIRPORT = `
Anchorage|23.00|15.00|27.00|18.00
Blackbeard’s Castle|8.00|6.00|12.00|11.00
Bluebeard’s Castle|8.00|6.00|12.00|11.00
Bolongo Bay|15.00|12.00|18.00|14.00
Carib Beach Resort|11.00|9.00|6.00|6.00
Compass Point|18.00|14.00|21.00|15.00
Cowpet Bay|23.00|15.00|27.00|18.00
Danish Chalet Inn|11.00|8.00|12.00|9.00
Elysian Resort|23.00|15.00|27.00|18.00
Emerald Beach Resort|11.00|9.00|6.00|6.00
Frenchman’s Reef & Cove|12.00|9.00|15.00|12.00
Hotel 1829|6.00|6.00|11.00|9.00
Islander Beachcomber|11.00|9.00|6.00|6.00
Island View Inn|14.00|11.00|12.00|9.00
Limetree|15.00|12.00|18.00|14.00
Mafolie Hotel|12.00|9.00|15.00|12.00
Flamboyan|15.00|11.00|18.00|14.00
Palms Court Harborview|11.00|8.00|12.00|9.00
Pavillions and Pools|21.00|15.00|23.00|17.00
Point Pleasant|21.00|15.00|23.00|17.00
Margaritaville/Pineapple Beach|21.00|15.00|23.00|17.00
Ritz Carlton Resort & Club|23.00|15.00|27.00|18.00
Sapphire Beach Resort|21.00|15.00|23.00|17.00
Secret Harbor Resort|23.00|15.00|27.00|18.00
Thatch Farm|11.00|9.00|8.00|6.00
Windward Passage Hotel|6.00|6.00|11.00|9.00
Wyndham Sugar Bay|21.00|15.00|23.00|17.00
Yacht Haven – Havensight|6.00|6.00|11.00|9.00
`;

const STT_MISC_TO_CHARLOTTE_AMALIE_AND_AIRPORT = `
Agnes Fancy|9.00|8.00|12.00|11.00
Airport Terminal|11.00|9.00||
BlackPoint|15.00|12.00|12.00|9.00
Bonne Esperance|17.00|14.00|15.00|12.00
Bolongo|15.00|12.00|18.00|14.00
Bordeaux|23.00|14.00|17.00|14.00
Botany Bay|25.00|16.00|19.00|16.00
Bournefield|11.00|9.00|8.00|6.00
Bovoni|15.00|12.00|17.00|14.00
Brookman Estate|15.00|12.00|17.00|14.00
Canaan Estate|14.00|11.00|15.00|12.00
Caret Bay|18.00|14.00|17.00|14.00
Caret Bay Lower|18.00|12.00|21.00|14.00
Caret Bay Upper|20.00|15.00|21.00|14.00
Cassi Hill|15.00|12.00|18.00|14.00
Coki Point|18.00|14.00|21.00|15.00
Contant Development|12.00|9.00|11.00|9.00
Contant Soto Town|9.00|8.00|9.00|8.00
Crown Mountain|15.00|12.00|14.00|11.00
Crown Bay|8.00|6.00|8.00|6.00
Dorothea Estate|18.00|14.00|18.00|14.00
Dorothea Lower|25.00|20.00|25.00|20.00
Dorothea Upper|20.00|15.00|20.00|15.00
Drake’s Seat|11.00|8.00|14.00|11.00
Elizabeth Estate|12.00|9.00|15.00|12.00
Est. Thomas New Quarter|9.00|8.00|11.00|9.00
Flag Hill|14.00|11.00|15.00|12.00
Fort Mylner|12.00|9.00|14.00|11.00
Fortuna Mill|18.00|15.00|15.00|12.00
Fortuna Point|21.00|14.00|18.00|12.00
Frenchtown|6.00|6.00|11.00|9.00
Fredenhoj|18.00|14.00|21.00|15.00
Frenchman’s Bay|15.00|12.00|18.00|14.00
Havensight (crossroad)|9.00|8.00|12.00|11.00
Hawk Hill|17.00|12.00|18.00|14.00
Hull Bay|18.00|12.00|23.00|15.00
Louisenhoj Castle|11.00|8.00|14.00|11.00
Lovenlund|15.00|11.00|18.00|14.00
Lower John Dunkoe|11.00|8.00|11.00|9.00
Magens Bay|15.00|12.00|18.00|15.00
Mahogany Run|15.00|12.00|20.00|15.00
Mandahl Bay|18.00|14.00|21.00|15.00
Market Square East|12.00|9.00|15.00|12.00
Mountain Top|17.00|12.00|18.00|14.00
Nadir Hill|17.00|14.00|18.00|15.00
Nisky|8.00|6.00|8.00|6.00
Paradise Point|14.00|11.00|17.00|14.00
Peterborg|18.00|14.00|23.00|17.00
Estate Pearl|17.00|12.00|14.00|11.00
Raphune Hill|9.00|8.00|12.00|9.00
Red Hook|20.00|15.00|23.00|17.00
Rosendahl|14.00|11.00|18.00|12.00
Scott Free|14.00|11.00|12.00|9.00
Smith Bay|18.00|12.00|20.00|15.00
Solberg Lookout|11.00|8.00|12.00|9.00
Solberg Upper|14.00|11.00|15.00|12.00
Sorgenfri|17.00|12.00|18.00|14.00
St. Peter Mountain|15.00|12.00|18.00|14.00
Tabor/Harmony|17.00|12.00|20.00|15.00
Tutu|14.00|11.00|17.00|12.00
University of the Virgin Islands|11.00|9.00|8.00|8.00
West Indian Dock|6.00|6.00|11.00|9.00
Wintberg|15.00|12.00|18.00|14.00
`;

const STT_CROSS_ISLAND = `
Within Town Limits|Within Town Limits|6.00|6.00
Bolongo|Coki|14.00|11.00
Bolongo|Market Square East|14.00|11.00
Frenchman’s Reef|Mahogany Run|18.00|14.00
Frenchman’s Reef|Mountain Top|18.00|14.00
Frenchman’s Reef|Limetree|11.00|8.00
Frenchman’s Reef|Market Square East|15.00|12.00
Frenchman’s Reef|Magens Bay|18.00|14.00
Magens Bay|Coki|18.00|14.00
Magens Bay|Bolongo|18.00|14.00
Magens Bay|Crown Bay|18.00|15.00
Magens Bay|Havensight (WICO)|15.00|12.00
Magens Bay|Mountain Top|15.00|12.00
Magens Bay|Limetree|18.00|14.00
Magens Bay|Sapphire Beach|18.00|14.00
Magens Bay|Ritz Carlton|23.00|15.00
Mahogany Run|Bolongo|18.00|14.00
Mahogany Run|Cowpet|18.00|15.00
Mahogany Run|Limetree|18.00|14.00
Mahogany Run|Mountain Top|15.00|12.00
Red Hook|Bovoni|11.00|9.00
Red Hook|Bolongo|12.00|11.00
Red Hook|Bordeaux|30.00|21.00
Red Hook|Caret Bay|24.00|18.00
Red Hook|Crown Mountain|23.00|17.00
Red Hook|Market Square East|14.00|11.00
Red Hook|Dorothea|23.00|16.00
Red Hook|Frenchman’s Reef|18.00|15.00
Red Hook|Hull Bay|23.00|15.00
Red Hook|Limetree|15.00|12.00
Red Hook|Mafolie|20.00|15.00
Red Hook|Mandahl|17.00|12.00
Red Hook|Mountain Top|23.00|15.00
Red Hook|Paradise Point|23.00|17.00
Red Hook|Tutu|12.00|9.00
Red Hook|Wintberg|17.00|12.00
Red Hook|Magens Bay|18.00|14.00
Red Hook|Peterborg|23.00|17.00
Tutu|Bolongo|12.00|9.00
Tutu|Bovoni|12.00|9.00
Tutu|Bordeaux|27.00|18.00
Tutu|Caret Bay|23.00|15.00
Tutu|Cowpet|14.00|11.00
Tutu|Crown Mountain|20.00|15.00
Tutu|Frenchman’s Bay|14.00|11.00
Tutu|Coki|11.00|9.00
Tutu|Limetree|14.00|11.00
Tutu|Mafolie|14.00|11.00
Tutu|Magens Bay|15.00|11.00
Tutu|Mountain Top|18.00|14.00
`;

const STJ_CRUZ_BAY = `
Annaberg|20.00|14.00
Bethany|8.00|7.00
Bordeaux Mountain|26.00|17.00
Beth Cruz/Upper Deck|9.00|8.00
Calabash Boom|30.00|21.00
Caneel Bay|9.00|8.00
Catherineberg|14.00|11.00
Chateau de Bordeaux|14.00|11.00
Chocolate Hole|11.00|9.00
Cinnamon Bay|14.00|11.00
Concordia|30.00|21.00
Contant|9.00|7.00
Coral Bay|25.00|15.00
Dennis Bay|12.00|9.00
Desoto Bock House (East End)|38.00|23.00
Estate Lindholm|8.00|6.00
Fish Bay|20.00|12.00
Francis Bay|20.00|14.00
Frank Bay|8.00|6.00
Gallows Point|8.00|6.00
Gift Hill|12.00|9.00
George Simmonds Terrace|12.00|9.00
Goat Path/Maho Bay Beach|17.00|12.00
Great Cruz Bay|9.00|8.00
Grunwald|9.00|8.00
Haulover|32.00|22.00
Hawksnest|9.00|8.00
Hurricane Hole|29.00|20.00
John’s Head|14.00|11.00
Jumbie Beach|12.00|9.00
Lameshur|38.00|25.00
Leinster Bay|20.00|14.00
Little Maho Bay Campground|20.00|14.00
Mandahl|30.00|21.00
Ms. Lucy’s|30.00|21.00
Oppenheimer|9.00|8.00
Pine Peace|8.00|6.00
Privateer Bay|45.00|30.00
Rendezous Bay (Klein Bay)|15.00|10.00
Reef Bay Trail|14.00|11.00
Salt Pond|30.00|21.00
Sunset Ridge|12.00|9.00
Susannaberg (Clinic/Laundry)|12.00|9.00
Trunk Bay|12.00|9.00
Vie’s (East End)|38.00|25.00
Westin Resort|9.00|7.00
Zootenvaal|27.00|18.00
`;

const STJ_CORAL_BAY = `
Annaberg|12.00|9.00
Blomingdale (Freeman Ground)|9.00|8.00
Calabash Boom|9.00|8.00
Caneel Bay (via Northshore)|20.00|14.00
Cinnamon Bay|13.00|10.00
Desoto Bock House (East End)|18.00|9.00
George Simmonds Terrace|14.00|11.00
Hawksnest|20.00|14.00
Hurricane Hole|11.00|8.00
John’s Folly School|9.00|8.00
Lamishur|15.00|10.00
Maho Bay Beach|12.00|9.00
Mandahl|11.00|9.00
Oppenheimer|20.00|14.00
Salt Pond|11.00|9.00
Public Works|15.00|11.00
Susannaberg (Clinic/Laundry)|15.00|11.00
Trunk Bay (via Centerline)|29.00|20.00
Trunk Bay (via North Shore)|14.00|11.00
Vie’s (East End)|12.00|11.00
Zootenvaal|9.00|8.00
`;

const STJ_GALLOWS_POINT = `
Annaberg|20.00|14.00
Caneel Bay|10.00|8.00
Cinnamon Bay|15.00|12.00
Cruz Bay|8.00|6.00
Coral Bay|25.00|16.00
Maho Bay Beach/Goat Path|17.00|13.00
Francis Bay|20.00|15.00
Golf Course/Pastory|11.00|8.00
Hawksnest Beach|10.00|8.00
Jumbie Bay|13.00|10.00
Maho Bay Campground|20.00|14.00
Oppenheimer|10.00|8.00
Susannaberg (Clinic/Laundry)|12.00|9.00
Trunk Bay|13.00|10.00
Westin|11.00|8.00
`;

const STJ_CANEEL_BAY = `
Annaberg|18.00|12.00
Bordeaux Mountain|27.00|15.00
Chateau de Bordeaux|20.00|14.00
Cinnamon Bay|12.00|9.00
Coral Bay (Via Centerline)|27.00|15.00
Coral Bay (Via Northshore)|20.00|14.00
Francis Bay|18.00|12.00
Gallows Point|10.00|8.00
Hawksnest Bay|8.00|6.00
Lamishur (via Northshore)|35.00|20.00
Maho Bay Beach/Goat Path|15.00|11.00
Pastory/Course|12.00|9.00
Maho Bay Campground|18.00|13.00
Salt Pond (via Northshore)|30.00|18.00
Susannaberg (Clinic/Laundry)|16.00|13.00
Trunk Bay|11.00|8.00
Westin|12.00|9.00
`;

const STJ_WESTIN = `
Annaberg|23.00|17.00
Asolare/Estate Lindholm|11.00|8.00
Calabash Boom|35.00|21.00
Caneel Bay|12.00|10.00
Chateau de Bordeaux|18.00|15.00
Catherineberg|17.00|14.00
Chocolate Hole|8.00|6.00
Cinnamon Bay|17.00|14.00
Coral Bay|25.00|17.00
Cruz Bay|9.00|7.00
Dennis Bay|15.00|12.00
East End|41.00|27.00
Fish Bay|15.00|10.00
Francis Bay|23.00|17.00
Gallows Point|11.00|8.00
Gift Hill|11.00|8.00
Maho Bay Beach/Goat Path|18.00|15.00
Golf Course/Pastory|11.00|8.00
Hawknest Bay|12.00|10.00
Maho Bay Campground|23.00|17.00
Ms. Lucy’s|38.00|23.00
Oppenheimer|12.00|10.00
Salt Pond|40.00|26.00
Susannaberg (Clinic/Laundry)|15.00|12.00
Trunk Bay|15.00|12.00
`;

const STJ_NEPTUNE_LANDING_WINDMILL = `
Annaberg|20.00|17.00
Caneel Bay|16.00|13.00
Cinnamon Bay|18.00|15.00
Coral Bay|18.00|11.00
Cruz Bay|12.00|9.00
Francis Bay|20.00|17.00
Gallows Point|12.00|9.00
Goat Path/Maho Bay Beach|20.00|17.00
Hawksnest Beach|16.00|13.00
Jumbie Beach|17.00|14.00
Maho Bay Campground|27.00|20.00
Oppenheimer|16.00|13.00
Trunk Bay|17.00|14.00
Westin|15.00|12.00
`;

const STX_AIRPORT = `
Annaly|30.00|15.00
Belvedere|30.00|15.00
Buccaneer|30.00|15.00
Canaan|27.00|14.00
Canaan Ridge|33.00|17.00
Cane Bay Plantation|30.00|15.00
Cane Garden|23.00|12.00
Carambola|30.00|15.00
Castle Nugent|27.00|14.00
Chenay Bay|32.00|17.00
Christiansted|24.00|14.00
Coakley Bay|33.00|17.00
Constitution Hill|23.00|12.00
Cotton Grove|36.00|17.00
Cotton Valley|36.00|17.00
Cramer’s Park|36.00|17.00
Divi Carina Bay|36.00|18.00
Farsham|30.00|15.00
Frederiksted|18.00|9.00
Gentle Winds|26.00|14.00
Grapetree Bay|36.00|17.00
Great Pond|30.00|15.00
Green Cay|33.00|17.00
Ham’s Bay/Clover Crest|30.00|15.00
Ham’s Bay/Clover Guard|30.00|15.00
Lime Tree Bay|18.00|9.00
Humbug|23.00|12.00
King Frederik Hotel|18.00|9.00
La Grange|23.00|12.00
La Grange Hill|27.00|14.00
Longford|24.00|12.00
Lowry Hill|27.00|14.00
Mt. Washington (East End)|27.00|14.00
Mt. Washington (West)|30.00|15.00
Oxford|30.00|15.00
Petronella|27.00|14.00
Queen’s Quarter|23.00|12.00
Sally’s Fancy|27.00|14.00
Sandy Point|23.00|12.00
Sandy Point (Nature Conserve)|27.00|14.00
Salt River|26.00|14.00
Seven Hills|30.00|17.00
Shoy’s Estate|30.00|15.00
Sion Valley|23.00|12.00
Solitude|32.00|17.00
Sprat Hall|26.00|14.00
St. Croix by The Sea|23.00|12.00
Sugar Hill Estate|24.00|12.00
Sunny Isle|18.00|9.00
Tamarind Reef|32.00|17.00
Tide Village|26.00|14.00
Work and Rest|23.00|12.00
`;

const STX_CHRISTIANSTED = `
Annaly|39.00|20.00
Anna’s Hope|12.00|6.00
Bethlehem (Upper/Lower)|23.00|12.00
Buccaneer Hotel|14.00|8.00
Boetzberg|15.00|8.00
Cane Bay|36.00|17.00
Carambola|45.00|18.00
Castle Coakley/Sion Farm|18.00|9.00
Castle Nugent|23.00|12.00
Catherine’s Rest|18.00|9.00
Club St. Croix|12.00|6.00
Coakley Bay|23.00|12.00
Constitution Hill|15.00|8.00
Cormorant|15.00|8.00
Cotton Grove|26.00|14.00
Cotton Valley|26.00|14.00
Cramer’s Park|27.00|14.00
Divi Carina Bay|27.00|14.00
Farsham|23.00|12.00
Frederiksted|36.00|17.00
Gallows’ Bay|9.00|5.00
Gentle Wind|33.00|17.00
Glynn|18.00|9.00
Golden Rock Shopping Center|12.00|6.00
Grange|12.00|6.00
Grapetree Bay|27.00|14.00
Great Pond|23.00|12.00
Green Cay|18.00|9.00
Grove Place|30.00|15.00
Lime Tree Bay|18.00|9.00
Hibiscus Beach Hotel|15.00|8.00
Humbug|18.00|9.00
Kingshill|21.00|11.00
La Grande Princesse|15.00|8.00
La Reine|21.00|11.00
Longford|23.00|12.00
Lowry Hill|17.00|9.00
Mon Bijou|21.00|11.00
Morning Star|18.00|9.00
Mount Washington (East)|23.00|12.00
Pearl|18.00|9.00
Peter’s Rest|17.00|9.00
Petronella|23.00|12.00
Rust-Up-Twist|36.00|18.00
Sally’s Fancy|23.00|12.00
Salt River|33.00|17.00
Seven Hills|24.00|12.00
Shoy’s Estate|15.00|8.00
Solitude|23.00|12.00
Southgate/Tipperary|18.00|9.00
Strawberry/Barren Spot|18.00|9.00
Sunny Isle/Island Center|18.00|9.00
Tamarind Reef|18.00|9.00
Tide Village|12.00|6.00
Upper and Lower Love|27.00|14.00
William’s Delight|30.00|15.00
Welcome Estate|9.00|5.00
`;

const STX_FREDERIKSTED = `
Annaly|26.00|14.00
Butler’s Bay|17.00|9.00
Carambola|41.00|17.00
Christiansted|36.00|17.00
Diamond/St. George’s|15.00|8.00
Davis Bay|41.00|17.00
Divi Carina Bay|54.00|27.00
Grove Place Village|23.00|12.00
Grove Place Hills|30.00|14.00
Hannah’s Rest|12.00|6.00
Lime Tree Bay|30.00|15.00
Jolly Hill|17.00|9.00
La Grange|12.00|6.00
Little La Grange|15.00|8.00
Manning’s Bay|18.00|9.00
Mon Bijou|30.00|15.00
Mt. Pleasant|23.00|12.00
Mt. Washington (Frederiksted)|23.00|12.00
Seven Hills|44.00|18.00
Sion Farm|30.00|15.00
Sprat Hall|15.00|8.00
St Croix Renaissance Park|26.00|14.00
Sunny Isle|30.00|15.00
Sunset Beach|9.00|5.00
Whim Plantation/Good Hope|14.00|8.00
`;

const STX_CARAMBOLA = `
Buccaneer|48.00|24.00
Chenay Bay|48.00|23.00
Coakley Bay|48.00|23.00
Divi Carina Bay|54.00|23.00
Grapetree Bay|54.00|23.00
Sprat Hall|41.00|18.00
Reef Condominiums|51.00|23.00
Frederiksted|41.00|17.00
Tamarind Reef|48.00|23.00
`;

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseAmount(value: string) {
  const clean = value.trim().replace(":", ".");
  if (!clean || clean === "—" || clean === "-") return null;
  const amount = Number(clean);
  return Number.isFinite(amount) ? amount : null;
}

function pipeRows(raw: string) {
  return raw
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((part) => part.trim()));
}

function addPerPersonRule(
  rules: TaxiFareRule[],
  island: MobilityIsland,
  from: string,
  to: string,
  one: number | null,
  multi: number | null,
  sourceTable: string
) {
  if (one === null || multi === null) return;

  rules.push({
    id: `${slug(island)}-${slug(from)}-${slug(to)}`,
    island,
    from,
    to,
    pricingModel: "per_person_same_group",
    onePassengerFare: one,
    sameGroupTwoPlusPerPerson: multi,
    sourceTable,
  });
}

function addStxRule(
  rules: TaxiFareRule[],
  from: string,
  to: string,
  oneOrTwo: number | null,
  threePlus: number | null,
  sourceTable: string
) {
  if (oneOrTwo === null || threePlus === null) return;

  rules.push({
    id: `st-croix-${slug(from)}-${slug(to)}`,
    island: "st_croix",
    from,
    to,
    pricingModel: "stx_one_or_two_then_three_plus_each",
    oneOrTwoPeopleFare: oneOrTwo,
    threePlusEachFare: threePlus,
    sourceTable,
  });
}

function stThomasHubRules(raw: string, sourceTable: string) {
  const rules: TaxiFareRule[] = [];

  for (const [place, caOne, caMulti, airportOne, airportMulti] of pipeRows(raw)) {
    addPerPersonRule(
      rules,
      "st_thomas",
      place,
      "Charlotte Amalie",
      parseAmount(caOne),
      parseAmount(caMulti),
      sourceTable
    );

    addPerPersonRule(
      rules,
      "st_thomas",
      place,
      "Cyril E. King Airport",
      parseAmount(airportOne || ""),
      parseAmount(airportMulti || ""),
      sourceTable
    );
  }

  return rules;
}

function stThomasCrossRules() {
  const rules: TaxiFareRule[] = [];

  for (const [from, to, one, multi] of pipeRows(STT_CROSS_ISLAND)) {
    addPerPersonRule(
      rules,
      "st_thomas",
      from,
      to,
      parseAmount(one),
      parseAmount(multi),
      "St. Thomas cross-island tariff table"
    );
  }

  return rules;
}

function stJohnHubRules(hub: string, raw: string, sourceTable: string) {
  const rules: TaxiFareRule[] = [];

  for (const [to, one, multi] of pipeRows(raw)) {
    addPerPersonRule(
      rules,
      "st_john",
      hub,
      to,
      parseAmount(one),
      parseAmount(multi),
      sourceTable
    );
  }

  return rules;
}

function stCroixHubRules(hub: string, raw: string, sourceTable: string) {
  const rules: TaxiFareRule[] = [];

  for (const [to, oneOrTwo, threePlus] of pipeRows(raw)) {
    addStxRule(
      rules,
      hub,
      to,
      parseAmount(oneOrTwo),
      parseAmount(threePlus),
      sourceTable
    );
  }

  return rules;
}

export function getTaxiFareRules(): TaxiFareRule[] {
  return [
    ...stThomasHubRules(
      STT_HOTELS_TO_CHARLOTTE_AMALIE_AND_AIRPORT,
      "St. Thomas hotels to/from Charlotte Amalie and Cyril E. King Airport"
    ),
    ...stThomasHubRules(
      STT_MISC_TO_CHARLOTTE_AMALIE_AND_AIRPORT,
      "St. Thomas miscellaneous to/from Charlotte Amalie and Cyril E. King Airport"
    ),
    ...stThomasCrossRules(),

    ...stJohnHubRules("Cruz Bay", STJ_CRUZ_BAY, "St. John Cruz Bay tariff table"),
    ...stJohnHubRules(
      "Coral Bay",
      STJ_CORAL_BAY,
      "St. John Coral Bay tariff table"
    ),
    ...stJohnHubRules(
      "Gallows Point",
      STJ_GALLOWS_POINT,
      "St. John Gallows Point tariff table"
    ),
    ...stJohnHubRules(
      "Caneel Bay",
      STJ_CANEEL_BAY,
      "St. John Caneel Bay tariff table"
    ),
    ...stJohnHubRules(
      "Westin Resort",
      STJ_WESTIN,
      "St. John Westin Resort tariff table"
    ),
    ...stJohnHubRules(
      "Neptune Landing/Windmill",
      STJ_NEPTUNE_LANDING_WINDMILL,
      "St. John Neptune Landing/Windmill tariff table"
    ),

    ...stCroixHubRules("Airport", STX_AIRPORT, "St. Croix Airport tariff table"),
    ...stCroixHubRules(
      "Christiansted",
      STX_CHRISTIANSTED,
      "St. Croix Christiansted tariff table"
    ),
    ...stCroixHubRules(
      "Frederiksted",
      STX_FREDERIKSTED,
      "St. Croix Frederiksted tariff table"
    ),
    ...stCroixHubRules(
      "Carambola",
      STX_CARAMBOLA,
      "St. Croix Carambola tariff table"
    ),
  ];
}

export function getTaxiTariffPlaces(island: MobilityIsland) {
  const places = new Set<string>();

  for (const rule of getTaxiFareRules()) {
    if (rule.island === island) {
      places.add(rule.from);
      places.add(rule.to);
    }
  }

  return Array.from(places).sort((a, b) => a.localeCompare(b));
}

export const TAXI_TARIFF_RAW_ROW_COUNTS = {
  stThomasHotelRows: pipeRows(STT_HOTELS_TO_CHARLOTTE_AMALIE_AND_AIRPORT).length,
  stThomasMiscRows: pipeRows(STT_MISC_TO_CHARLOTTE_AMALIE_AND_AIRPORT).length,
  stThomasCrossRows: pipeRows(STT_CROSS_ISLAND).length,
  stJohnRows:
    pipeRows(STJ_CRUZ_BAY).length +
    pipeRows(STJ_CORAL_BAY).length +
    pipeRows(STJ_GALLOWS_POINT).length +
    pipeRows(STJ_CANEEL_BAY).length +
    pipeRows(STJ_WESTIN).length +
    pipeRows(STJ_NEPTUNE_LANDING_WINDMILL).length,
  stCroixRows:
    pipeRows(STX_AIRPORT).length +
    pipeRows(STX_CHRISTIANSTED).length +
    pipeRows(STX_FREDERIKSTED).length +
    pipeRows(STX_CARAMBOLA).length,
};

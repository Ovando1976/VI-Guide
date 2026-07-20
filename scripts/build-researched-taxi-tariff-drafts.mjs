import { mkdir, writeFile } from "node:fs/promises";

const source = {
  stt: "https://www.vinow.com/stthomas/getting_around_stt/taxi_stt/",
  stj: "https://www.vinow.com/stjohn/getting_around_stj/taxis-rates/",
  stx: "https://www.vinow.com/stcroix/getting_around_stx/taxis-rates/",
};

const sttHotels = `Anchorage 23 15 27 18
Blackbeard's Castle 8 6 12 11
Bluebeard's Castle 8 6 12 11
Bolongo Bay 15 12 18 14
Carib Beach Resort 11 9 6 6
Compass Point 18 14 21 15
Cowpet Bay 23 15 27 18
Danish Chalet Inn 11 8 12 9
Elysian Resort 23 15 27 18
Emerald Beach Resort 11 9 6 6
Frenchman's Reef & Cove 12 9 15 12
Hotel 1829 6 6 11 9
Islander Beachcomber 11 9 6 6
Island View Inn 14 11 12 9
Limetree 15 12 18 14
Mafolie Hotel 12 9 15 12
Flamboyan 15 11 18 14
Palms Court Harborview 11 8 12 9
Pavillions and Pools 21 15 23 17
Point Pleasant 21 15 23 17
Margaritaville/Pineapple Beach 21 15 23 17
Ritz Carlton Resort & Club 23 15 27 18
Sapphire Beach Resort 21 15 23 17
Secret Harbor Resort 23 15 27 18
Thatch Farm 11 9 8 6
Windward Passage Hotel 6 6 11 9
Wyndham Sugar Bay 21 15 23 17
Yacht Haven - Havensight 6 6 11 9`;

const sttMisc = `Agnes Fancy 9 8 12 11
BlackPoint 15 12 12 9
Bonne Esperance 17 14 15 12
Bolongo 15 12 18 14
Bordeaux 23 14 17 14
Botany Bay 25 16 19 16
Bournefield 11 9 8 6
Bovoni 15 12 17 14
Brookman Estate 15 12 17 14
Canaan Estate 14 11 15 12
Caret Bay 18 14 17 14
Caret Bay Lower 18 12 21 14
Caret Bay Upper 20 15 21 14
Cassi Hill 15 12 18 14
Coki Point 18 14 21 15
Contant Development 12 9 11 9
Contant Soto Town 9 8 9 8
Crown Mountain 15 12 14 11
Crown Bay 8 6 8 6
Dorothea Estate 18 14 18 14
Dorothea Lower 25 20 25 20
Dorothea Upper 20 15 20 15
Drake's Seat 11 8 14 11
Elizabeth Estate 12 9 15 12
Estate Thomas New Quarter 9 8 11 9
Flag Hill 14 11 15 12
Fort Mylner 12 9 14 11
Fortuna Mill 18 15 15 12
Fortuna Point 21 14 18 12
Frenchtown 6 6 11 9
Fredenhoj 18 14 21 15
Frenchman's Bay 15 12 18 14
Havensight Crossroad 9 8 12 11
Hawk Hill 17 12 18 14
Hull Bay 18 12 23 15
Louisenhoj Castle 11 8 14 11
Lovenlund 15 11 18 14
Lower John Dunkoe 11 8 11 9
Magens Bay 15 12 18 15
Mahogany Run 15 12 20 15
Mandahl Bay 18 14 21 15
Market Square East 12 9 15 12
Mountain Top 17 12 18 14
Nadir Hill 17 14 18 15
Nisky 8 6 8 6
Paradise Point 14 11 17 14
Peterborg 18 14 23 17
Estate Pearl 17 12 14 11
Raphune Hill 9 8 12 9
Red Hook 20 15 23 17
Rosendahl 14 11 18 12
Scott Free 14 11 12 9
Smith Bay 18 12 20 15
Solberg Lookout 11 8 12 9
Solberg Upper 14 11 15 12
Sorgenfri 17 12 18 14
St. Peter Mountain 15 12 18 14
Tabor/Harmony 17 12 20 15
Tutu 14 11 17 12
University of the Virgin Islands 11 9 8 8
West Indian Dock 6 6 11 9
Wintberg 15 12 18 14`;

const stjSections = {
  "Cruz Bay": `Annaberg 20 14
Bethany 8 7
Bordeaux Mountain 26 17
Beth Cruz/Upper Deck 9 8
Calabash Boom 30 21
Caneel Bay 9 8
Catherineberg 14 11
Chateau de Bordeaux 14 11
Chocolate Hole 11 9
Cinnamon Bay 14 11
Concordia 30 21
Contant 9 7
Coral Bay 25 15
Dennis Bay 12 9
Desoto Bock House (East End) 38 23
Estate Lindholm 8 6
Fish Bay 20 12
Francis Bay 20 14
Frank Bay 8 6
Gallows Point 8 6
Gift Hill 12 9
George Simmonds Terrace 12 9
Goat Path/Maho Bay Beach 17 12
Great Cruz Bay 9 8
Grunwald 9 8
Haulover 32 22
Hawksnest 9 8
Hurricane Hole 29 20
John's Head 14 11
Jumbie Beach 12 9
Lameshur 38 25
Leinster Bay 20 14
Little Maho Bay Campground 20 14
Mandahl 30 21
Ms. Lucy's 30 21
Oppenheimer 9 8
Pine Peace 8 6
Privateer Bay 45 30
Rendezvous Bay (Klein Bay) 15 10
Reef Bay Trail 14 11
Salt Pond 30 21
Sunset Ridge 12 9
Susannaberg (Clinic/Laundry) 12 9
Trunk Bay 12 9
Vie's (East End) 38 25
Westin Resort 9 7
Zootenvaal 27 18`,
  "Coral Bay": `Annaberg 12 9
Bloomingdale (Freeman Ground) 9 8
Calabash Boom 9 8
Caneel Bay (via Northshore) 20 14
Cinnamon Bay 13 10
Desoto Bock House (East End) 18 9
George Simmonds Terrace 14 11
Hawksnest 20 14
Hurricane Hole 11 8
John's Folly School 9 8
Lameshur 15 10
Maho Bay Beach 12 9
Mandahl 11 9
Oppenheimer 20 14
Salt Pond 11 9
Public Works 15 11
Susannaberg (Clinic/Laundry) 15 11
Trunk Bay (via Centerline) 29 20
Trunk Bay (via North Shore) 14 11
Vie's (East End) 12 11
Zootenvaal 9 8`,
  "Gallows Point": `Annaberg 20 14
Caneel Bay 10 8
Cinnamon Bay 15 12
Cruz Bay 8 6
Coral Bay 25 16
Maho Bay Beach/Goat Path 17 13
Francis Bay 20 15
Golf Course/Pastory 11 8
Hawksnest Beach 10 8
Jumbie Bay 13 10
Maho Bay Campground 20 14
Oppenheimer 10 8
Susannaberg (Clinic/Laundry) 12 9
Trunk Bay 13 10
Westin 11 8`,
  "Caneel Bay": `Annaberg 18 12
Bordeaux Mountain 27 15
Chateau de Bordeaux 20 14
Cinnamon Bay 12 9
Coral Bay (Via Centerline) 27 15
Coral Bay (Via Northshore) 20 14
Francis Bay 18 12
Gallows Point 10 8
Hawksnest Bay 8 6
Lameshur (via Northshore) 35 20
Maho Bay Beach/Goat Path 15 11
Pastory/Course 12 9
Maho Bay Campground 18 13
Salt Pond (via Northshore) 30 18
Susannaberg (Clinic/Laundry) 16 13
Trunk Bay 11 8
Westin 12 9`,
  "Westin Resort": `Annaberg 23 17
Asolare/Estate Lindholm 11 8
Calabash Boom 35 21
Caneel Bay 12 10
Chateau de Bordeaux 18 15
Catherineberg 17 14
Chocolate Hole 8 6
Cinnamon Bay 17 14
Coral Bay 25 17
Cruz Bay 9 7
Dennis Bay 15 12
East End 41 27
Fish Bay 15 10
Francis Bay 23 17
Gallows Point 11 8
Gift Hill 11 8
Maho Bay Beach/Goat Path 18 15
Golf Course/Pastory 11 8
Hawksnest Bay 12 10
Maho Bay Campground 23 17
Ms. Lucy's 38 23
Oppenheimer 12 10
Salt Pond 40 26
Susannaberg (Clinic/Laundry) 15 12
Trunk Bay 15 12`,
  "Neptune Landing/Windmill": `Annaberg 20 17
Caneel Bay 16 13
Cinnamon Bay 18 15
Coral Bay 18 11
Cruz Bay 12 9
Francis Bay 20 17
Gallows Point 12 9
Goat Path/Maho Bay Beach 20 17
Hawksnest Beach 16 13
Jumbie Beach 17 14
Maho Bay Campground 27 20
Oppenheimer 16 13
Trunk Bay 17 14
Westin 15 12`,
};

const stxSections = {
  "Henry E. Rohlsen Airport": `Annaly 30 15
Belvedere 30 15
Buccaneer 30 15
Canaan 27 14
Canaan Ridge 33 17
Cane Bay Plantation 30 15
Cane Garden 23 12
Carambola 30 15
Castle Nugent 27 14
Chenay Bay 32 17
Christiansted 24 14
Coakley Bay 33 17
Constitution Hill 23 12
Cotton Grove 36 17
Cotton Valley 36 17
Cramer's Park 36 17
Divi Carina Bay 36 18
Farsham 30 15
Frederiksted 18 9
Gentle Winds 26 14
Grapetree Bay 36 17
Great Pond 30 15
Green Cay 33 17
Ham's Bay/Clover Crest 30 15
Ham's Bay/Clover Guard 30 15
Lime Tree Bay 18 9
Humbug 23 12
King Frederik Hotel 18 9
La Grange 23 12
La Grange Hill 27 14
Longford 24 12
Lowry Hill 27 14
Mt. Washington (East End) 27 14
Mt. Washington (West) 30 15
Oxford 30 15
Petronella 27 14
Queen's Quarter 23 12
Sally's Fancy 27 14
Sandy Point 23 12
Sandy Point (Nature Conservancy) 27 14
Salt River 26 14
Seven Hills 30 17
Shoy's Estate 30 15
Sion Valley 23 12
Solitude 32 17
Sprat Hall 26 14
St. Croix by the Sea 23 12
Sugar Hill Estate 24 12
Sunny Isle 18 9
Tamarind Reef 32 17
Tide Village 26 14
Work and Rest 23 12`,
  Christiansted: `Annaly 39 20
Anna's Hope 12 6
Bethlehem (Upper/Lower) 23 12
Buccaneer Hotel 14 8
Boetzberg 15 8
Cane Bay 36 17
Carambola 45 18
Castle Coakley/Sion Farm 18 9
Castle Nugent 23 12
Catherine's Rest 18 9
Club St. Croix 12 6
Coakley Bay 23 12
Constitution Hill 15 8
Cormorant 15 8
Cotton Grove 26 14
Cotton Valley 26 14
Cramer's Park 27 14
Divi Carina Bay 27 14
Farsham 23 12
Frederiksted 36 17
Gallows Bay 9 5
Gentle Wind 33 17
Glynn 18 9
Golden Rock Shopping Center 12 6
Grange 12 6
Grapetree Bay 27 14
Great Pond 23 12
Green Cay 18 9
Grove Place 30 15
Lime Tree Bay 18 9
Hibiscus Beach Hotel 15 8
Humbug 18 9
Kingshill 21 11
La Grande Princesse 15 8
La Reine 21 11
Longford 23 12
Lowry Hill 17 9
Mon Bijou 21 11
Morning Star 18 9
Mount Washington (East) 23 12
Pearl 18 9
Peter's Rest 17 9
Petronella 23 12
Rust-Up-Twist 36 18
Sally's Fancy 23 12
Salt River 33 17
Seven Hills 24 12
Shoy's Estate 15 8
Solitude 23 12
Southgate/Tipperary 18 9
Strawberry/Barren Spot 18 9
Sunny Isle/Island Center 18 9
Tamarind Reef 18 9
Tide Village 12 6
Upper and Lower Love 27 14
William's Delight 30 15
Welcome Estate 9 5`,
  Frederiksted: `Annaly 26 14
Butler's Bay 17 9
Carambola 41 17
Christiansted 36 17
Diamond/St. George's 15 8
Davis Bay 41 17
Divi Carina Bay 54 27
Grove Place Village 23 12
Grove Place Hills 30 14
Hannah's Rest 12 6
Lime Tree Bay 30 15
Jolly Hill 17 9
La Grange 12 6
Little La Grange 15 8
Manning's Bay 18 9
Mon Bijou 30 15
Mt. Pleasant 23 12
Mt. Washington (Frederiksted) 23 12
Seven Hills 44 18
Sion Farm 30 15
Sprat Hall 15 8
St Croix Renaissance Park 26 14
Sunny Isle 30 15
Sunset Beach 9 5
Whim Plantation/Good Hope 14 8`,
  Carambola: `Buccaneer 48 24
Chenay Bay 48 23
Coakley Bay 48 23
Divi Carina Bay 54 23
Grapetree Bay 54 23
Sprat Hall 41 18
Reef Condominiums 51 23
Frederiksted 41 17
Tamarind Reef 48 23`,
};

function slug(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseRows(text, fareCount) {
  return text.trim().split("\n").map((line) => {
    const parts = line.trim().split(/\s+/);
    const fares = parts.splice(-fareCount).map(Number);
    return { name: parts.join(" "), fares };
  });
}

function standardRule(island, origin, destination, one, group, groupMinimum = 2) {
  return {
    id: `${island}-${slug(origin)}-${slug(destination)}`,
    originNames: [origin],
    destinationNames: [destination],
    onePassengerFare: one,
    luggageFarePerPiece: 3,
    passengerFareBands: [
      { minimumPassengers: 1, maximumPassengers: groupMinimum - 1, calculation: "flat_party", amount: one },
      { minimumPassengers: groupMinimum, calculation: "per_person", amount: group },
    ],
    notes: "Research transcription of the schedule reported effective October 24, 2022. Commission-issued source sheet still required before activation.",
  };
}

function tariff(island, rules) {
  return {
    id: `${island}-taxi-tariff-2022-candidate`,
    title: `${island.toUpperCase()} researched taxi tariff transcription`,
    version: "2022-10-24-candidate-1",
    island,
    status: "draft",
    effectiveAt: "2022-10-24T00:00:00-04:00",
    sourceUrl: source[island],
    sources: [{
      url: source[island],
      label: "Published 2022 taxi rate tables",
      publisher: "VInow",
      sourceType: "verified_transcription",
      retrievedAt: "2026-07-20T00:00:00-04:00"
    }],
    issuingAuthority: "Virgin Islands Taxicab Commission",
    currency: "USD",
    verificationNotes: "Draft only. Obtain and hash the Commission-issued schedule before activation.",
    rules,
  };
}

const sttRules = [];
for (const { name, fares } of [...parseRows(sttHotels, 4), ...parseRows(sttMisc, 4)]) {
  sttRules.push(standardRule("stt", "Charlotte Amalie", name, fares[0], fares[1]));
  sttRules.push(standardRule("stt", "Cyril E. King Airport", name, fares[2], fares[3]));
}
const stjRules = Object.entries(stjSections).flatMap(([origin, rows]) =>
  parseRows(rows, 2).map(({ name, fares }) => standardRule("stj", origin, name, fares[0], fares[1])),
);
const stxRules = Object.entries(stxSections).flatMap(([origin, rows]) =>
  parseRows(rows, 2).map(({ name, fares }) => standardRule("stx", origin, name, fares[0], fares[1], 3)),
);

await mkdir("data/taxi-tariffs", { recursive: true });
for (const [island, rules] of [["stt", sttRules], ["stj", stjRules], ["stx", stxRules]]) {
  await writeFile(`data/taxi-tariffs/${island}-2022.json`, `${JSON.stringify(tariff(island, rules), null, 2)}\n`);
  console.log(`${island}: ${rules.length} researched draft rules`);
}

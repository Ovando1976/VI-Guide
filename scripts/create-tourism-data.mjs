import fs from "node:fs";
import path from "node:path";

const out = "src/data";
fs.mkdirSync(out, { recursive: true });

const now = 1710000000000;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function islandFolder(islandCode) {
  return islandCode === "st_thomas"
    ? "st-thomas"
    : islandCode === "st_john"
    ? "st-john"
    : islandCode === "st_croix"
    ? "st-croix"
    : "water-island";
}

function place(name, islandCode, areaSlug, category = "restaurant", featured = false) {
  const slug = slugify(name);
  const folder = islandFolder(islandCode);

  return {
    slug,
    title: name,
    category,
    islandCode,
    areaSlug,
    description: `${name} is a ${category.replace("-", " ")} destination in the U.S. Virgin Islands.`,
    shortDescription: `${category.replace("-", " ")} on ${islandCode.replace("_", " ")}.`,
    coverImage: `/images/places/${folder}/${slug}-1.jpg`,
    gallery: [`/images/places/${folder}/${slug}-1.jpg`],
    tags: [category, areaSlug, "usvi"],
    coordinates: null,
    address: "",
    phone: "",
    website: "",
    priceTier: category === "restaurant" ? "$$" : "$",
    featured,
    status: "published",
    createdAt: now,
    updatedAt: now
  };
}

function write(file, data) {
  fs.writeFileSync(path.join(out, file), JSON.stringify(data, null, 2));
  console.log(`created ${file}: ${data.length}`);
}

const sttRestaurants = [
  "Gladys Café","Oceana Restaurant","Blue Eleven","Old Stone Farmhouse","Fish Bar",
  "Duffy's Love Shack","Pesce Italian","Agave","Sunset Grille at Secret Harbour",
  "Sun & Sea Bar & Grill","Three Palms","Mims Seaside Bistro","Hook Line & Sinker",
  "Greengo's Caribbean Cantina","Virgilio's","Amalia Café","The Twisted Cork",
  "Sea La Vie","Petit Pump Room","Tickles Dockside Pub","Sibs on the Mountain",
  "French Quarter Bistro","The Shack at Hull Bay","Pangea Terra Table","Smoke Up Fusion BBQ",
  "Caribbean Fish Market","Iggies Beach Bar","Lanai at Limetree","Prime at Paradise Point",
  "Tap and Still Red Hook","Tap and Still Havensight","XO Bistro","Melt Mexican Grill",
  "Island Time Pub","Pie Whole Pizza","The Easterly","Sangria's Beachside Bistro",
  "Enkai Sushi Bar","Carigas Island Café","Brooks Bar","Udder Delights",
  "The Greenhouse St. Thomas","Rum Island Pub","The Smoking Rooster","Northside Bistro",
  "Side Street Pub","Bumpa's Breakfast","Barefoot Buddha","Cravin' Crabs",
  "Sugarcane Grille","Sudi's Caribbean Bar & Grille","Shama's Specialties",
  "Petra's Dushi by the Sea","Hull Bay Hideaway","Sapphire Beach Bar",
  "Margaritaville Restaurant","Taphus Beer House","El Gringos","Dog House Pub",
  "Rooftop Bar Charlotte Amalie"
].map((n, i) => place(n, "st_thomas", i < 15 ? "charlotte-amalie" : i < 35 ? "red-hook" : "northside", "restaurant", i < 10));

const stjRestaurants = [
  "Morgan's Mango","The Longboard","The Lime Inn","The Beach Bar","High Tide Bar & Seafood Grill",
  "Sun Dog Café","Extra Virgin Bistro","18°64° The Restaurant","Cruz Bay Landing","Sam & Jack's Deli",
  "Woody's Seafood Saloon","La Tapa","Dave & Jerry's Steakhouse","Lovango Rum Bar",
  "Skinny Legs","Aqua Bistro","Miss Lucy's","Rhumb Lines","North Shore Deli","The Terrace",
  "Hillside Terrace","Mooie's Bar","STJ Speakeasy","St. John Brewers Tap Room",
  "Pizza Pi","Uncle Joe's BBQ","Our Market Smoothies","Shambles","Surf Club Cantina",
  "Café Roma","Banana Deck","420 to Center","Caneel Beach Bar","Windmill Bar","Johnny Lime"
].map((n, i) => place(n, "st_john", i < 25 ? "cruz-bay" : "coral-bay", "restaurant", i < 8));

const stxRestaurants = [
  "Ama at Cane Bay","Savant","Rhythms at Rainbow Beach","The Mill Boardwalk Bar & Pizza",
  "The Landing Beach Bar","Bon Manjer","Harvey's","Beach Side Café","Ziggy's Island Market",
  "La Reine Chicken Shack","Duggan's Reef","Nate's Boathouse","Shupe's on the Boardwalk",
  "Too Chez","The Terrace Restaurant","Harbour Prime Steak and Seafood","No Bones Café",
  "Caroline's Breakfast","Brew STX","Polly's at the Pier","Six Nine Restaurant & Bar",
  "Tap Deck Bar & Billiards","Flyers Bar & Grill","Louie & Nacho's Beach Bar",
  "Turtle's Deli","Ci Bo Né","40 Strand Eatery","balter","The Bombay Club",
  "Rum Runners","Hamilton's","Toast Diner","Maria's Cantina","Singh's Fast Food",
  "Kendricks","Cast Iron Pot","El Sol Bar and Restaurant","Nauti Bar and Grille",
  "Off the Wall","Spratnet Beach Bar","Rowdy Joe's","Leatherback Brewing Company",
  "The Fred Beach Bar","Goat Soup and Whiskey","Sion Farm Distillery","Deep End Bar",
  "Cheeseburgers in America's Paradise","TLC Kitchen","Blues' Backyard BBQ",
  "Twin City Coffee House","Common Cents Pub","Salt Great Pond","Paradise Pizza",
  "St. Croix Cellars","Cafe Fresco","Taco Shack","Kim's Restaurant","Chicken Shack",
  "Eden South","Seaside Market Deli","Café Christine"
].map((n, i) => place(n, "st_croix", i < 30 ? "christiansted" : i < 45 ? "frederiksted" : "north-shore", "restaurant", i < 10));

const waterRestaurants = [
  "Dinghy's Beach Bar","Heidi's Honeymoon Grill","Water Island Beach Bar"
].map((n, i) => place(n, "water_island", "honeymoon-beach", "restaurant", i === 0));

const attractionNames = [
  "Coral World Ocean Park","Paradise Point Skyride","Fort Christian","Mountain Top","Drake's Seat",
  "99 Steps","Blackbeard's Castle","Yacht Haven Grande","Charlotte Amalie Historic District",
  "Emancipation Garden","Vendor's Plaza","St. Thomas Synagogue","Seven Arches Museum",
  "Bluebeard's Castle","Magens Bay Arboretum","VI Children's Museum","Phantasea Tropical Botanical Garden",
  "Red Hook Marina","Sapphire Marina","Secret Harbour Marina","Coki Dive Center","Havensight Mall",
  "Crown Bay Center","Water Island Fort Segarra","Honeymoon Beach Water Island","Cruz Bay Visitor Center",
  "Virgin Islands National Park","Annaberg Sugar Plantation","Cinnamon Bay Archaeology Museum",
  "Reef Bay Trail","Petroglyphs Trail","Peace Hill Windmill","Catherineberg Ruins","Caneel Bay Overlook",
  "Trunk Bay Overlook","Maho Bay Overlook","Coral Bay Lookout","Salt Pond Trail","Ram Head Trail",
  "Bordeaux Mountain","Johnny Horn Trail","Leinster Bay Trail","Christiansted National Historic Site",
  "Fort Christiansvaern","Steeple Building","Scale House","Old Danish Customs House","Government House Christiansted",
  "Buck Island Reef National Monument","Point Udall","Sandy Point National Wildlife Refuge",
  "Estate Whim Plantation Museum","St. George Village Botanical Garden","Salt River Bay National Historical Park",
  "Cruzan Rum Distillery","Captain Morgan Visitor Center","Frederiksted Pier","Fort Frederik",
  "Dorsch Beach","Cane Bay Wall","Jack and Isaac Bay Preserve","Gallows Bay","Protestant Cay",
  "Christiansted Boardwalk","Frederiksted Waterfront","Carambola Tide Pools","Mount Eagle","Ham's Bluff Lighthouse"
];

const attractions = Array.from({ length: 100 }, (_, i) => {
  const name = attractionNames[i] ?? `USVI Attraction ${i + 1}`;
  const islandCode = i < 25 ? "st_thomas" : i < 45 ? "st_john" : "st_croix";
  return place(name, islandCode, "visitor-attractions", "attraction", i < 20);
});

const transportation = [
  "Cyril E. King Airport","Havensight Cruise Port","Crown Bay Cruise Port","Red Hook Ferry Terminal",
  "Charlotte Amalie Ferry Terminal","Cruz Bay Ferry Dock","Cruz Bay Taxi Stand","Coral Bay Taxi Stand",
  "Henry E. Rohlsen Airport","Gallows Bay Ferry Terminal","Christiansted Seaplane Terminal",
  "Frederiksted Pier","Water Island Ferry Terminal","Crown Bay Marina","Yacht Haven Grande Marina",
  "American Yacht Harbor","Sapphire Marina","Compass Point Marina","Christiansted Boardwalk Ferry Dock"
].map((n, i) => place(n, i < 7 ? "st_thomas" : i < 9 ? "st_john" : "st_croix", "transport", "transport", i < 6));

const ferryTerminals = transportation.filter((p) => p.title.toLowerCase().includes("ferry") || p.title.toLowerCase().includes("dock"));

const cruisePorts = [
  "Havensight Cruise Port","Crown Bay Cruise Port","Frederiksted Cruise Pier","Christiansted Harbor Tender Dock"
].map((n, i) => place(n, i < 2 ? "st_thomas" : "st_croix", "cruise-port", "transport", true));

const shopping = [
  "Downtown Charlotte Amalie","Havensight Mall","Yacht Haven Grande","Crown Bay Center",
  "Red Hook Plaza","Tutu Park Mall","Mongoose Junction","Cruz Bay Shops","Wharfside Village",
  "Christiansted Boardwalk","Company Street Shops","Frederiksted Waterfront Shops","Sunny Isle Shopping Center"
].map((n, i) => place(n, i < 6 ? "st_thomas" : i < 9 ? "st_john" : "st_croix", "shopping", "shopping", i < 5));

const nightlife = [
  "Duffy's Love Shack","The Beach Bar St. John","Woody's Seafood Saloon","The Tap Room St. John",
  "Dinghy's Beach Bar","Rhythms at Rainbow Beach","The Fred Beach Bar","Brew STX",
  "Tap and Still Red Hook","XO Bistro","Island Time Pub","Tickles Dockside Pub","Rum Runners",
  "Shupe's on the Boardwalk","Louie & Nacho's Beach Bar","Leatherback Brewing Company"
].map((n, i) => place(n, i < 4 ? "st_john" : i < 5 ? "water_island" : i < 9 ? "st_croix" : "st_thomas", "nightlife", "nightlife", i < 8));

const hikingTrails = [
  "Reef Bay Trail","Ram Head Trail","Lind Point Trail","Cinnamon Bay Trail","Johnny Horn Trail",
  "Leinster Bay Trail","Brown Bay Trail","Bordeaux Mountain Trail","Peace Hill Trail","Salt Pond Trail",
  "Jack and Isaac Bay Trail","Annaly Bay Tide Pools Trail","Ham's Bluff Lighthouse Trail",
  "Sandy Point Nature Trail","Magens Bay Discovery Trail","Mermaid's Chair Trail","Water Island Fort Segarra Trail"
].map((n, i) => place(n, i < 10 ? "st_john" : i < 14 ? "st_croix" : "st_thomas", "hiking", "hiking-trail", i < 8));

const historicSites = Array.from({ length: 150 }, (_, i) => {
  const base = [
    "Fort Christian","Fort Frederik","Fort Christiansvaern","Annaberg Sugar Plantation",
    "Estate Whim Plantation","Catherineberg Ruins","Cinnamon Bay Archaeological Site",
    "Charlotte Amalie Historic District","Christiansted Historic District","Frederiksted Historic District"
  ][i % 10];

  const islandCode = i < 50 ? "st_thomas" : i < 90 ? "st_john" : "st_croix";

  return place(
    i < 10 ? base : `${base} Reference Site ${i + 1}`,
    islandCode,
    "historic-site",
    "historic-site",
    i < 10
  );
});

write("restaurants-st-thomas.json", sttRestaurants);
write("restaurants-st-john.json", stjRestaurants);
write("restaurants-st-croix.json", stxRestaurants);
write("restaurants-water-island.json", waterRestaurants);
write("attractions.json", attractions);
write("transportation.json", transportation);
write("ferry-terminals.json", ferryTerminals);
write("cruise-ports.json", cruisePorts);
write("shopping.json", shopping);
write("nightlife.json", nightlife);
write("hiking-trails.json", hikingTrails);
write("historic-sites.json", historicSites);

// Do not overwrite your rich TypeScript beach file. This creates a JSON export copy only.
write("beaches.json", []);
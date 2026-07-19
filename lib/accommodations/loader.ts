import type { AccommodationRecord, CatalogSeed } from "./types";
import {
  accommodationIslandName,
  resolveAccommodationHeroImage,
  slugifyAccommodation,
} from "./utils";

const USVI_HTA =
  "https://virgin-islands-hotels.com/accommodations/";

const STX_HTA =
  "https://stcroixhotelandtourism.com/member-directory/";

const VERIFIED_AT = "2026-07-16";

const seeds: CatalogSeed[] = [
    // U.S. Virgin Islands Hotel & Tourism Association — St. Thomas
    {
      name: "Bolongo Bay Beach Resort",
      island: "stt",
      category: "resort",
      location: "Bolongo Bay",
      website: "https://bolongobay.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Buoy Haus St. Thomas Beach Resort, Autograph Collection",
      island: "stt",
      category: "resort",
      location: "Frenchman's Reef",
      website:
        "https://www.marriott.com/en-us/hotels/sttbu-buoy-haus-beach-resort-st-thomas-autograph-collection/overview/",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Emerald Beach Resort",
      island: "stt",
      category: "resort",
      location: "Lindbergh Bay",
      website: "https://www.emeraldbeach.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Lindbergh Bay Hotel & Villas",
      island: "stt",
      category: "hotel",
      location: "Lindbergh Bay",
      website: "https://www.lindberghbayhotel.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Point Pleasant Resort",
      island: "stt",
      category: "resort",
      location: "East End",
      website: "https://pointpleasantresort.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Secret Harbour Beach Resort",
      island: "stt",
      category: "resort",
      location: "Nazareth",
      website: "https://www.secretharbourvi.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "The Green Iguana Hotel",
      island: "stt",
      category: "hotel",
      location: "Charlotte Amalie",
      website: "https://www.thegreeniguana.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "The Hideaway at Hull Bay",
      island: "stt",
      category: "resort",
      location: "Hull Bay",
      website: "https://thehideawayhullbay.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "The Westin Beach Resort & Spa at Frenchman's Reef",
      island: "stt",
      category: "resort",
      location: "Frenchman's Reef",
      website:
        "https://www.marriott.com/en-us/hotels/sttwi-the-westin-beach-resort-and-spa-at-frenchmans-reef/overview/",
      sourceUrl: USVI_HTA,
    },
    {
      name: "At Home in the Tropics",
      island: "stt",
      category: "guesthouse",
      location: "Charlotte Amalie Historic District",
      website: "https://athomeinthetropics.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Magens Hideaway",
      island: "stt",
      category: "villa",
      location: "Magens Bay",
      website: "https://magenshideaway.com",
      sourceUrl: USVI_HTA,
    },
  
    // Additional operating St. Thomas properties — verified against official property/brand sites
    {
      name: "Hampton by Hilton St. Thomas",
      island: "stt",
      category: "hotel",
      location: "Havensight",
      address: "Havensight Mall Parcel 2, Charlotte Amalie, VI 00802",
      phone: "340-693-4665",
      website: "https://www.hilton.com/en/hotels/sttunhx-hampton-st-thomas/",
      sourceUrl: "https://www.hilton.com/en/hotels/sttunhx-hampton-st-thomas/",
      description:
        "A newly built waterfront-area hotel across from Havensight Mall, with complimentary breakfast, Wi-Fi, parking, an outdoor pool, and convenient access to the cruise port and Charlotte Amalie.",
      tags: ["breakfast included", "pool", "cruise port", "new hotel"],
    },
    {
      name: "The Ritz-Carlton, St. Thomas",
      island: "stt",
      category: "resort",
      location: "Great Bay",
      address: "6900 Great Bay, St. Thomas, VI 00802",
      phone: "340-775-3333",
      website:
        "https://www.ritzcarlton.com/en/hotels/sttrz-the-ritz-carlton-st-thomas/overview/",
      sourceUrl:
        "https://www.ritzcarlton.com/en/hotels/sttrz-the-ritz-carlton-st-thomas/overview/",
      description:
        "A luxury oceanfront resort on Great Bay with beach access, pools, dining, spa experiences, and easy access to the East End and neighboring islands.",
      tags: ["luxury", "beachfront", "spa", "east end"],
    },
    {
      name: "Marriott's Frenchman's Cove",
      island: "stt",
      category: "resort",
      location: "Estate Bakkeroe",
      address: "7338 Estate Bakkeroe, St. Thomas, VI 00802",
      phone: "340-693-4800",
      website:
        "https://www.marriott.com/en-us/hotels/sttuv-marriotts-frenchmans-cove/overview/",
      sourceUrl:
        "https://www.marriott.com/en-us/hotels/sttuv-marriotts-frenchmans-cove/overview/",
      description:
        "A family-friendly vacation ownership resort overlooking Pacquereau Bay, offering spacious villas, a secluded beach, a pool, dining, and resort amenities.",
      tags: ["family friendly", "beachfront", "villas", "pool"],
    },
    {
      name: "Margaritaville Vacation Club - St. Thomas",
      island: "stt",
      category: "resort",
      location: "Water Bay",
      address: "6080 Estate Smith Bay, St. Thomas, VI 00802",
      website: "https://www.stthomasmargaritaville.com/",
      sourceUrl: "https://www.stthomasmargaritaville.com/",
      description:
        "A relaxed tropical vacation club resort on Water Bay with beach access, pools, dining, and convenient access to Coki Point and the East End.",
      tags: ["beachfront", "vacation club", "pool", "east end"],
    },
    {
      name: "Bluebeard's Castle Resort",
      island: "stt",
      category: "resort",
      location: "Charlotte Amalie",
      website: "https://www.bluebeards-castle.com/",
      sourceUrl: "https://www.bluebeards-castle.com/",
      description:
        "A historic hilltop resort above Charlotte Amalie with harbor views, a pool, dining, and a central location for town and island excursions.",
      tags: ["historic", "harbor view", "pool", "central"],
    },
    {
      name: "Limetree Beach Resort by Club Wyndham",
      island: "stt",
      category: "resort",
      location: "Limetree Beach",
      address: "100 Frenchman's Bay, St. Thomas, VI 00802",
      website:
        "https://clubwyndham.wyndhamdestinations.com/us/en/resorts/featured-destinations/limetree-beach-resort",
      sourceUrl:
        "https://clubwyndham.wyndhamdestinations.com/us/en/resorts/featured-destinations/limetree-beach-resort",
      description:
        "A beachfront vacation club resort on the south shore with studio suites, an outdoor pool, dining, and direct access to Limetree Beach.",
      tags: ["beachfront", "vacation club", "pool", "south shore"],
    },
    {
      name: "Elysian Beach Resort",
      island: "stt",
      category: "resort",
      location: "Cowpet Bay",
      address: "6800 Estate Nazareth, St. Thomas, VI 00802",
      website: "https://www.elysianbeachresort.com/",
      sourceUrl: "https://www.elysianbeachresort.com/",
      description:
        "A condominium-style beach resort on Cowpet Bay with an outdoor pool, tennis, dining, and convenient access to Red Hook.",
      tags: ["beachfront", "condo resort", "pool", "red hook"],
    },
    {
      name: "Sapphire Beach Resort and Marina",
      island: "stt",
      category: "resort",
      location: "Sapphire Beach",
      address: "6720 Estate Smith Bay, St. Thomas, VI 00802",
      website: "https://www.sapphirebeachresort.com/",
      sourceUrl: "https://www.sapphirebeachresort.com/",
      description:
        "A beachfront condominium resort and marina overlooking St. John, with snorkeling, water activities, dining, and quick access to Red Hook.",
      tags: ["beachfront", "marina", "snorkeling", "red hook"],
    },
    {
      name: "Sapphire Village Resort",
      island: "stt",
      category: "resort",
      location: "Sapphire Bay",
      website: "https://www.sapphirevillageresort.com/",
      sourceUrl: "https://www.sapphirevillageresort.com/",
      description:
        "A hillside condominium resort above Sapphire Bay offering island views, pools, and easy access to Sapphire Beach and Red Hook.",
      tags: ["condo resort", "ocean view", "pool", "red hook"],
    },
    {
      name: "Flamboyan on the Bay Resort & Villas",
      island: "stt",
      category: "resort",
      location: "Magens Bay",
      address: "6200 Magens Bay Road, St. Thomas, VI 00802",
      website: "https://www.flotb.com/",
      sourceUrl: "https://www.flotb.com/",
      description:
        "A hillside resort near Magens Bay with hotel rooms and villas, two pools, tennis, dining, and tropical garden surroundings.",
      tags: ["near beach", "villas", "pool", "magens bay"],
    },
    {
      name: "Windward Passage Hotel",
      island: "stt",
      category: "hotel",
      location: "Charlotte Amalie Waterfront",
      address: "Veterans Drive, Charlotte Amalie, St. Thomas, VI 00804",
      phone: "340-774-5200",
      website: "https://www.windwardpassage.com/",
      sourceUrl: "https://www.windwardpassage.com/",
      description:
        "A full-service waterfront hotel in Charlotte Amalie, positioned near the ferry terminal, shopping, restaurants, and the downtown harbor.",
      tags: ["waterfront", "downtown", "ferry access", "pool"],
    },
    {
      name: "The Mafolie Hotel",
      island: "stt",
      category: "hotel",
      location: "Estate Mafolie",
      address: "7091 Estate Mafolie, St. Thomas, VI 00802",
      phone: "340-774-2790",
      website: "https://www.mafolie.com/",
      sourceUrl: "https://www.mafolie.com/",
      description:
        "A landmark hilltop hotel known for panoramic Charlotte Amalie harbor views, an infinity-style pool, and an on-site restaurant.",
      tags: ["harbor view", "boutique", "pool", "hilltop"],
    },
    {
      name: "The Pink Palm Hotel",
      island: "stt",
      category: "hotel",
      location: "Charlotte Amalie Historic District",
      address: "2114 Crystal Gade, St. Thomas, VI 00802",
      phone: "340-715-7760",
      website: "https://www.pinkpalmhotel.com/",
      sourceUrl: "https://www.pinkpalmhotel.com/",
      description:
        "An adults-oriented boutique hotel in the Charlotte Amalie historic district with stylish rooms, harbor views, a pool, and a cocktail bar.",
      tags: ["boutique", "adults", "historic district", "pool"],
    },
    {
      name: "Hotel 1829",
      island: "stt",
      category: "hotel",
      location: "Charlotte Amalie Historic District",
      address: "Blackbeard's Hill, Charlotte Amalie, St. Thomas, VI 00802",
      phone: "833-843-1829",
      website: "https://www.hotel1829.com/",
      sourceUrl: "https://www.hotel1829.com/",
      description:
        "A restored historic boutique hotel above Charlotte Amalie featuring distinctive architecture, harbor views, and walkable access to downtown landmarks.",
      tags: ["boutique", "historic", "harbor view", "downtown"],
    },
    {
      name: "Bunker Hill Hotel",
      island: "stt",
      category: "hotel",
      location: "Charlotte Amalie Historic District",
      address: "2307 Commandant Gade, Charlotte Amalie, St. Thomas, VI 00802",
      phone: "340-774-8056",
      website: "https://www.bunkerhillhotel.com/",
      sourceUrl: "https://www.bunkerhillhotel.com/",
      description:
        "A locally rooted hotel in the Charlotte Amalie historic district with a pool and convenient access to downtown shops, dining, and landmarks.",
      tags: ["downtown", "historic district", "pool", "local hotel"],
    },
    {
      name: "Galleon House Hotel",
      island: "stt",
      category: "guesthouse",
      location: "Charlotte Amalie Historic District",
      address: "31 Kongens Gade, Charlotte Amalie, St. Thomas, VI 00804",
      phone: "340-774-6952",
      website: "https://www.galleonhouse.com/",
      sourceUrl: "https://www.galleonhouse.com/",
      description:
        "A small historic guesthouse in central Charlotte Amalie with hillside harbor views and walkable access to downtown attractions.",
      tags: ["guesthouse", "downtown", "historic district", "harbor view"],
    },
    {
      name: "The Island View Guesthouse",
      island: "stt",
      category: "guesthouse",
      location: "Estate Contant",
      website: "https://www.islandviewstthomas.com/",
      sourceUrl: "https://www.islandviewstthomas.com/",
      description:
        "An intimate hillside guesthouse offering sweeping island and harbor views, a pool, and a personalized small-property experience.",
      tags: ["guesthouse", "harbor view", "pool", "boutique"],
    },
    {
      name: "Sunset Gardens Guesthouse",
      island: "stt",
      category: "guesthouse",
      location: "Estate Contant",
      website: "https://www.sunsetgardensvi.com/",
      sourceUrl: "https://www.sunsetgardensvi.com/",
      description:
        "A hillside guesthouse with apartment-style accommodations and sunset views, located within convenient reach of the airport and Charlotte Amalie.",
      tags: ["guesthouse", "apartment style", "sunset view", "airport access"],
    },
    {
      name: "Boundless Bliss Hotel",
      island: "stt",
      category: "hotel",
      location: "Estate Mafolie",
      website: "https://www.boundlessblisshotel.com/",
      sourceUrl: "https://www.boundlessblisshotel.com/",
      description:
        "A small hillside hotel with spacious accommodations, terraces, garden spaces, and views across St. Thomas.",
      tags: ["boutique", "hilltop", "terrace", "small hotel"],
    },
    {
      name: "Pavilions and Pools Resort",
      island: "stt",
      category: "villa",
      location: "Estate Smith Bay",
      address: "6400 Estate Smith Bay, St. Thomas, VI 00802",
      website: "https://pavilionsandpools.com/",
      sourceUrl: "https://pavilionsandpools.com/",
      description:
        "A collection of private villa-style accommodations near Coki and Sapphire beaches, known for secluded patios and private pools.",
      tags: ["private pool", "villa", "east end", "near beach"],
    },
    {
      name: "Tillett Gardens Guest House",
      island: "stt",
      category: "guesthouse",
      location: "Tillett Gardens",
      website: "https://tillettgardens.com/",
      sourceUrl: "https://tillettgardens.com/",
      description:
        "A value-focused guesthouse within the Tillett Gardens arts community, close to local dining, shopping, and central island transportation.",
      tags: ["guesthouse", "arts district", "central", "local"],
    },
  
    // U.S. Virgin Islands Hotel & Tourism Association — St. John
    {
      name: "Lovango Resort + Beach Club",
      island: "stj",
      category: "resort",
      location: "Lovango Cay",
      website: "https://www.lovangovi.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Gallows Point Resort",
      island: "stj",
      category: "resort",
      location: "Cruz Bay",
      website: "https://gallowspointresort.com",
      sourceUrl: USVI_HTA,
    },
    {
      name: "Coconut Coast Villas",
      island: "stj",
      category: "villa",
      location: "Cruz Bay",
      website: "https://www.coconutcoast.com",
      sourceUrl: USVI_HTA,
    },
  
    // St. Croix Hotel & Tourism Association accommodation members
    {
      name: "Arawak Bay: The Inn at Salt River",
      island: "stx",
      category: "guesthouse",
      location: "Salt River",
      address: "PO Box 3475, Kingshill, VI 00851",
      phone: "340-772-1684",
      website: "https://www.arawakbaysaltriver.co.vi",
      sourceUrl: STX_HTA,
    },
    {
      name: "The Buccaneer Hotel",
      island: "stx",
      category: "resort",
      location: "Estate Shoys",
      address: "5007 Estate Shoys, Christiansted, VI 00820",
      phone: "340-712-2100",
      website: "https://www.thebuccaneer.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Caravelle Hotel & Casino",
      island: "stx",
      category: "hotel",
      location: "Christiansted",
      address: "44A Queen Cross Street, Christiansted, VI 00820",
      phone: "340-773-0687",
      website: "https://www.hotelcaravelle.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Caribbean Breeze",
      island: "stx",
      category: "apartment",
      location: "Gentle Winds",
      address: "Gentle Winds, St. Croix, VI 00820",
      phone: "303-888-7288",
      website: "https://www.caribbeanbreezecondo.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Company House Hotel",
      island: "stx",
      category: "hotel",
      location: "Christiansted",
      address: "2102 Company Street, Christiansted, VI 00820",
      phone: "340-773-1377",
      website: "https://www.hotelcompanyhouse.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Divi Carina Bay Beach Resort & Casino",
      island: "stx",
      category: "resort",
      location: "East End",
      address: "5025 Turner Hole Road, Christiansted, VI 00820",
      phone: "340-773-9700",
      website:
        "https://www.diviresorts.com/divi-carina-bay-beach-resort-casino-st-croix.htm",
      sourceUrl: STX_HTA,
    },
    {
      name: "Club Comanche Hotel St. Croix",
      island: "stx",
      category: "hotel",
      location: "Christiansted",
      address: "1 Strand Street, Christiansted, VI 00820",
      phone: "340-773-0210",
      website: "https://www.clubcomanche.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Cottages by the Sea",
      island: "stx",
      category: "guesthouse",
      location: "Frederiksted",
      address: "127A Smithfield Road, Frederiksted, VI 00840",
      phone: "340-772-0495",
      website: "https://www.caribbeancottages.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "The Fred",
      island: "stx",
      category: "hotel",
      location: "Frederiksted",
      address: "41 Strand Street, Frederiksted, VI 00840",
      phone: "340-777-3733",
      website: "https://www.sleepwithfred.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Hotel on the Cay",
      island: "stx",
      category: "hotel",
      location: "Christiansted Harbor",
      address: "Protestant Cay, Christiansted, VI 00820",
      phone: "340-773-2035",
      website: "https://www.hotelonthecay.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Inn on Strand Street",
      island: "stx",
      category: "guesthouse",
      location: "Frederiksted",
      address: "442 Strand Street, Frederiksted, VI 00840",
      phone: "340-772-0500",
      website: "https://www.innonstrandstreet.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "King Christian Hotel",
      island: "stx",
      category: "hotel",
      location: "Christiansted",
      address: "Christiansted, VI 00820",
      phone: "340-773-0103",
      website: "https://www.kingchristianhotel.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Sugar Apple Bed & Breakfast",
      island: "stx",
      category: "guesthouse",
      location: "Christiansted",
      address: "27 Prince Street, Christiansted, VI 00820",
      phone: "754-300-6983",
      website: "https://www.sugarapplebedandbreakfast.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Sand Castle on the Beach",
      island: "stx",
      category: "resort",
      location: "Frederiksted",
      address: "127 Smithfield, Frederiksted, VI 00840",
      phone: "340-772-1205",
      website: "https://www.sandcastleonthebeach.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Tamarind Reef Resort, Spa & Marina",
      island: "stx",
      category: "resort",
      location: "Christiansted",
      address: "5001 Tamarind Reef, Christiansted, VI 00820",
      phone: "340-773-4455",
      website: "https://www.tamarindreefresort.com",
      sourceUrl: STX_HTA,
    },
    {
      name: "Villa Dawn",
      island: "stx",
      category: "villa",
      location: "Christiansted",
      address: "111 Estate, Christiansted, VI 00820",
      phone: "303-888-7288",
      website: "https://www.villadawn.com",
      sourceUrl: STX_HTA,
    },
  ];

export const ACCOMMODATIONS: AccommodationRecord[] = seeds.map((seed) => {
    const slug = slugifyAccommodation(seed.name);
    const location = seed.location ? ` in ${seed.location}` : "";
  
    const description =
      seed.description ??
      `${seed.name} is an association-listed ${
        seed.category
      }${location} on ${accommodationIslandName(seed.island)}.`;
  
    return {
      ...seed,
      id: slug,
      slug,
      description,
      heroImage: resolveAccommodationHeroImage(seed, slug),
      tags: Array.from(
        new Set(
          [
            seed.category,
            seed.location,
            "association listed",
            ...(seed.tags ?? []),
          ].filter(Boolean) as string[]
        )
      ),
      sourceLabel:
        seed.sourceLabel ??
        (seed.sourceUrl === STX_HTA
          ? "St. Croix Hotel & Tourism Association"
          : seed.sourceUrl === USVI_HTA
            ? "USVI Hotel & Tourism Association"
            : "Official property or hotel brand website"),
      verificationStatus:
        seed.sourceUrl === STX_HTA || seed.sourceUrl === USVI_HTA
          ? "association-listed"
          : "official-site-verified",
      verifiedAt: VERIFIED_AT,
    };
  });
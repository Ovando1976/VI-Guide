export type CustomerBookingCategory =
  | "hotel"
  | "resort"
  | "villa"
  | "airbnb_operator"
  | "boat_charter"
  | "tour_operator"
  | "excursion_company";

export type CustomerBookingRecord = {
  id: string;
  businessName: string;
  category: CustomerBookingCategory;
  island: "St. Thomas" | "St. John" | "St. Croix" | "Water Island";
  area: string;
  headline: string;
  description: string;
  bestFor: string[];
  bookingOffer: string;
  mobilityNote: string;
  image: string;
  imageAlt?: string;
  imageSourceName?: string;
  imageSourceUrl?: string;
  imageStatus?: "verified" | "partner_supplied" | "official_public_candidate" | "needs_image" | "needs_review";
  website?: string;
  phone?: string;
  sourceName?: string;
  sourceUrl?: string;
  lastVerified?: string;
  inventoryScope?: "single_property" | "management_company" | "inquiry_lane";
  verificationStatus: "partner_confirmed" | "partner_unconfirmed" | "needs_review";
};

export const customerBookingCatalog: CustomerBookingRecord[] = [
  {
    id: "stt-ritz-carlton",
    businessName: "The Ritz-Carlton, St. Thomas",
    category: "resort",
    island: "St. Thomas",
    area: "Great Bay / East End",
    headline: "Luxury east-end resort stay with beach, marina, and concierge access.",
    description:
      "A premium St. Thomas resort option for travelers looking for an upscale stay near Red Hook, Sapphire, Cowpet Bay, and east-end boat access.",
    bestFor: ["Luxury stays", "Couples", "Families", "East End access"],
    bookingOffer: "Request resort stay details, airport pickup help, and nearby island planning.",
    mobilityNote: "Good fit for airport pickup, Red Hook ferry planning, and east-end beach transfers.",
    image: "/images/places/st-thomas/sapphire-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-frenchmans-reef",
    businessName: "Frenchman's Reef",
    category: "resort",
    island: "St. Thomas",
    area: "Southside / Morningstar",
    headline: "Harbor-view resort base close to Charlotte Amalie and Morningstar Beach.",
    description:
      "A strong St. Thomas resort option for visitors who want beach access, harbor views, restaurants, and convenient access to town.",
    bestFor: ["Resort stay", "Harbor views", "Couples", "Town access"],
    bookingOffer: "Request resort stay options, ride pickup, and activity planning.",
    mobilityNote: "Good fit for airport transfers, town dining, beach runs, and cruise-area pickups.",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-secret-harbour",
    businessName: "Secret Harbour Beach Resort",
    category: "hotel",
    island: "St. Thomas",
    area: "Secret Harbour / East End",
    headline: "Beachfront stay near calm water, snorkeling, dining, and Red Hook.",
    description:
      "A strong east-end lodging option for visitors who want beach access with nearby restaurants, ferry access, and water activities.",
    bestFor: ["Beach stay", "Snorkeling", "Families", "Red Hook access"],
    bookingOffer: "Request room availability guidance, beach-day planning, and transportation help.",
    mobilityNote: "Good fit for airport transfer, Red Hook ferry connection, and beach/taxi coordination.",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-bolongo-bay",
    businessName: "Bolongo Bay Beach Resort",
    category: "resort",
    island: "St. Thomas",
    area: "Bolongo / Southside",
    headline: "Beach resort option on the south side of St. Thomas.",
    description:
      "A southside resort-style stay for visitors looking for beach access, island activities, and a relaxed base between town and the east end.",
    bestFor: ["Beach resort", "Couples", "Families", "Southside access"],
    bookingOffer: "Request stay guidance, beach planning, and ride coordination.",
    mobilityNote: "Good fit for airport transfer, town access, and east-end activity transfers.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stj-westin",
    businessName: "The Westin St. John Resort Villas",
    category: "resort",
    island: "St. John",
    area: "Cruz Bay",
    headline: "Villa-style resort base near Cruz Bay and St. John beaches.",
    description:
      "A strong St. John stay option for guests who want villa-style accommodations, Cruz Bay access, and easy planning for beaches and ferries.",
    bestFor: ["St. John stays", "Villa-style lodging", "Families", "Beach planning"],
    bookingOffer: "Request villa-style stay guidance, ferry planning, and beach itinerary help.",
    mobilityNote: "Good fit for ferry arrival planning, Cruz Bay transfers, and beach route guidance.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stj-gallows-point",
    businessName: "Gallows Point Resort",
    category: "hotel",
    island: "St. John",
    area: "Cruz Bay",
    headline: "Cruz Bay stay with walkable town access and island planning convenience.",
    description:
      "A St. John lodging option for visitors who want to stay near Cruz Bay restaurants, ferry arrival, and national park beach routes.",
    bestFor: ["Cruz Bay", "Walkability", "Couples", "Beach access"],
    bookingOffer: "Request St. John stay guidance, ferry timing, and beach route planning.",
    mobilityNote: "Good fit for Cruz Bay arrival and beach-day transportation planning.",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "lovango-resort",
    businessName: "Lovango Resort + Beach Club",
    category: "resort",
    island: "St. John",
    area: "Lovango Cay",
    headline: "Private-island style stay and beach club experience between St. Thomas and St. John.",
    description:
      "A premium island experience for visitors looking for a resort/beach-club style stay with boat access and day-experience appeal.",
    bestFor: ["Luxury", "Beach club", "Boat access", "Couples"],
    bookingOffer: "Request stay or beach-club style experience guidance and boat transfer planning.",
    mobilityNote: "Good fit for Red Hook connection, Cruz Bay connection, and boat-transfer coordination.",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stx-buccaneer",
    businessName: "The Buccaneer Beach & Golf Resort",
    category: "resort",
    island: "St. Croix",
    area: "Christiansted area",
    headline: "Classic St. Croix resort option with beach, golf, and Christiansted access.",
    description:
      "A St. Croix resort option for travelers looking for a full-service stay near beaches, golf, dining, and Christiansted experiences.",
    bestFor: ["St. Croix", "Resort stay", "Golf", "Beach access"],
    bookingOffer: "Request St. Croix resort guidance, airport transfer help, and activity planning.",
    mobilityNote: "Good fit for airport transfer, Christiansted dining, and island tour routing.",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stx-king-christian",
    businessName: "King Christian Hotel",
    category: "hotel",
    island: "St. Croix",
    area: "Christiansted",
    headline: "Historic Christiansted hotel base near waterfront, dining, and town exploration.",
    description:
      "A town-based St. Croix lodging option for visitors who want walkable Christiansted access, history, dining, and harbor activity.",
    bestFor: ["Historic town", "Walkability", "Dining", "Harbor access"],
    bookingOffer: "Request Christiansted stay guidance and town-based itinerary planning.",
    mobilityNote: "Good fit for airport transfer, Christiansted walking plans, and island tour pickup.",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-east-end-villa",
    businessName: "East End Villa Inquiry",
    category: "villa",
    island: "St. Thomas",
    area: "Red Hook / Nazareth / Sapphire",
    headline: "Private villa inquiry near beaches, ferry access, and east-end dining.",
    description:
      "A customer inquiry lane for villa managers and vacation rental operators in the St. Thomas east end.",
    bestFor: ["Groups", "Families", "Private stay", "Red Hook access"],
    bookingOffer: "Request a villa match by dates, group size, area, and transportation needs.",
    mobilityNote: "Good fit for airport pickup, grocery stop, beach runs, and ferry planning.",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stj-coral-bay-villa",
    businessName: "Coral Bay Villa Inquiry",
    category: "villa",
    island: "St. John",
    area: "Coral Bay",
    headline: "Quiet St. John villa inquiry for travelers who want nature, views, and beaches.",
    description:
      "A St. John villa inquiry lane for travelers looking beyond Cruz Bay with beach and national park planning needs.",
    bestFor: ["Quiet stays", "Views", "Nature", "Groups"],
    bookingOffer: "Request villa options with ferry, Jeep, and beach route planning.",
    mobilityNote: "Good fit for ferry timing, Jeep pickup planning, and beach route guidance.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stx-vacation-rental",
    businessName: "St. Croix Vacation Rental Inquiry",
    category: "airbnb_operator",
    island: "St. Croix",
    area: "Christiansted / Frederiksted / North Shore",
    headline: "Vacation rental inquiry for St. Croix stays by area and travel style.",
    description:
      "A direct inquiry lane for St. Croix vacation rental managers, villas, condos, and Airbnb-style operators.",
    bestFor: ["Vacation rentals", "Longer stays", "Families", "Remote work"],
    bookingOffer: "Request rental options by island area, dates, group size, and budget.",
    mobilityNote: "Good fit for airport transfer, rental-car planning, and island itinerary routing.",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-private-boat-day",
    businessName: "Private Boat Day Inquiry",
    category: "boat_charter",
    island: "St. Thomas",
    area: "Red Hook / American Yacht Harbor",
    headline: "Private boat charter inquiry for snorkel trips, island hopping, or sunset cruising.",
    description:
      "A direct charter inquiry lane for visitors planning boat days from St. Thomas or St. John.",
    bestFor: ["Private charters", "Snorkeling", "Groups", "BVI-style day planning"],
    bookingOffer: "Request a charter match by date, party size, pickup area, and trip style.",
    mobilityNote: "Good fit for hotel pickup, marina dropoff, ferry timing, and return transfer.",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stj-boat-charter",
    businessName: "St. John Boat Charter Inquiry",
    category: "boat_charter",
    island: "St. John",
    area: "Cruz Bay",
    headline: "Boat day inquiry from Cruz Bay for beaches, snorkeling, and island-hopping.",
    description:
      "A St. John charter inquiry lane for guests staying on St. John or arriving by ferry from St. Thomas.",
    bestFor: ["Cruz Bay", "Snorkeling", "Beach hopping", "Small groups"],
    bookingOffer: "Request a boat charter by dates, group size, route preference, and pickup point.",
    mobilityNote: "Good fit for ferry arrival, Cruz Bay meeting point, and return planning.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stx-buck-island-tour",
    businessName: "Buck Island / St. Croix Tour Inquiry",
    category: "tour_operator",
    island: "St. Croix",
    area: "Christiansted",
    headline: "St. Croix tour inquiry for water, history, and island experiences.",
    description:
      "A direct inquiry lane for St. Croix tours, Buck Island style experiences, island tours, and historical exploration.",
    bestFor: ["St. Croix tours", "Snorkeling", "History", "Families"],
    bookingOffer: "Request tour options by schedule, group size, mobility needs, and experience type.",
    mobilityNote: "Good fit for hotel pickup, Christiansted departure, and island route planning.",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-island-tour",
    businessName: "St. Thomas Island Tour Inquiry",
    category: "tour_operator",
    island: "St. Thomas",
    area: "Charlotte Amalie / Mountain Top / Beaches",
    headline: "Island tour inquiry for views, beaches, history, shopping, and local food.",
    description:
      "A St. Thomas tour inquiry lane for visitors who want a guided island day with stops, photos, beach time, and food.",
    bestFor: ["Cruise visitors", "Families", "Views", "Shopping"],
    bookingOffer: "Request a custom island tour based on arrival point, time window, and interests.",
    mobilityNote: "Good fit for cruise pickup, hotel pickup, viewpoint routing, and return timing.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stt-water-excursion",
    businessName: "Snorkel & Water Excursion Inquiry",
    category: "excursion_company",
    island: "St. Thomas",
    area: "Coki / Sapphire / Secret Harbour",
    headline: "Water excursion inquiry for snorkeling, beach time, and marine experiences.",
    description:
      "A customer inquiry lane for water-based excursions, beach-day support, and family-friendly water activities.",
    bestFor: ["Snorkeling", "Families", "Beach day", "Water activities"],
    bookingOffer: "Request excursion options by island, beach preference, group size, and pickup needs.",
    mobilityNote: "Good fit for hotel pickup, beach dropoff, and return ride planning.",
    image: "/images/places/st-thomas/sapphire-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
  {
    id: "stj-national-park-experience",
    businessName: "St. John Beach & Park Experience Inquiry",
    category: "excursion_company",
    island: "St. John",
    area: "Cruz Bay / North Shore",
    headline: "St. John beach and park planning inquiry for visitors who want a guided day.",
    description:
      "A St. John experience inquiry lane for beaches, overlooks, short hikes, and low-stress day planning.",
    bestFor: ["Beach hopping", "National park", "Families", "Day planning"],
    bookingOffer: "Request a St. John experience plan with ferry timing, stops, and mobility help.",
    mobilityNote: "Good fit for ferry arrival, Cruz Bay pickup, beach route, and return timing.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    verificationStatus: "partner_unconfirmed",
  },
];



export const enrichedCustomerBookingCatalog: CustomerBookingRecord[] =
  customerBookingCatalog.map((record): CustomerBookingRecord => ({
    sourceName: record.sourceName || "VI Guide starter catalog",
    sourceUrl: record.sourceUrl || "",
    lastVerified: record.lastVerified || "needs_review",
    imageAlt: record.imageAlt || `${record.businessName} accommodation image`,
    imageSourceName: record.imageSourceName || "Image pending verification",
    imageSourceUrl: record.imageSourceUrl || "",
    imageStatus: record.imageStatus || "needs_image",
    inventoryScope:
      record.inventoryScope ||
      (record.category === "villa" || record.category === "airbnb_operator"
        ? "inquiry_lane"
        : "single_property"),
    ...record,
  }));

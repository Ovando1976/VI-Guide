export type CarRentalIsland = "stt" | "stj" | "stx";

export type CarRentalOperator = {
  id: string;
  name: string;
  island: CarRentalIsland;
  location: string;
  pickupType: "airport" | "ferry" | "local";
  website: string;
  phone?: string;
  vehicleTypes: string[];
  features: string[];
  sourceLabel: string;
  verifiedAt: string;
};

export const CAR_RENTAL_ISLAND_NAMES: Record<CarRentalIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export const CAR_RENTAL_OPERATORS: CarRentalOperator[] = [
  {
    id: "enterprise-stt-airport",
    name: "Enterprise Rent-A-Car",
    island: "stt",
    location: "Cyril E. King Airport area",
    pickupType: "airport",
    website: "https://www.enterprise.com/en/car-rental-locations/vi/cyril-e-king-intl-airport-l002.html",
    phone: "+1 340-725-2507",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport-area shuttle", "National brand", "Advance reservation"],
    sourceLabel: "Enterprise official location page",
    verifiedAt: "2026-08-09",
  },
  {
    id: "national-stt-airport",
    name: "National Car Rental",
    island: "stt",
    location: "Cyril E. King Airport area",
    pickupType: "airport",
    website: "https://www.nationalcar.com/en/car-rental-locations/vi.html",
    phone: "+1 340-725-2507",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport-area pickup", "National brand", "Online reservations"],
    sourceLabel: "National official USVI locations page",
    verifiedAt: "2026-08-09",
  },
  {
    id: "360-car-rental-stt",
    name: "360 Car Rental",
    island: "stt",
    location: "St. Thomas",
    pickupType: "local",
    website: "https://360carrental.com/",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Local operator", "Island-wide service", "Online inquiry"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-09",
  },
  {
    id: "budget-stt-airport",
    name: "Budget Car Rental",
    island: "stt",
    location: "Cyril E. King Airport",
    pickupType: "airport",
    website: "https://www.budget.com/en/locations/cv/st-thomas/stt",
    phone: "+1 340-776-5774",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport pickup", "National brand", "Online reservations"],
    sourceLabel: "Budget official location page",
    verifiedAt: "2026-08-09",
  },
  {
    id: "courtesy-stj",
    name: "Courtesy Car & Jeep Rental",
    island: "stj",
    location: "Cruz Bay",
    pickupType: "ferry",
    website: "https://courtesycarrental.com/",
    vehicleTypes: ["4x4", "Jeep", "SUV"],
    features: ["Cruz Bay shuttle", "In-town parking", "Roadside assistance"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-09",
  },
  {
    id: "national-stj-cruz-bay",
    name: "National Car Rental",
    island: "stj",
    location: "Cruz Bay / Estate Chocolate Hole",
    pickupType: "ferry",
    website: "https://www.nationalcar.com/en/car-rental-locations/vi/cruz-bay-st-john-ferry-l006.html",
    phone: "+1 340-727-2536",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Cruz Bay location", "National brand", "Online reservations"],
    sourceLabel: "National official Cruz Bay location page",
    verifiedAt: "2026-08-09",
  },
  {
    id: "st-john-car-rental",
    name: "St. John Car Rental",
    island: "stj",
    location: "Cruz Bay",
    pickupType: "ferry",
    website: "https://www.stjohncarrental.com/",
    phone: "+1 340-776-6103",
    vehicleTypes: ["Automatic 4x4", "Jeep", "SUV"],
    features: ["Local operator", "4x4-focused fleet", "Since 1974"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-09",
  },
  {
    id: "centerline-stx",
    name: "Centerline Car Rentals",
    island: "stx",
    location: "STX Airport, Christiansted, and Mid-Island",
    pickupType: "airport",
    website: "https://www.gotostcroix.com/getting-around/car-rentals/",
    vehicleTypes: ["Economy", "Sedan", "Jeep", "SUV", "Van"],
    features: ["Local operator", "Multiple St. Croix locations", "Airport service"],
    sourceLabel: "GoToStCroix current rental directory",
    verifiedAt: "2026-08-09",
  },
  {
    id: "hertz-stx-airport",
    name: "Hertz",
    island: "stx",
    location: "Henry E. Rohlsen Airport",
    pickupType: "airport",
    website: "https://www.hertz.com/us/en/location/usvirginislands/stcroix/stxt50",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport location", "National brand", "Online reservations"],
    sourceLabel: "Hertz official location page",
    verifiedAt: "2026-08-09",
  },
  {
    id: "avis-stx-airport",
    name: "Avis",
    island: "stx",
    location: "Henry E. Rohlsen Airport",
    pickupType: "airport",
    website: "https://www.avis.com/en/locations/lat/cx/christiansted/stx",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport location", "National brand", "Online reservations"],
    sourceLabel: "Avis official location page",
    verifiedAt: "2026-08-09",
  },
];

export function getCarRentalOperators(island?: CarRentalIsland) {
  return island
    ? CAR_RENTAL_OPERATORS.filter((operator) => operator.island === island)
    : CAR_RENTAL_OPERATORS;
}

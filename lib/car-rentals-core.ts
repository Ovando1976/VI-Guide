export type CarRentalIsland = "stt" | "stj" | "stx";
export type CarRentalArrival = "airport" | "ferry" | "local";
export type CarRentalVehicleNeed = "car" | "suv" | "jeep" | "van";

export type CarRentalOperator = {
  id: string;
  name: string;
  island: CarRentalIsland;
  location: string;
  pickupType: CarRentalArrival;
  website: string;
  phone?: string;
  vehicleTypes: string[];
  features: string[];
  sourceLabel: string;
  verifiedAt: string;
};

export type CarRentalMatchInput = {
  island: CarRentalIsland;
  arrival?: CarRentalArrival;
  vehicle?: CarRentalVehicleNeed;
  travelers?: number;
  luggage?: number;
};

export type CarRentalOperatorMatch = {
  operator: CarRentalOperator;
  score: number;
  reasons: string[];
};

export const CAR_RENTAL_ISLAND_NAMES: Record<CarRentalIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export const CAR_RENTAL_OPERATORS: CarRentalOperator[] = [
  // St. Thomas
  {
    id: "enterprise-stt-airport",
    name: "Enterprise Rent-A-Car",
    island: "stt",
    location: "Cyril E. King Airport area",
    pickupType: "airport",
    website:
      "https://www.enterprise.com/en/car-rental-locations/vi/cyril-e-king-intl-airport-l002.html",
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
    website:
      "https://www.nationalcar.com/en/car-rental-locations/vi/cyril-e-king-intl-airport-l003.html",
    phone: "+1 340-725-2507",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport-area pickup", "National brand", "Online reservations"],
    sourceLabel: "National official STT location page",
    verifiedAt: "2026-08-23",
  },
  {
    id: "hertz-stt-airport",
    name: "Hertz",
    island: "stt",
    location: "Cyril E. King Airport",
    pickupType: "airport",
    website: "https://www.hertz.com/us/en/location/usvirginislands/stthomas/sttt02",
    phone: "+1 340-774-1879",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport location", "National brand", "Online reservations"],
    sourceLabel: "Hertz official STT location page",
    verifiedAt: "2026-08-23",
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
    id: "avis-stt-airport",
    name: "Avis Car Rental",
    island: "stt",
    location: "Cyril E. King Airport",
    pickupType: "airport",
    website: "https://www.avis.com/",
    phone: "+1 340-774-1468",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport location", "National brand", "Online reservations"],
    sourceLabel: "Visit USVI current listing + Avis official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "dollar-thrifty-stt",
    name: "Dollar and Thrifty Car Rental",
    island: "stt",
    location: "Charlotte Amalie West / airport area",
    pickupType: "airport",
    website: "https://www.dollar.com/",
    phone: "+1 340-774-0111",
    vehicleTypes: ["Economy", "Sedan", "SUV", "Van"],
    features: ["Airport-area service", "National brands", "Online reservations"],
    sourceLabel: "Visit USVI current listing + Dollar official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "amalie-stt",
    name: "Amalie Car Rental",
    island: "stt",
    location: "Cyril E. King Airport arrival handoff",
    pickupType: "airport",
    website: "https://www.amaliecar.com/",
    phone: "+1 340-690-0688",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Airport meet-and-greet", "New-model fleet", "St. John ferry use allowed"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "discount-stt",
    name: "Discount Car Rental",
    island: "stt",
    location: "Estate Contant / Charlotte Amalie West",
    pickupType: "airport",
    website: "https://www.discountcar.vi/",
    phone: "+1 340-776-4858",
    vehicleTypes: ["Car", "Jeep", "SUV", "Van"],
    features: ["Local operator", "Airport-area service", "Online reservations"],
    sourceLabel: "Visit USVI current listing + operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "first-rent-a-car-stt",
    name: "First Rent A Car",
    island: "stt",
    location: "Bournefield / airport area",
    pickupType: "airport",
    website: "https://firstrentacarstthomas.com/",
    phone: "+1 340-776-3730",
    vehicleTypes: ["Compact", "Car", "Jeep", "SUV", "Van"],
    features: ["Complimentary airport pickup", "Local operator", "Unlimited mileage"],
    sourceLabel: "Operator official website + Visit USVI current listing",
    verifiedAt: "2026-08-23",
  },
  {
    id: "my-car-rental-vi-stt",
    name: "My Car Rental VI",
    island: "stt",
    location: "Charlotte Amalie",
    pickupType: "local",
    website: "https://www.mycarrentalvi.com/",
    phone: "+1 340-776-9229",
    vehicleTypes: ["Car", "SUV"],
    features: ["Local operator", "Charlotte Amalie location", "Online reservations"],
    sourceLabel: "Visit USVI current listing + operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "paradise-rental-car-stt",
    name: "Paradise Rental Car",
    island: "stt",
    location: "Estate Contant / Charlotte Amalie West",
    pickupType: "local",
    website: "https://www.pdiseinc.com/",
    phone: "+1 340-643-2692",
    vehicleTypes: ["Car", "SUV", "Jeep"],
    features: ["Local operator", "Charlotte Amalie West", "Online reservations"],
    sourceLabel: "Visit USVI current listing + operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "country-auto-rental-stt",
    name: "Country Auto Rental & Sales",
    island: "stt",
    location: "St. Thomas",
    pickupType: "local",
    website: "https://joelsautorepairusvi.com/",
    phone: "+1 340-513-9857",
    vehicleTypes: ["Car", "SUV"],
    features: ["Local operator", "Daily / weekly / long-term rentals", "Auto service on site"],
    sourceLabel: "Visit USVI current Preferred Partner listing",
    verifiedAt: "2026-08-23",
  },
  {
    id: "dexter-rental-car-stt",
    name: "Dexter Rental Car",
    island: "stt",
    location: "Estate Frydenhoj",
    pickupType: "local",
    website: "https://dexterrentalcar.com/",
    phone: "+1 340-643-3534",
    vehicleTypes: ["Car", "SUV"],
    features: ["Local operator", "East-side location", "Extended service hours"],
    sourceLabel: "Visit USVI current listing + operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "premium-rental-car-stt",
    name: "Premium Car Rental",
    island: "stt",
    location: "Estate Nisky / Charlotte Amalie West",
    pickupType: "local",
    website: "https://www.economyrentacar.com/",
    phone: "+1 340-774-1977",
    vehicleTypes: ["Economy", "Car", "SUV"],
    features: ["Charlotte Amalie West", "Economy Rent a Car network", "Online reservations"],
    sourceLabel: "Visit USVI current listing + linked official website",
    verifiedAt: "2026-08-23",
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

  // St. John
  {
    id: "courtesy-stj",
    name: "Courtesy Car & Jeep Rental",
    island: "stj",
    location: "Cruz Bay",
    pickupType: "ferry",
    website: "https://courtesycarrental.com/",
    phone: "+1 340-776-6650",
    vehicleTypes: ["4x4", "Jeep", "SUV"],
    features: ["Cruz Bay shuttle", "In-town parking", "Roadside assistance"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "enterprise-stj-cruz-bay",
    name: "Enterprise Rent-A-Car",
    island: "stj",
    location: "Cruz Bay / Estate Chocolate Hole",
    pickupType: "ferry",
    website:
      "https://www.enterprise.com/en/car-rental-locations/vi/cruz-bay-st-john-ferry-l005.html",
    vehicleTypes: ["Car", "SUV", "Van"],
    features: ["Cruz Bay ferry location", "National brand", "Online reservations"],
    sourceLabel: "Enterprise official Cruz Bay location page",
    verifiedAt: "2026-08-23",
  },
  {
    id: "national-stj-cruz-bay",
    name: "National Car Rental",
    island: "stj",
    location: "Cruz Bay / Estate Chocolate Hole",
    pickupType: "ferry",
    website:
      "https://www.nationalcar.com/en/car-rental-locations/vi/cruz-bay-st-john-ferry-l006.html",
    phone: "+1 340-727-2536",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Cruz Bay location", "National brand", "Online reservations"],
    sourceLabel: "National official Cruz Bay location page",
    verifiedAt: "2026-08-23",
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
    features: ["Local operator", "4x4-focused fleet", "Cruz Bay location"],
    sourceLabel: "Visit USVI listing + operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "cruz-bay-car-rental-stj",
    name: "Cruz Bay Car Rental",
    island: "stj",
    location: "Gallows Point / Cruz Bay",
    pickupType: "ferry",
    website: "https://cruzbaycarrental.com/",
    phone: "+1 340-693-7730",
    vehicleTypes: ["4x4", "Jeep", "SUV"],
    features: ["Local operator", "AWD / 4x4 fleet", "Unlimited mileage"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "conrad-sutton-stj",
    name: "Conrad Sutton Jeep & Car Rental",
    island: "stj",
    location: "Cruz Bay",
    pickupType: "ferry",
    website: "https://www.conradcars.com/",
    phone: "+1 340-776-6479",
    vehicleTypes: ["4x4", "Jeep", "SUV"],
    features: ["Local operator", "4-wheel-drive fleet", "Cruz Bay location"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "varlack-stj",
    name: "Varlack Ventures",
    island: "stj",
    location: "Cruz Bay",
    pickupType: "ferry",
    website: "https://www.varlack-ventures.com/",
    phone: "+1 340-776-6412",
    vehicleTypes: ["Jeep", "SUV"],
    features: ["Local operator", "Cruz Bay location", "Jeep rentals"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "pauls-car-jeep-stj",
    name: "Paul's Car & Jeep Rental",
    island: "stj",
    location: "Cruz Bay to Coral Bay",
    pickupType: "local",
    website: "https://paulsjeeprental.com/",
    phone: "+1 340-201-2501",
    vehicleTypes: ["4x4", "Jeep", "SUV"],
    features: ["Local operator", "4WD fleet", "Free pickup service"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "destiny-car-rental-stj",
    name: "Destiny Car Rental",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.destinycarrentalvi.com/",
    phone: "+1 340-777-5337",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Local St. John operator", "Island rental fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "hospitality-rent-a-car-stj",
    name: "Hospitality Rent A Car",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.hospitalityrentacar.com/",
    phone: "+1 340-693-9160",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Local St. John operator", "Island rental fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "island-hopping-rentals-stj",
    name: "Island Hopping Rentals",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.islandhoppingrentals.com/",
    phone: "+1 340-228-2229",
    vehicleTypes: ["Jeep", "SUV"],
    features: ["Local St. John operator", "Jeep / SUV rentals", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "just-sun-jeeps-stj",
    name: "Just Sun Jeeps",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.justsunjeeps.com/",
    phone: "+1 340-227-2235",
    vehicleTypes: ["Jeep", "4x4"],
    features: ["Local St. John operator", "Jeep-focused fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "ll-jeep-rental-stj",
    name: "L & L Jeep Rental",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.bookajeep.com/",
    phone: "+1 340-776-1120",
    vehicleTypes: ["Jeep", "4x4"],
    features: ["Local St. John operator", "Jeep-focused fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "lionel-jeep-rental-stj",
    name: "Lionel Jeep Rental",
    island: "stj",
    location: "Cruz Bay",
    pickupType: "ferry",
    website: "https://www.lioneljeeprentals.com/",
    phone: "+1 340-693-8764",
    vehicleTypes: ["Jeep", "SUV", "4x4"],
    features: ["Local operator", "Cruz Bay service", "Jeep / SUV fleet"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "mr-pipers-jeeps-stj",
    name: "Mr. Piper's Jeeps",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.mrpipersjeeps.com/",
    phone: "+1 340-693-7580",
    vehicleTypes: ["Jeep", "4x4"],
    features: ["Local St. John operator", "Jeep-focused fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "oconnor-car-rental-stj",
    name: "O'Connor Car Rental",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.oconnorcarrental.com/",
    phone: "+1 340-776-6343",
    vehicleTypes: ["Car", "Jeep", "SUV"],
    features: ["Local St. John operator", "Island rental fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "slim-mans-jeep-rental-stj",
    name: "Slim Man's Jeep Rental",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.slimmansjeeprental.com/",
    phone: "+1 508-932-2737",
    vehicleTypes: ["Jeep", "4x4"],
    features: ["Local St. John operator", "Jeep-focused fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "sunshines-jeep-rental-stj",
    name: "Sunshine's Jeep Rental",
    island: "stj",
    location: "St. John",
    pickupType: "local",
    website: "https://www.sunshinesjeeprental.com/",
    phone: "+1 340-690-1786",
    vehicleTypes: ["Jeep", "4x4"],
    features: ["Local St. John operator", "Jeep-focused fleet", "Online reservations"],
    sourceLabel: "RentStJohn 2026 directory + operator website",
    verifiedAt: "2026-08-23",
  },

  // St. Croix
  {
    id: "centerline-stx",
    name: "Centerline Car Rentals",
    island: "stx",
    location: "STX Airport, Christiansted, and Mid-Island",
    pickupType: "airport",
    website: "https://stxrentalcar.com/",
    phone: "+1 340-692-2525",
    vehicleTypes: ["Economy", "Sedan", "Jeep", "SUV", "Van"],
    features: ["Local operator", "Multiple St. Croix locations", "Airport terminal service"],
    sourceLabel: "Operator official website + Visit USVI current listing",
    verifiedAt: "2026-08-23",
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
  {
    id: "budget-stx",
    name: "Budget Rent A Car St. Croix",
    island: "stx",
    location: "STX Airport, Christiansted, and Frederiksted",
    pickupType: "airport",
    website: "https://www.budgetstcroix.com/",
    phone: "+1 888-264-8894",
    vehicleTypes: ["Car", "Jeep", "SUV", "Van", "Truck"],
    features: ["Airport terminal counter", "Multiple island locations", "Hotel pickup available"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "olympic-stx",
    name: "Olympic Rent-A-Car",
    island: "stx",
    location: "Christiansted / island delivery",
    pickupType: "local",
    website: "https://www.olympicstcroix.com/",
    phone: "+1 340-718-3000",
    vehicleTypes: ["Economy", "Car", "Jeep", "SUV", "Van"],
    features: ["Local operator", "Airport / hotel delivery", "Jeep and minivan options"],
    sourceLabel: "Operator official website + Visit USVI current listing",
    verifiedAt: "2026-08-23",
  },
  {
    id: "judi-of-croix-stx",
    name: "Judi of Croix Car Rentals",
    island: "stx",
    location: "St. Croix",
    pickupType: "local",
    website: "https://www.judiofcroix.com/",
    phone: "+1 340-773-2123",
    vehicleTypes: ["Car", "SUV", "Van"],
    features: ["Local operator", "Late-model fleet", "Unlimited mileage"],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
];

export function getCarRentalOperators(island?: CarRentalIsland) {
  return island
    ? CAR_RENTAL_OPERATORS.filter((operator) => operator.island === island)
    : CAR_RENTAL_OPERATORS;
}

export function rankCarRentalOperators(
  input: CarRentalMatchInput,
): CarRentalOperatorMatch[] {
  return CAR_RENTAL_OPERATORS.filter(
    (operator) => operator.island === input.island,
  )
    .map((operator) => {
      let score = 100;
      const reasons: string[] = [
        `Serves ${CAR_RENTAL_ISLAND_NAMES[input.island]}`,
      ];
      if (input.arrival && operator.pickupType === input.arrival) {
        score += 35;
        reasons.push(`${capitalize(input.arrival)} pickup fit`);
      } else if (
        input.arrival === "ferry" &&
        operator.features.some((feature) =>
          /shuttle|cruz bay|island-wide/i.test(feature),
        )
      ) {
        score += 18;
        reasons.push("Useful ferry-arrival handoff");
      }
      if (input.vehicle && supportsVehicle(operator, input.vehicle)) {
        score += 30;
        reasons.push(`${vehicleLabel(input.vehicle)} listed in fleet`);
      }
      if ((input.travelers ?? 0) >= 6 && supportsVehicle(operator, "van")) {
        score += 20;
        reasons.push("Van option for larger party");
      }
      if (
        (input.luggage ?? 0) >= 5 &&
        (supportsVehicle(operator, "suv") || supportsVehicle(operator, "van"))
      ) {
        score += 12;
        reasons.push("Roomier fleet for luggage");
      }
      if (
        input.island === "stj" &&
        (supportsVehicle(operator, "jeep") ||
          operator.features.some((feature) => /4x4/i.test(feature)))
      ) {
        score += 15;
        reasons.push("Strong St. John 4x4 fit");
      }
      if (
        operator.features.some((feature) => /local operator/i.test(feature))
      ) {
        score += 4;
        reasons.push("Local operator");
      }
      return { operator, score, reasons: reasons.slice(0, 4) };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.operator.name.localeCompare(b.operator.name),
    );
}

function supportsVehicle(
  operator: CarRentalOperator,
  vehicle: CarRentalVehicleNeed,
) {
  const fleet = operator.vehicleTypes.join(" ").toLowerCase();
  if (vehicle === "car") return /car|economy|sedan|compact/.test(fleet);
  if (vehicle === "suv") return /suv/.test(fleet);
  if (vehicle === "jeep") return /jeep|4x4/.test(fleet);
  return /van/.test(fleet);
}

function vehicleLabel(vehicle: CarRentalVehicleNeed) {
  return vehicle === "jeep"
    ? "Jeep / 4x4"
    : vehicle === "suv"
      ? "SUV"
      : vehicle === "van"
        ? "Passenger van"
        : "Car";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

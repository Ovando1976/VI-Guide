import {
  CAR_RENTAL_ISLAND_NAMES,
  CAR_RENTAL_OPERATORS as CORE_CAR_RENTAL_OPERATORS,
  type CarRentalArrival,
  type CarRentalIsland,
  type CarRentalMatchInput,
  type CarRentalOperator,
  type CarRentalOperatorMatch,
  type CarRentalVehicleNeed,
} from "./car-rentals-core";

export type {
  CarRentalArrival,
  CarRentalIsland,
  CarRentalMatchInput,
  CarRentalOperator,
  CarRentalOperatorMatch,
  CarRentalVehicleNeed,
};
export { CAR_RENTAL_ISLAND_NAMES };

/**
 * Current-source additions layered over the original audited rental catalog.
 *
 * Keep this layer additive so the original source snapshot remains easy to
 * inspect. Live price, inventory, insurance, deposit, age, and cancellation
 * rules are deliberately not modeled here; travelers must confirm those with
 * the operator before relying on a reservation.
 */
export const RESTORED_CAR_RENTAL_OPERATORS: CarRentalOperator[] = [
  {
    id: "ks-rental-stt",
    name: "K's Rental",
    island: "stt",
    location: "Kronprindsens Gade / Charlotte Amalie ferry-dock area",
    pickupType: "local",
    website: "https://www.ksrental.net/",
    phone: "+1 340-244-2897",
    vehicleTypes: ["Car", "Jeep", "SUV", "Van"],
    features: [
      "Local operator",
      "Charlotte Amalie ferry-dock area",
      "Car / Jeep / SUV / van mix",
    ],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "tropical-adventure-stt",
    name: "Tropical Adventure Car Rental",
    island: "stt",
    location: "Kongens Gade / Charlotte Amalie",
    pickupType: "local",
    website:
      "https://tropicaladventurevi.com/adventures/basic-economy-vehicle/",
    phone: "+1 340-474-9727",
    vehicleTypes: ["Economy", "Car", "SUV"],
    features: [
      "Local operator",
      "Charlotte Amalie location",
      "Direct online reservation",
    ],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "aqua-blu-stj",
    name: "Aqua Blu Car Rental",
    island: "stj",
    location: "Cruz Bay / St. John",
    pickupType: "ferry",
    website: "https://aquablucarrental.com/",
    phone: "+1 340-776-2782",
    vehicleTypes: ["Jeep", "SUV", "4x4"],
    features: [
      "Complimentary Cruz Bay ferry pickup",
      "4x4-focused fleet",
      "Unlimited mileage",
    ],
    sourceLabel: "Visit USVI current listing + operator official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "bougainvillea-leasing-stj",
    name: "Bougainvillea Leasing Ltd.",
    island: "stj",
    location: "Cruz Bay ferry-dock area",
    pickupType: "ferry",
    website: "https://stjohnjeeps.com/",
    phone: "+1 800-253-7107",
    vehicleTypes: ["Jeep", "SUV", "4x4"],
    features: [
      "Short walk from Cruz Bay ferry dock",
      "Jeep / SUV fleet",
      "Local St. John operator",
    ],
    sourceLabel: "Operator official website + current St. John rental directory",
    verifiedAt: "2026-08-23",
  },
  {
    id: "cool-breeze-stj",
    name: "Cool Breeze Jeep/Car Rental",
    island: "stj",
    location: "Cruz Bay ferry-dock area",
    pickupType: "ferry",
    website: "https://www.coolbreezecarrental.com/",
    phone: "+1 340-776-6588",
    vehicleTypes: ["Car", "Jeep", "SUV", "4x4"],
    features: [
      "Two-minute walk from ferry dock",
      "Jeep and multi-passenger SUV options",
      "Online reservation",
    ],
    sourceLabel: "Operator official website + current St. John rental directory",
    verifiedAt: "2026-08-23",
  },
  {
    id: "ace-stx",
    name: "ACE Rent A Car",
    island: "stx",
    location: "1103 Richmond / Christiansted",
    pickupType: "local",
    website: "https://www.acerentacar.com/",
    phone: "+1 866-551-8267",
    vehicleTypes: ["Car"],
    features: [
      "Christiansted location",
      "Current Visit USVI transportation listing",
      "Direct operator booking",
    ],
    sourceLabel: "Visit USVI current listing + ACE official website",
    verifiedAt: "2026-08-23",
  },
  {
    id: "island-auto-club-stx",
    name: "Island Auto Club",
    island: "stx",
    location: "St. Croix",
    pickupType: "local",
    website: "https://islandautoclub.com/",
    phone: "+1 939-332-1651",
    vehicleTypes: ["Car"],
    features: [
      "Local operator",
      "Airport pickup / drop-off",
      "Delivery to lodging or local address",
    ],
    sourceLabel: "Operator official website",
    verifiedAt: "2026-08-23",
  },
];

export const CURRENT_DESTINATION_CAR_RENTAL_OPERATORS =
  RESTORED_CAR_RENTAL_OPERATORS.map((operator) => operator.name) as readonly string[];

export const CAR_RENTAL_OPERATORS: CarRentalOperator[] = [
  ...CORE_CAR_RENTAL_OPERATORS,
  ...RESTORED_CAR_RENTAL_OPERATORS,
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
          /shuttle|cruz bay|ferry|island-wide/i.test(feature),
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

import type { VitranFareType } from "./transportTypes";

export const vitranFares: Record<VitranFareType, number> = {
  regular: 2,
  student: 1.5,
  senior: 0,
  disability: 0,
  paratransit: 4,
};

export function getVitranFare(type: VitranFareType = "regular") {
  const fare = vitranFares[type];

  return {
    fare,
    fareText: fare === 0 ? "Free" : `$${fare.toFixed(2)}`,
    label:
      type === "student"
        ? "Student fare"
        : type === "senior"
          ? "Senior fare"
          : type === "disability"
            ? "Disability fare"
            : type === "paratransit"
              ? "VITRAN Plus fare"
              : "Regular fare",
  };
}

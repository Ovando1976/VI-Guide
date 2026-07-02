import { describe, it, expect } from "vitest";
import { calculateTariffQuote, inferTaxiZone } from "./tariffEngine";

describe("Tariff Engine: Zone Inference", () => {
  it("normalizes fuzzy user input to official zones", () => {
    // Test fuzzy matching
    expect(inferTaxiZone({ island: "st_thomas", label: "W.I.C.O. Pier" })).toBe("stt_havensight");
    expect(inferTaxiZone({ island: "st_thomas", label: "Cyril E. King Airport" })).toBe("stt_airport");
    expect(inferTaxiZone({ island: "st_john", label: "Skinny Legs" })).toBe("stj_coral_bay");
  });

  it("returns general zone when input is unknown", () => {
    expect(inferTaxiZone({ island: "st_thomas", label: "NonExistentPlace" })).toBe("stt_general");
  });
});

describe("Tariff Engine: Core Math Compliance", () => {
  it("calculates correct base fare for standard single passenger", () => {
    const quote = calculateTariffQuote({
      island: "st_thomas",
      originLabel: "Airport",
      destinationLabel: "Charlotte Amalie",
      tripType: "standard" as any,
      serviceClass: "shared",
      passengers: 1,
      luggage: 0,
    });
    // Base: 11
    expect(quote.total).toBe(11);
    expect(quote.confidence).toBe("official_seed");
  });

  it("applies passenger fees correctly (2 passengers)", () => {
    const quote = calculateTariffQuote({
      island: "st_thomas",
      originLabel: "Airport",
      destinationLabel: "Charlotte Amalie",
      tripType: "standard" as any,
      serviceClass: "shared",
      passengers: 2,
      luggage: 0,
    });
    // Base 11 + (1 extra * 6) = 17
    expect(quote.total).toBe(17);
  });

  it("applies luggage fees correctly", () => {
    const quote = calculateTariffQuote({
      island: "st_thomas",
      originLabel: "Airport",
      destinationLabel: "Charlotte Amalie",
      tripType: "standard" as any,
      serviceClass: "shared",
      passengers: 1,
      luggage: 2,
    });
    // Base 11 + (2 bags * 3) = 17
    expect(quote.total).toBe(17);
  });
});

describe("Tariff Engine: Multipliers and Surcharges", () => {
  it("applies cruise demand multiplier (1.15x)", () => {
    const quote = calculateTariffQuote({
      island: "st_thomas",
      originLabel: "Havensight",
      destinationLabel: "Charlotte Amalie",
      tripType: "cruise",
      serviceClass: "shared",
      passengers: 1,
      luggage: 0,
    });
    // Base 6 * 1.15 = 6.9 -> Round(7)
    expect(quote.total).toBe(7);
  });

  it("applies private service premium (1.85x)", () => {
    const quote = calculateTariffQuote({
      island: "st_thomas",
      originLabel: "Airport",
      destinationLabel: "Red Hook",
      tripType: "standard" as any,
      serviceClass: "private",
      passengers: 1,
      luggage: 0,
    });
    // Base 23
    // Shared Subtotal 23
    // Premium 23 * 0.85 = 19.55 -> 20
    // Total 23 + 20 = 43
    expect(quote.total).toBe(43);
  });
});

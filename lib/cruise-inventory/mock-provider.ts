import { createHash } from "node:crypto";

import {
  CruiseProviderError,
  type CruiseInventoryProvider,
} from "@/lib/cruise-inventory/provider";
import type {
  CruiseBooking,
  CruiseBookingRequest,
  CruiseCabinAvailability,
  CruiseCabinAvailabilityRequest,
  CruiseCancellationResult,
  CruiseHold,
  CruiseHoldRequest,
  CruiseQuote,
  CruiseQuoteRequest,
  CruiseSailing,
  CruiseSearchRequest,
  CruiseSearchResponse,
} from "@/lib/cruise-inventory/types";

const PORTS = {
  miami: {
    id: "MIA",
    name: "PortMiami",
    city: "Miami",
    countryCode: "US",
  },
  sanJuan: {
    id: "SJU",
    name: "Port of San Juan",
    city: "San Juan",
    countryCode: "PR",
  },
  stThomas: {
    id: "STT",
    name: "St. Thomas",
    city: "Charlotte Amalie",
    countryCode: "VI",
  },
  stMaarten: {
    id: "SXM",
    name: "St. Maarten",
    city: "Philipsburg",
    countryCode: "SX",
  },
  nassau: {
    id: "NAS",
    name: "Nassau",
    city: "Nassau",
    countryCode: "BS",
  },
} as const;

export class MockCruiseInventoryProvider implements CruiseInventoryProvider {
  readonly id = "mock" as const;
  readonly live = false;

  async searchSailings(
    request: CruiseSearchRequest,
  ): Promise<CruiseSearchResponse> {
    const sailings = buildMockSailings(request).filter((sailing) => {
      if (
        request.departurePortIds?.length &&
        !request.departurePortIds.some((portId) =>
          [sailing.departurePort.id, sailing.departurePort.name]
            .map(normalize)
            .includes(normalize(portId)),
        )
      ) {
        return false;
      }
      if (
        request.destinationNames?.length &&
        !request.destinationNames.some((destination) =>
          sailing.destinationNames.some((name) =>
            normalize(name).includes(normalize(destination)),
          ),
        )
      ) {
        return false;
      }
      if (
        request.cruiseLineIds?.length &&
        !request.cruiseLineIds.some((id) =>
          [sailing.cruiseLine.id, sailing.cruiseLine.name]
            .map(normalize)
            .includes(normalize(id)),
        )
      ) {
        return false;
      }
      if (
        request.nightsMinimum !== undefined &&
        sailing.nights < request.nightsMinimum
      ) {
        return false;
      }
      if (
        request.nightsMaximum !== undefined &&
        sailing.nights > request.nightsMaximum
      ) {
        return false;
      }
      return true;
    });

    return {
      provider: this.id,
      live: false,
      searchedAt: new Date().toISOString(),
      results: sailings.slice(0, request.limit),
    };
  }

  async getSailing(sailingId: string): Promise<CruiseSailing> {
    const sailing = buildMockSailings(defaultSearchRequest()).find(
      (candidate) => candidate.id === sailingId,
    );
    if (!sailing) {
      throw new CruiseProviderError(
        "not_found",
        "The mock sailing was not found.",
        404,
      );
    }
    return sailing;
  }

  async getCabinAvailability(
    request: CruiseCabinAvailabilityRequest,
  ): Promise<CruiseCabinAvailability> {
    const sailing = await this.getSailing(request.sailingId);
    return {
      sailingId: sailing.id,
      provider: this.id,
      verifiedAt: new Date().toISOString(),
      categories: sailing.cabinCategories.map((category, index) => ({
        ...category,
        available: true,
        availableCount: Math.max(2, 12 - index * 2),
        fares: [
          {
            fareCode: "MOCK-FLEX",
            fareName: "Mock flexible fare",
            amount: category.startingFare ?? {
              amountCents: 125_000,
              currency: request.currency,
            },
            taxesAndFees: {
              amountCents: 18_900,
              currency: request.currency,
            },
            deposit: {
              amountCents: 50_000,
              currency: request.currency,
            },
            taxesIncluded: false,
            refundable: true,
            promotionNames: ["Development inventory only"],
          },
        ],
      })),
    };
  }

  async createQuote(request: CruiseQuoteRequest): Promise<CruiseQuote> {
    const availability = await this.getCabinAvailability(request);
    const category = availability.categories.find(
      (candidate) => candidate.id === request.cabinCategoryId,
    );
    const fare = category?.fares[0];
    if (!category || !fare) {
      throw new CruiseProviderError(
        "availability_changed",
        "The selected mock cabin category is unavailable.",
        409,
      );
    }
    const passengerCount = request.adults + request.childAges.length;
    const taxes = fare.taxesAndFees?.amountCents ?? 0;
    const totalCents = fare.amount.amountCents * passengerCount + taxes;
    const quoteId = `mock_quote_${digest([
      request.sailingId,
      request.cabinCategoryId,
      String(passengerCount),
    ]).slice(0, 20)}`;
    return {
      id: quoteId,
      provider: this.id,
      supplierQuoteId: quoteId,
      sailingId: request.sailingId,
      cabinCategoryId: category.id,
      fare,
      total: { amountCents: totalCents, currency: request.currency },
      depositDue: fare.deposit ?? null,
      depositDueAt: null,
      finalPaymentDueAt: null,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      termsSummary:
        "Synthetic development quote. It cannot reserve or purchase a real cruise.",
      liveVerifiedAt: new Date().toISOString(),
    };
  }

  async repriceQuote(quoteId: string): Promise<CruiseQuote> {
    if (!quoteId.startsWith("mock_quote_")) {
      throw new CruiseProviderError(
        "not_found",
        "The mock quote was not found.",
        404,
      );
    }
    return {
      id: quoteId,
      provider: this.id,
      supplierQuoteId: quoteId,
      sailingId: "mock_sailing_eastern_caribbean",
      cabinCategoryId: "mock_balcony",
      fare: {
        fareCode: "MOCK-FLEX",
        fareName: "Mock flexible fare",
        amount: { amountCents: 149_900, currency: "USD" },
        taxesAndFees: { amountCents: 18_900, currency: "USD" },
        deposit: { amountCents: 50_000, currency: "USD" },
        taxesIncluded: false,
        refundable: true,
      },
      total: { amountCents: 318_700, currency: "USD" },
      depositDue: { amountCents: 50_000, currency: "USD" },
      depositDueAt: null,
      finalPaymentDueAt: null,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      termsSummary:
        "Synthetic development quote. It cannot reserve or purchase a real cruise.",
      liveVerifiedAt: new Date().toISOString(),
    };
  }

  async holdCabin(request: CruiseHoldRequest): Promise<CruiseHold> {
    return {
      id: `mock_hold_${digest([request.quoteId, request.clientReference]).slice(0, 20)}`,
      provider: this.id,
      supplierHoldId: `mock_supplier_hold_${digest([
        request.quoteId,
        request.clientReference,
      ]).slice(0, 16)}`,
      quoteId: request.quoteId,
      status: "held",
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  }

  async createBooking(request: CruiseBookingRequest): Promise<CruiseBooking> {
    return {
      id: `mock_booking_${digest([request.idempotencyKey]).slice(0, 20)}`,
      provider: this.id,
      supplierBookingId: `mock_supplier_${digest([
        request.idempotencyKey,
      ]).slice(0, 16)}`,
      cruiseLineConfirmationNumber: null,
      status: "pending_payment",
      supplierPaymentUrl: null,
      quoteId: request.quoteId,
      bookedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  async retrieveBooking(bookingId: string): Promise<CruiseBooking> {
    if (!bookingId.startsWith("mock_booking_")) {
      throw new CruiseProviderError(
        "not_found",
        "The mock booking was not found.",
        404,
      );
    }
    return {
      id: bookingId,
      provider: this.id,
      supplierBookingId: bookingId.replace("mock_booking_", "mock_supplier_"),
      cruiseLineConfirmationNumber: null,
      status: "pending_payment",
      supplierPaymentUrl: null,
      quoteId: "mock_quote_retrieved",
      bookedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  async cancelBooking(
    bookingId: string,
    _reason: string,
  ): Promise<CruiseCancellationResult> {
    if (!bookingId.startsWith("mock_booking_")) {
      throw new CruiseProviderError(
        "not_found",
        "The mock booking was not found.",
        404,
      );
    }
    return {
      bookingId,
      status: "cancelled",
      penalty: null,
      supplierReference: `mock_cancel_${digest([bookingId]).slice(0, 16)}`,
    };
  }
}

function buildMockSailings(request: CruiseSearchRequest): CruiseSailing[] {
  const baseDate = request.departureDateFrom;
  const verifiedAt = new Date().toISOString();
  return [
    makeSailing({
      id: "mock_sailing_eastern_caribbean",
      supplierSailingId: "MOCK-EC-001",
      cruiseLineId: "mock-oceanic",
      cruiseLineName: "Oceanic Demo Cruises",
      shipId: "mock-islander",
      shipName: "Island Voyager",
      departurePort: PORTS.miami,
      arrivalPort: PORTS.miami,
      departureDate: baseDate,
      nights: 7,
      destinations: ["Eastern Caribbean", "U.S. Virgin Islands"],
      ports: [PORTS.stThomas, PORTS.stMaarten],
      leadFareCents: 109_900,
      verifiedAt,
    }),
    makeSailing({
      id: "mock_sailing_southern_caribbean",
      supplierSailingId: "MOCK-SC-002",
      cruiseLineId: "mock-caribbean",
      cruiseLineName: "Caribbean Demo Line",
      shipId: "mock-horizon",
      shipName: "Caribbean Horizon",
      departurePort: PORTS.sanJuan,
      arrivalPort: PORTS.sanJuan,
      departureDate: addDays(baseDate, 7),
      nights: 8,
      destinations: ["Southern Caribbean", "U.S. Virgin Islands"],
      ports: [PORTS.stThomas, PORTS.stMaarten],
      leadFareCents: 129_900,
      verifiedAt,
    }),
    makeSailing({
      id: "mock_sailing_bahamas",
      supplierSailingId: "MOCK-BS-003",
      cruiseLineId: "mock-sun",
      cruiseLineName: "Sun Demo Cruises",
      shipId: "mock-breeze",
      shipName: "Sun Breeze",
      departurePort: PORTS.miami,
      arrivalPort: PORTS.miami,
      departureDate: addDays(baseDate, 14),
      nights: 4,
      destinations: ["Bahamas"],
      ports: [PORTS.nassau],
      leadFareCents: 69_900,
      verifiedAt,
    }),
  ].filter(
    (sailing) =>
      sailing.departureDate >= request.departureDateFrom &&
      sailing.departureDate <= request.departureDateTo,
  );
}

function makeSailing(input: {
  id: string;
  supplierSailingId: string;
  cruiseLineId: string;
  cruiseLineName: string;
  shipId: string;
  shipName: string;
  departurePort: (typeof PORTS)[keyof typeof PORTS];
  arrivalPort: (typeof PORTS)[keyof typeof PORTS];
  departureDate: string;
  nights: number;
  destinations: string[];
  ports: Array<(typeof PORTS)[keyof typeof PORTS]>;
  leadFareCents: number;
  verifiedAt: string;
}): CruiseSailing {
  const returnDate = addDays(input.departureDate, input.nights);
  const itinerary = [
    {
      sequence: 1,
      port: input.departurePort,
      arrivesAt: null,
      departsAt: `${input.departureDate}T17:00:00.000Z`,
      dayLabel: "Embarkation",
    },
    ...input.ports.map((port, index) => {
      const date = addDays(input.departureDate, index + 2);
      return {
        sequence: index + 2,
        port,
        arrivesAt: `${date}T12:00:00.000Z`,
        departsAt: `${date}T21:00:00.000Z`,
        dayLabel: `Day ${index + 3}`,
      };
    }),
    {
      sequence: input.ports.length + 2,
      port: input.arrivalPort,
      arrivesAt: `${returnDate}T12:00:00.000Z`,
      departsAt: null,
      dayLabel: "Disembarkation",
    },
  ];

  return {
    id: input.id,
    provider: "mock",
    supplierSailingId: input.supplierSailingId,
    cruiseLine: { id: input.cruiseLineId, name: input.cruiseLineName },
    ship: { id: input.shipId, name: input.shipName },
    departurePort: input.departurePort,
    arrivalPort: input.arrivalPort,
    departureDate: input.departureDate,
    returnDate,
    nights: input.nights,
    destinationNames: input.destinations,
    itinerary,
    leadFare: {
      fareCode: "MOCK-LEAD",
      fareName: "Development lead fare",
      amount: { amountCents: input.leadFareCents, currency: "USD" },
      taxesAndFees: { amountCents: 18_900, currency: "USD" },
      deposit: { amountCents: 50_000, currency: "USD" },
      taxesIncluded: false,
      refundable: true,
      promotionNames: ["Synthetic inventory — not for sale"],
    },
    cabinCategories: [
      {
        id: "mock_interior",
        code: "IN",
        name: "Interior",
        type: "interior",
        maximumOccupancy: 4,
        startingFare: {
          amountCents: input.leadFareCents,
          currency: "USD",
        },
      },
      {
        id: "mock_oceanview",
        code: "OV",
        name: "Ocean View",
        type: "oceanview",
        maximumOccupancy: 4,
        startingFare: {
          amountCents: input.leadFareCents + 20_000,
          currency: "USD",
        },
      },
      {
        id: "mock_balcony",
        code: "BA",
        name: "Balcony",
        type: "balcony",
        maximumOccupancy: 4,
        startingFare: {
          amountCents: input.leadFareCents + 40_000,
          currency: "USD",
        },
      },
    ],
    lastVerifiedAt: input.verifiedAt,
    liveVerified: false,
  };
}

function defaultSearchRequest(): CruiseSearchRequest {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 30);
  const departureDateFrom = start.toISOString().slice(0, 10);
  return {
    departureDateFrom,
    departureDateTo: addDays(departureDateFrom, 30),
    adults: 2,
    childAges: [],
    currency: "USD",
    limit: 30,
  };
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function digest(parts: string[]) {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

function normalize(value: string) {
  return value.replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

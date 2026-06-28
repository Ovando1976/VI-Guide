export type TaxiIsland = "stt" | "stj" | "stx" | "wat";

export type TaxiFareStatus = "verified" | "review";

export type TaxiZone = {
  id: string;
  name: string;
  island: TaxiIsland;
  estateNames: string[];
  placeNames: string[];
  aliases: string[];
};

export type TaxiFareRule = {
  id: string;
  island: TaxiIsland;
  fromZoneId: string;
  toZoneId: string;
  baseFare: number;
  extraPassengerFare?: number;
  luggageFee?: number;
  source: "official_tariff" | "manual_review";
  status: TaxiFareStatus;
  notes?: string;
};

export type TaxiQuoteInput = {
  island: TaxiIsland;
  pickupName: string;
  dropoffName: string;
  passengers: number;
  luggage: number;
};

export type TaxiQuote = {
  island: TaxiIsland;
  pickupZoneId: string;
  dropoffZoneId: string;
  baseFare: number;
  extraPassengerTotal: number;
  luggageTotal: number;
  total: number;
  status: TaxiFareStatus;
  ruleId?: string;
  notes?: string;
};
// src/lib/parcels/postalCodes.ts

export const ESTATE_POSTAL_CODES: Record<string, string> = {
  // St. Thomas
  "STT:TUTU": "00802",
  "STT:SMITH BAY": "00802",
  "STT:RED HOOK": "00802",
  "STT:CHARLOTTE AMALIE": "00801",
  "STT:FRENCHTOWN": "00802",
  "STT:HAVENSIGHT": "00802",

  // St. John
  "STJ:CRUZ BAY": "00830",
  "STJ:CORAL BAY": "00830",

  // St. Croix
  "STX:CHRISTIANSTED": "00820",
  "STX:FREDERIKSTED": "00840",
  "STX:KINGSHILL": "00850",
};

export function getPostalCode(island: string, estateName?: string): string | undefined {
  if (!estateName) return undefined;

  const key = `${island}:${estateName.toUpperCase().trim()}`;
  return ESTATE_POSTAL_CODES[key];
}
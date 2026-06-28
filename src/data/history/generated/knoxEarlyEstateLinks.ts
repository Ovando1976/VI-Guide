export type EarlyEstateLinkConfidence =
  | "confirmed"
  | "probable"
  | "unknown";

export type KnoxEarlyEstateLink = {
  id: string;
  colonistName: string;
  colonistEntityId?: string;
  year: number;
  island: "st_thomas";
  originalEstateName?: string;
  modernEstateName?: string;
  historicalAliases?: string[];
  linkType:
    | "deed_grantee"
    | "boundary_reference"
    | "appendix_estate_holder"
    | "estate_name_in_appendix";
  confidence: EarlyEstateLinkConfidence;
  evidence: string;
  sourceRecordId: string;
  sourcePages: string;
};

export const knoxEarlyEstateLinks: KnoxEarlyEstateLink[] = [
  {
    id: "early-estate-link-jorgen-iversen-doppels-1678",
    colonistName: "Jørgen Iversen",
    colonistEntityId: "person-jorgen-iversen",
    year: 1678,
    island: "st_thomas",
    originalEstateName: "Doppels",
    modernEstateName: undefined,
    linkType: "deed_grantee",
    confidence: "confirmed",
    evidence:
      "Knox records a 1678 deed granting Governor Jørgen Iversen a piece of ground called Doppels.",
    sourceRecordId: "knox-stt-1678-doppels-estate-grant",
    sourcePages: "52–53",
  },
  {
    id: "early-estate-link-jan-cramues-plantation-1678",
    colonistName: "Jan Cramues",
    colonistEntityId: "person-jan-cramues",
    year: 1678,
    island: "st_thomas",
    originalEstateName: "Jan Cramues' plantation",
    modernEstateName: "Brewers Bay",
    historicalAliases: [
      "Baye de Jean Krameur",
      "Jan Kramers Bay",
      "Ian Kramer Bay",
      "John Brewer Bay",
      "John Brewer's Bay",
      "John Brucebay",
      "J. Bruce Estate"
    ],
    linkType: "boundary_reference",
    confidence: "probable",
    evidence:
      "Knox's Doppels deed summary references Jan Cramues' plantation as a boundary.",
    sourceRecordId: "knox-stt-1678-doppels-estate-grant",
    sourcePages: "52–53",
  },
  {
    id: "early-estate-link-jesper-jansen-plantation-1678",
    colonistName: "Jesper Jansen",
    colonistEntityId: "person-jesper-jansen",
    year: 1678,
    island: "st_thomas",
    originalEstateName: "Jesper/Jeshan Jansen's plantation",
  modernEstateName: "Jansen",
    linkType: "boundary_reference",
    confidence: "confirmed",
    evidence:
      "Knox's Doppels deed summary references Jesper/Jeshan Jansen's plantation as a boundary.",
    sourceRecordId: "knox-stt-1678-doppels-estate-grant",
    sourcePages: "52–53",
  },
  {
    id: "early-estate-link-domine-oliandus-estate-1688",
    colonistName: "Domine Oliandus",
    colonistEntityId: "person-domine-oliandus",
    year: 1688,
    island: "st_thomas",
    originalEstateName: "Domine Oliandus estate",
    modernEstateName: undefined,
    linkType: "deed_grantee",
    confidence: "confirmed",
    evidence:
      "Knox states that one 1688 deed stands in the name of Domine Oliandus.",
    sourceRecordId: "knox-ocr-143-152-007-1688-when-they-returned-to-the-island-now-that-it-was-in-possession-of-t",
    sourcePages: "145",
  },
  {
    id: "early-estate-link-parsons-estate-1678",
    colonistName: "Parsons Estate",
    colonistEntityId: "person-parsons-estate",
    year: 1678,
    island: "st_thomas",
    originalEstateName: "Parsons Estate",
    modernEstateName: undefined,
    linkType: "estate_name_in_appendix",
    confidence: "confirmed",
    evidence:
      "Appendix A includes entry 19 as Parsons Estate among names entitled to estates.",
    sourceRecordId: "knox-ocr-253-262-006-1678-appendix-a-lists-st-thomas-colonists-and-estate-holders",
    sourcePages: "255",
  },
];

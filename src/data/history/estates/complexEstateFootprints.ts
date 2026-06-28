import type { EstateEvidenceItem } from "./estateEvidenceTypes";

export type ComplexEstateFootprint = {
  id: string;
  name: string;
  island: "st_thomas" | "st_john" | "st_croix";
  componentHistoricalNames: string[];
  relatedModernEstates: string[];
  knownPeople: string[];
  evidenceItemIds: string[];
  interpretation: string;
  confidence: EstateEvidenceItem["confidence"];
};

export const complexEstateFootprints: ComplexEstateFootprint[] = [
  {
    id: "complex-stj-annaberg-north-shore",
    name: "Annaberg Historic District / St. John north-shore plantation complex",
    island: "st_john",
    componentHistoricalNames: [
      "Annaberg",
      "Mary Point",
      "Betty's Hope",
      "Leinster Bay",
      "Brown Bay",
      "Smith Bay",
    ],
    relatedModernEstates: [
      "Annaberg Historic District",
      "Leinster Bay Estate",
      "Browns Bay Estate",
    ],
    knownPeople: [
      "Isaac Constantin",
      "Mads Larsen",
      "Salomon Zeeger Janzoon",
      "James E. Murphy",
    ],
    evidenceItemIds: ["evidence-annaberg-complex-001"],
    interpretation:
      "Annaberg should be modeled as a historical plantation complex with overlapping component landscapes rather than as a single one-to-one modern estate match.",
    confidence: "high",
  },
];

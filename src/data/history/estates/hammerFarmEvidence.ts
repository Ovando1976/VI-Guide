import type { EstateEvidenceItem } from "./estateEvidenceTypes";

export const hammerFarmEvidence: EstateEvidenceItem[] = [
  {
    id: "evidence-hammer-farm-archive-001",
    estateTargetId: "stj-hammer-farm",
    modernEstateName: "Hammer Farm",
    island: "st_john",
    evidenceType: "owner",
    claim:
      "The Geographic Dictionary places Hammer Farm in Cruz Bay Quarter, St. John, near Adrian, Peter Peak, Cinnamon Bay, Catherineberg, and Jochumdahl, and records Reichel’s variant name Herman Farm.",
    people: [],
    historicalNames: ["Hammer Farm", "Hammerfarm", "Hammer Farm Estate", "Herman Farm", "Catherineberg", "Jochumdahl"],
    modernMatches: ["Hammer Farm"],
    sourceType: "geographic_dictionary",
    sourceLabel:
      "Geographic Dictionary of the Virgin Islands, Hammer Farm entry",
    confidence: "possible",
    notes:
      "This establishes location and aliases, but not an original owner. Keep out of originalEstateOwnerMatches until deed, tax, map, or archive owner evidence is found.",
  },
];

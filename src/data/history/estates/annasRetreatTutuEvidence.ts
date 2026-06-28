import type { EstateEvidenceItem } from "./estateEvidenceTypes";

export const annasRetreatTutuEvidence: EstateEvidenceItem[] = [
  {
    id: "evidence-annas-retreat-tutu-geo-dict-001",
    estateTargetId: "stt-annas-retreat",
    modernEstateName: "Anna's Retreat",
    island: "st_thomas",
    evidenceType: "alias",
    claim:
      "The Geographic Dictionary identifies Anna's Retreat as the same estate as Tutu and records the Spanish form Hacienda del Retiro de Ana.",
    people: [],
    historicalNames: [
      "Anna's Retreat",
      "Annas Retreat",
      "Tutu Estate",
      "Anna's Retreat oder Tutu",
      "Hacienda del Retiro de Ana",
    ],
    modernMatches: ["Anna's Retreat", "Tutu"],
    sourceType: "geographic_dictionary",
    sourceLabel:
      "Geographic Dictionary of the Virgin Islands, Anna's Retreat entry",
    confidence: "possible",
    notes:
      "This proves the Anna's Retreat/Tutu alias relationship but does not yet identify Anna. Next research must test de Windt family records, Danish land-tax rolls, estate deeds, cadastral maps, Moravian records, and NARA RG 55.",
  },
  {
    id: "evidence-annas-retreat-de-windt-question-001",
    estateTargetId: "stt-annas-retreat",
    modernEstateName: "Anna's Retreat",
    island: "st_thomas",
    evidenceType: "research_question",
    claim:
      "Determine whether Anna refers to an identifiable person: owner, spouse, family member, or earlier naming tradition connected to Tutu or the de Windt family.",
    people: ["Anna de Windt"],
    historicalNames: ["Anna de Wints Bay", "Reine Anne", "Holongo Bay"],
    modernMatches: [],
    sourceType: "geographic_dictionary",
    sourceLabel:
      "Geographic Dictionary nearby Anna de Wints Bay entry; relationship to Anna's Retreat not yet proven",
    confidence: "unresolved",
    notes:
      "Do not merge Anna de Wints Bay with Anna's Retreat without primary evidence. Treat this as a clue trail only.",
  },
];

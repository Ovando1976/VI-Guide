import type { ProbateResearchTarget } from "./probateTypes";

export const annasRetreatProbateTargets: ProbateResearchTarget[] = [
  {
    id: "probate-stt-annas-retreat-dewindt-pogy-1780-1810",
    familyNames: ["de Windt", "Pogy", "Pogh", "van Beverhoudt", "Schifter"],
    personNames: [
      "Octavius Pogy",
      "Mariette Henriette Pogy",
      "Christian Goldmann",
      "Erasmus Frederick Schifter",
      "Anna de Windt",
      "Anna van Beverhoudt"
    ],
    dateRange: "1780-1810",
    island: "st_thomas",
    office: "St. Thomas Town Bailiff / Byfoged",
    recordTypes: [
      "skifte",
      "distribution",
      "registration",
      "valuation",
      "guardianship",
      "debt_settlement"
    ],
    estates: ["Tutu", "Tabor", "Harmonie", "Anna's Retreat"],
    researchGoal:
      "Find probate, valuation, guardianship, inheritance, or debt-settlement records showing how Tutu, Tabor, and Harmonie passed through de Windt, van Beverhoudt, Schifter, and Pogy family networks before the 1813 Pogy-to-Schifter deed.",
    expectedEvidence: [
      "A woman named Anna receiving, inheriting, bringing, or retaining a share of Tutu, Tabor, or Harmonie",
      "Fractional estate shares consolidated by Octavius Pogy",
      "Guardianship records for Mariette Henriette Pogy",
      "Valuation records naming Tutu, Tabor, Harmonie, or Anna's Retreat",
      "Debt settlements tying de Windt or van Beverhoudt heirs to Pogy or Schifter"
    ],
    confidence: "possible",
    notes:
      "This is the highest-priority archival path for identifying the Anna behind Anna's Retreat. Do not treat Anna de Windt or Anna van Beverhoudt as confirmed until a probate/deed/tax record ties her directly to the estate complex."
  }
];

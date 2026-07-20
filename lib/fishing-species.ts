import speciesData from "@/data/fishing/species-2024.json";

export type FishingWater = "territorial" | "federal";
export type FishingDistrict = "stt-stj" | "stx";

export type SeasonalClosure = {
  start: string;
  end: string;
  waters: FishingWater[];
  districts: FishingDistrict[];
  label: string;
};

export type FishingSpecies = {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  glyph: string;
  imageUrl?: string;
  handbookPages: number[];
  summary: string;
  alwaysProhibited?: boolean;
  requiresDirectVerification?: boolean;
  prohibitedWaters?: FishingWater[];
  closures: SeasonalClosure[];
  sizeRules: string[];
  notes: string[];
  verificationAgency: string;
};

export type SpeciesAssessment = {
  status: "prohibited" | "closed" | "verify" | "no-closure-matched";
  label: string;
  explanation: string;
  matchedClosure: SeasonalClosure | null;
};

export const fishingSpecies = speciesData as FishingSpecies[];

function monthDay(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.valueOf())) return null;
  return (parsed.getMonth() + 1) * 100 + parsed.getDate();
}

function ruleDate(value: string) {
  const [month, day] = value.split("-").map(Number);
  return month * 100 + day;
}

function fallsWithin(date: number, start: string, end: string) {
  const from = ruleDate(start);
  const through = ruleDate(end);
  return from <= through ? date >= from && date <= through : date >= from || date <= through;
}

export function assessSpecies(
  species: FishingSpecies,
  options: { date: string; water: FishingWater; district: FishingDistrict },
): SpeciesAssessment {
  if (species.requiresDirectVerification) {
    return {
      status: "verify",
      label: "Direct verification required",
      explanation: `The 2024 handbook presentation is not sufficient to resolve this species confidently. Confirm with ${species.verificationAgency}.`,
      matchedClosure: null,
    };
  }

  const prohibitionApplies = species.alwaysProhibited &&
    (!species.prohibitedWaters?.length || species.prohibitedWaters.includes(options.water));
  if (prohibitionApplies) {
    return {
      status: "prohibited",
      label: "No harvest in handbook",
      explanation: `The 2024 handbook summarizes a no-harvest rule for this context. Confirm the current rule with ${species.verificationAgency}.`,
      matchedClosure: null,
    };
  }

  const date = monthDay(options.date);
  const closure = date === null ? null : species.closures.find((rule) =>
    rule.waters.includes(options.water) &&
    rule.districts.includes(options.district) &&
    fallsWithin(date, rule.start, rule.end),
  ) ?? null;

  if (closure) {
    return {
      status: "closed",
      label: "Closed in handbook",
      explanation: `${closure.label}. Confirm current closure status with ${species.verificationAgency}.`,
      matchedClosure: closure,
    };
  }

  return {
    status: "no-closure-matched",
    label: "No 2024 closure matched",
    explanation: `This is not a finding that harvest is legal. Size, bag, gear, permit, protected-area, emergency, and newer rules may still apply; confirm with ${species.verificationAgency}.`,
    matchedClosure: null,
  };
}

export function searchFishingSpecies(query: string, limit = 8) {
  const tokens = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 2);
  return fishingSpecies
    .map((species) => {
      const text = `${species.name} ${species.scientificName} ${species.family} ${species.summary} ${species.notes.join(" ")}`.toLowerCase();
      const score = tokens.reduce((total, token) => total + (text.includes(token) ? 1 : 0), 0);
      return { species, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.species.name.localeCompare(b.species.name))
    .slice(0, limit)
    .map(({ species }) => species);
}

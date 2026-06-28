export type SourceFactType =
  | "event"
  | "person"
  | "place"
  | "source_author"
  | "settlement"
  | "migration"
  | "agriculture";

export type HistoricalSourceFact = {
  id: string;
  type: SourceFactType;
  title: string;
  year?: number;
  yearRange?: string;
  places: string[];
  people: string[];
  summary: string;
  significance: string;
  source: {
    book: string;
    page: string;
    section?: string;
  };
};

export const historicalAccountStThomasFacts: HistoricalSourceFact[] = [
  {
    id: "hst-stt-before-1647-earlier-settlement",
    type: "settlement",
    title: "Evidence of Settlement on St. Thomas before 1647",
    yearRange: "before 1647",
    places: ["St. Thomas"],
    people: [],
    summary:
      "The account states that explorers found evidence that a settlement had once existed on St. Thomas, including cultivated fruit trees such as oranges, lemons, limes, and bananas.",
    significance:
      "This suggests St. Thomas had human settlement and agriculture before the better-documented Danish colonial period.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      page: "44",
      section: "Notices of the Island by Historians Before Danish Settlement",
    },
  },
  {
    id: "hst-stt-1645-dutch-from-st-croix",
    type: "migration",
    title: "Possible Dutch Migration from St. Croix to St. Thomas",
    year: 1645,
    places: ["St. Croix", "St. Thomas"],
    people: ["Oldendorp"],
    summary:
      "The book discusses the possibility that Dutch settlers driven from St. Croix by the English may have gone to St. Thomas.",
    significance:
      "This is an early possible link between St. Croix and St. Thomas settlement history.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      page: "44",
    },
  },
  {
    id: "hst-stt-1657-rochefort-virgin-islands",
    type: "source_author",
    title: "Rochefort Describes the Virgin Islands",
    year: 1657,
    places: ["Virgin Islands"],
    people: ["Rochefort"],
    summary:
      "Rochefort described the Virgin Islands, mentioning abundant fish in the channels and bays and many land and sea birds.",
    significance:
      "This gives an early European description of the natural resources and maritime environment of the Virgin Islands.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      page: "44",
    },
  },
  {
    id: "hst-stt-1666-holberg-erric-burial",
    type: "event",
    title: "Shipmaster Erric Buried on St. Thomas",
    year: 1666,
    places: ["St. Thomas"],
    people: ["Ludvig Holberg", "Erric"],
    summary:
      "Ludvig Holberg records that in the time of Frederick III, a shipmaster named Erric from the West Indies died and was buried on St. Thomas in 1666.",
    significance:
      "This is one of the earliest named-person references tied directly to St. Thomas in the account.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      page: "45",
    },
  },
  {
    id: "hst-stt-1666-host-dutch-refugees",
    type: "settlement",
    title: "Høst’s Account of Dutch Refugees on St. Thomas",
    year: 1666,
    places: ["St. Thomas"],
    people: ["Høst"],
    summary:
      "Høst conjectured that St. Thomas was inhabited by Hollanders and Caribs in 1666, though the book questions the claim about Caribs and considers Dutch occupation more plausible.",
    significance:
      "This provides a debated but important early settlement claim for St. Thomas before formal Danish colonization.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      page: "45",
    },
  },
  {
    id: "hst-stt-1667-english-capture-abandonment",
    type: "event",
    title: "Abandonment of St. Thomas after English Capture of Dutch Islands",
    year: 1667,
    places: ["St. Thomas", "St. Eustatius", "St. Martin"],
    people: [],
    summary:
      "After the English took St. Eustatius and St. Martin from the Dutch in 1667, St. Thomas was reportedly abandoned in favor of those more fertile islands.",
    significance:
      "The account states St. Thomas remained uninhabited until 1671, making this a key moment in the island’s early settlement timeline.",
    source: {
      book: "A Historical Account of St. Thomas, W.I.",
      page: "45",
    },
  },
];
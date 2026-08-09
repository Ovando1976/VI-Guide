export type CoverageSource = {
  id: string;
  label: string;
  url: string;
  inventory: "activities" | "events" | "car-rentals";
  scope: string;
  authority: "government" | "destination" | "operator" | "directory";
  reviewCadenceDays: number;
};

export const MARKET_COVERAGE_SOURCES: readonly CoverageSource[] = [
  {
    id: "visit-usvi-events",
    label: "Visit USVI Events & Festivals",
    url: "https://www.visitusvi.com/carnivals-festivals/",
    inventory: "events",
    scope: "Territory-wide destination events",
    authority: "destination",
    reviewCadenceDays: 7,
  },
  {
    id: "visit-usvi-activities",
    label: "Visit USVI Things to Do",
    url: "https://www.visitusvi.com/explore/things-to-do/",
    inventory: "activities",
    scope: "Territory-wide activities and tourism listings",
    authority: "destination",
    reviewCadenceDays: 30,
  },
  {
    id: "visit-usvi-water",
    label: "Visit USVI Water Activities",
    url: "https://www.visitusvi.com/explore/water-activities/",
    inventory: "activities",
    scope: "Water activity categories and listed operators",
    authority: "destination",
    reviewCadenceDays: 30,
  },
  {
    id: "nps-buck-island",
    label: "National Park Service Buck Island operators",
    url: "https://www.nps.gov/buis/planyourvisit/directions.htm",
    inventory: "activities",
    scope: "Authorized Buck Island Reef National Monument operators",
    authority: "government",
    reviewCadenceDays: 30,
  },
  {
    id: "nps-viis",
    label: "Virgin Islands National Park",
    url: "https://www.nps.gov/viis/planyourvisit/calendar.htm",
    inventory: "events",
    scope: "St. John ranger programs and park events",
    authority: "government",
    reviewCadenceDays: 7,
  },
  {
    id: "gotostcroix-events",
    label: "GoToStCroix Events",
    url: "https://www.gotostcroix.com/events/",
    inventory: "events",
    scope: "St. Croix community and visitor events",
    authority: "directory",
    reviewCadenceDays: 7,
  },
  {
    id: "gotostcroix-rentals",
    label: "GoToStCroix Car Rentals",
    url: "https://www.gotostcroix.com/getting-around/car-rentals/",
    inventory: "car-rentals",
    scope: "St. Croix rental operators",
    authority: "directory",
    reviewCadenceDays: 30,
  },
  {
    id: "vinow-rentals",
    label: "VInow Car Rentals",
    url: "https://www.vinow.com/stthomas/getting_around_stt/driving_stt/",
    inventory: "car-rentals",
    scope: "St. Thomas rental operators",
    authority: "directory",
    reviewCadenceDays: 30,
  },
  {
    id: "stjohn-rentals",
    label: "St. John rental company directory",
    url: "https://islandeguide.com/article/st-john-car-rental-companies-usvi.html",
    inventory: "car-rentals",
    scope: "St. John local rental operators",
    authority: "directory",
    reviewCadenceDays: 30,
  },
];

export const MARKET_COVERAGE_POLICY = {
  verifiedFreshnessDays: 45,
  eventReviewCadenceDays: 7,
  operatorReviewCadenceDays: 30,
  requiredIslands: ["stt", "stj", "stx"] as const,
  requiredActivityCategories: [
    "boat-charter",
    "snorkeling",
    "scuba",
    "kayak",
    "hiking",
    "wildlife",
    "zipline",
    "parasailing",
    "sailing",
  ] as const,
  minimumActivityOperatorsPerIsland: 3,
  minimumRentalOperatorsPerIsland: 3,
} as const;

export const BUSINESS_COVERAGE_SUBMISSION_HREF =
  "/merchant?intent=submit-listing&catalog=activities-events-rentals";

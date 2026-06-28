export const knoxExtractedEntities = {
  people: [],
  places: [],
  organizations: [],
};

export const knoxEntityExtractionStatus = {
  status: "experimental-disabled",
  reason:
    "Initial regex extraction over-detected capitalized phrases as people. Knox OCR records remain active; entity extraction will be rebuilt with stricter rules.",
};

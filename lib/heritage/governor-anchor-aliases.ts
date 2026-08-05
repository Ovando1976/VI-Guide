const GOVERNOR_ANCHOR_ALIASES: Readonly<Record<string, string>> = {
  "morris-fidanque-de-castro": "morris-f-de-castro",
  "cyril-emmanuel-king-acting": "cyril-e-king-acting",
  "cyril-emmanuel-king-elected": "cyril-e-king-elected",
  "juan-francisco-luis": "juan-f-luis",
  "roy-lester-schneider": "roy-l-schneider",
};

export function canonicalGovernorAnchorId(id: string) {
  return GOVERNOR_ANCHOR_ALIASES[id] ?? id;
}

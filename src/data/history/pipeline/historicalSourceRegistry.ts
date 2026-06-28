export type HistoricalSourceKind =
  | "geographic_dictionary"
  | "knox"
  | "danish_archive"
  | "historic_map"
  | "matrical"
  | "deed"
  | "tax_roll";

export type HistoricalSourceRegistryItem = {
  id: string;
  kind: HistoricalSourceKind;
  title: string;
  authority: string;
  notes?: string;
};

export const historicalSourceRegistry: HistoricalSourceRegistryItem[] = [
  {
    id: "source-geographic-dictionary-usvi",
    kind: "geographic_dictionary",
    title: "Geographic Dictionary of the Virgin Islands",
    authority: "U.S. Coast and Geodetic Survey / Geographic Dictionary",
  },
  {
    id: "source-knox-historical-account-st-thomas",
    kind: "knox",
    title: "A Historical Account of St. Thomas, W.I.",
    authority: "John P. Knox",
  },
  {
    id: "source-danish-west-indies-archives",
    kind: "danish_archive",
    title: "Danish West Indies Archives",
    authority: "Rigsarkivet / Danish National Archives",
  },
  {
    id: "source-historical-maps",
    kind: "historic_map",
    title: "Historic Maps of the Danish West Indies",
    authority: "Mellin, Oldendorp, Hornbeck, Dewitz, Danish survey maps",
  },
];

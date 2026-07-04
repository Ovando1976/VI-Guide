export const HISTORY_ROUTES = {
  home: "/history",
  knowledge: "/history",
  records: "/history?view=records",
  timeline: "/history?view=timeline",
  governors: "/history?view=governors",
  archives: "/history?view=archives",
  maps: "/history?view=maps",
  sites: "/history?view=sites",
  dictionary: "/history?view=dictionary",
  gallery: "/history?view=gallery",
} as const;

export const HISTORY_KNOWLEDGE_TAB_ROUTES = [
  {
    id: "records",
    label: "Records",
    to: HISTORY_ROUTES.records,
  },
  {
    id: "timeline",
    label: "Timeline",
    to: HISTORY_ROUTES.timeline,
  },
  {
    id: "governors",
    label: "Governors",
    to: HISTORY_ROUTES.governors,
  },
] as const;

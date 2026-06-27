import type { EstateHistoryEvent } from "./historyEventTypes";

export const moravianBatchEvents: EstateHistoryEvent[] = [
  {
    id: "event:moravian:krum-bay:wi101-22",
    estateCanonicalId: "stt_krum_bay",
    estateName: "Krum Bay",
    island: "st_thomas",
    type: "source_note",
    label: "Moravian Archives W.I.101.22 extraction opened for Krum Bay",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "Moravian Archives",
        entry: "W.I.101.22",
        series: "St. Thomas estate papers",
        note: "Recover ownership, mission activity, boundaries, and historical references for Krum Bay.",
      },
    ],
    notes: [
      "Initial Moravian extraction batch for Krum Bay.",
    ],
  },

  {
    id: "event:moravian:new-herrnhut:wi102-7-8",
    estateCanonicalId: "stt_new_herrnhut",
    estateName: "New Herrnhut",
    island: "st_thomas",
    type: "survey",
    label: "Moravian Archives W.I.102.7-8 extraction opened for New Herrnhut",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "Moravian Archives",
        entry: "W.I.102.7-8",
        series: "St. Thomas estate papers",
        note: "Recover boundary, survey, Moravian institutional, and estate layout evidence for New Herrnhut.",
      },
    ],
    notes: [
      "Second Moravian extraction batch focused on New Herrnhut estate boundaries and survey relationships.",
    ],
  },

  {
    id: "event:moravian:nisky:wi102-15-17-18-21-23",
    estateCanonicalId: "stt_nisky",
    estateName: "Nisky",
    island: "st_thomas",
    type: "source_note",
    label: "Moravian Archives W.I.102.15/17/18/21/23 extraction opened for Nisky",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "Moravian Archives",
        entry: "W.I.102.15/17/18/21/23",
        series: "St. Thomas estate papers",
        note: "Recover Nisky ownership, boundary, parcel, and Moravian institutional evidence.",
      },
    ],
    notes: [
      "Third Moravian extraction batch focused on Nisky ownership, boundaries, and parcel evidence.",
    ],
  },

  {
    id: "event:moravian:savan:wi101-10",
    estateCanonicalId: "stt_savan",
    estateName: "Savan",
    island: "st_thomas",
    type: "source_note",
    label: "Moravian Archives W.I.101.10 extraction opened for Savan",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "Moravian Archives",
        entry: "W.I.101.10",
        series: "St. Thomas estate papers",
        note: "Recover Savan historical references, ownership, and Moravian institutional context.",
      },
    ],
    notes: [
      "Fourth Moravian extraction batch focused on Savan historical references and institutional context.",
    ],
  },
];

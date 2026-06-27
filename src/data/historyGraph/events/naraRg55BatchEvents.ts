import type { EstateHistoryEvent } from "./historyEventTypes";

export const naraRg55BatchEvents: EstateHistoryEvent[] = [
  {
    id: "event:nara-rg55:annas-retreat:entry-838:mortgage-search",
    estateCanonicalId: "stt_annas_retreat_tutu",
    estateName: "Anna's Retreat",
    island: "st_thomas",
    type: "mortgage",
    label: "NARA RG 55 Entry 838 mortgage extraction opened for Anna's Retreat / Tutu complex",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "NARA RG 55",
        entry: "838",
        box: "2006",
        series: "Register of Mortgages on St. Thomas Plantations, 1796-1849",
        note: "Search for Anna's Retreat, Tutu, Tabor, Harmoni, Pogy, and Schifter.",
      },
    ],
    notes: [
      "Priority hinge record for proving or disproving the pre-1813 Pogy-to-Schifter chain.",
    ],
  },
  {
    id: "event:nara-rg55:annas-retreat:entry-840:east-end-mortgage-search",
    estateCanonicalId: "stt_annas_retreat_tutu",
    estateName: "Anna's Retreat",
    island: "st_thomas",
    type: "mortgage",
    label: "NARA RG 55 Entry 840 East End mortgage extraction opened for Anna's Retreat / Tutu chain",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "NARA RG 55",
        entry: "840",
        box: "2007",
        series: "Register of Mortgages in the East End Quarter, 1808-1852",
        note: "Search East End mortgage references for Tutu, Tabor, Harmoni, and Anna's Retreat.",
      },
    ],
    notes: [
      "Second priority mortgage register for confirming the East End ownership and alias chain.",
    ],
  },
  {
    id: "event:nara-rg55:annas-retreat:entry-842:court-record-search",
    estateCanonicalId: "stt_annas_retreat_tutu",
    estateName: "Anna's Retreat",
    island: "st_thomas",
    type: "source_note",
    label: "NARA RG 55 Entry 842 court-record extraction opened for Anna's Retreat / Tutu chain",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "NARA RG 55",
        entry: "842",
        box: "2008",
        series: "Copies of Documents Recorded by the Court, 1807-1810",
        note: "Search court-record copies before the 1813 Pogy-to-Schifter ownership hinge.",
      },
    ],
    notes: [
      "Court-copy batch may confirm party names, estate aliases, and transaction timing before the mortgage chain.",
    ],
  },
  {
    id: "event:nara-rg55:new-herrnhut:entry-798:surveyor-work-papers",
    estateCanonicalId: "stt_new_herrnhut",
    estateName: "New Herrnhut",
    island: "st_thomas",
    type: "survey",
    label: "NARA RG 55 Entry 798 surveyor work-paper extraction opened for New Herrnhut",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "NARA RG 55",
        entry: "798",
        box: "1952-1953",
        series: "Surveyor work papers on St. Thomas estates, 1820-1911",
        note: "Recover survey evidence for New Herrnhut boundaries and Moravian estate layout.",
      },
    ],
    notes: [
      "Survey evidence should help connect New Herrnhut boundaries, acreage, neighboring estates, and map references.",
    ],
  },
  {
    id: "event:nara-rg55:nisky:entry-798:surveyor-work-papers",
    estateCanonicalId: "stt_nisky",
    estateName: "Nisky",
    island: "st_thomas",
    type: "survey",
    label: "NARA RG 55 Entry 798 surveyor work-paper extraction opened for Nisky",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "NARA RG 55",
        entry: "798",
        box: "1952-1953",
        series: "Surveyor work papers on St. Thomas estates, 1820-1911",
        note: "Recover survey evidence for Nisky parcelization and boundary links to New Herrnhut.",
      },
    ],
    notes: [
      "Survey evidence should help connect Nisky parcelization, acreage, boundaries, and map references.",
    ],
  },
];

import type { EstateHistoryEvent } from "./historyEventTypes";

export const rigsarkivetBatchEvents: EstateHistoryEvent[] = [
  {
    id: "event:lameshur:rigsarkivet:extraction-note",
    estateCanonicalId: "stj_lameshur",
    estateName: "Lameshur",
    island: "st_john",
    type: "source_note",
    label: "Rigsarkivet extraction completed for Lameshur",
    description: "Extraction target completed; owner chronology still requires normalization into owner events.",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "Rigsarkivet",
        series: "St. John matrikel and survey records",
        note: "Target marked extracted in Rigsarkivet workflow.",
      },
    ],
  },
  {
    id: "event:catherineberg-hammer-farm:rigsarkivet:alias-review",
    estateCanonicalId: "stj_catherineberg_hammer_farm",
    estateName: "Catherineberg / Jockumsdahl / Hammer Farm",
    island: "st_john",
    type: "alias",
    label: "Alias chain requires verification",
    description: "Cathrineberg, Catherineberg, Jockumsdahl, Herman Farm, and Hammer Farm should be reviewed as time-bounded aliases.",
    evidenceStatus: "probable",
    sourceRefs: [
      {
        archive: "Rigsarkivet",
        series: "Matrikel for St. Thomas og St. Jan",
      },
    ],
  },
  {
    id: "event:cinnamon-bay:rigsarkivet:owner-chain-review",
    estateCanonicalId: "stj_cinnamon_bay",
    estateName: "Cinnamon Bay",
    island: "st_john",
    type: "source_note",
    label: "Cinnamon Bay land-list/matrikel extraction completed",
    description: "Use extracted Rigsarkivet evidence to extend owner chain beyond early known records.",
    evidenceStatus: "probable",
    sourceRefs: [
      {
        archive: "Rigsarkivet",
        series: "Land lists / matrikel",
      },
    ],
  },
  {
    id: "event:mary-point:rigsarkivet:owner-chain-review",
    estateCanonicalId: "stj_mary_point",
    estateName: "Mary Point",
    island: "st_john",
    type: "source_note",
    label: "Mary Point matrikel extraction completed",
    description: "Use extracted evidence to confirm Kragh, Berg, and Francis-era owner sequence.",
    evidenceStatus: "probable",
    sourceRefs: [
      {
        archive: "Rigsarkivet",
        series: "Matrikel for St. Thomas og St. Jan",
      },
    ],
  },
  {
    id: "event:perforce:rigsarkivet:matrikel-continuation",
    estateCanonicalId: "stj_perforce",
    estateName: "Perforce",
    island: "st_john",
    type: "owner",
    label: "Perforce matrikel continuation target completed",
    description: "Known owner snapshot can now be continued through matrikel sequence after normalization.",
    personOrInstitution: "Mrs. J. E. Vetter",
    role: "owner",
    dateFrom: "1841",
    evidenceStatus: "confirmed",
    sourceRefs: [
      {
        archive: "Rigsarkivet",
        series: "Matrikel continuation",
      },
    ],
  },
];

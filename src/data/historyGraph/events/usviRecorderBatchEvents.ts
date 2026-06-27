import type { EstateHistoryEvent } from "./historyEventTypes";

export const usviRecorderBatchEvents: EstateHistoryEvent[] = [
  {
    id: "event:usvi-recorder:carolina:deed-file",
    estateCanonicalId: "stj_carolina",
    estateName: "Carolina",
    island: "st_john",
    type: "source_note",
    label: "USVI Recorder deed-file extraction opened for Estate Carolina",
    evidenceStatus: "needs_archival_pull",
    sourceRefs: [
      {
        archive: "USVI Recorder",
        series: "Estate Carolina deed file cited by NPS",
        note: "Recover deed-chain evidence for Estate Carolina and connect Recorder evidence to the estate graph.",
      },
    ],
    notes: [
      "USVI Recorder batch focused on Carolina deed-chain references cited by NPS.",
    ],
  },
];

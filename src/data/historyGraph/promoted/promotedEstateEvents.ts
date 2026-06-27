import { rigsarkivetBatchEvents } from "../events/rigsarkivetBatchEvents";
import { naraRg55BatchEvents } from "../events/naraRg55BatchEvents";
import { moravianBatchEvents } from "../events/moravianBatchEvents";
import { usviRecorderBatchEvents } from "../events/usviRecorderBatchEvents";

export const promotedEstateEvents = [
  ...rigsarkivetBatchEvents,
  ...naraRg55BatchEvents,
  ...moravianBatchEvents,
  ...usviRecorderBatchEvents,
];

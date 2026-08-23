export {
  CAR_BARGE_ROUTES,
  FERRY_PORT_COORDINATES,
  FERRY_PORTS,
  FERRY_ROUTES,
  FERRY_SCHEDULE_SOURCES,
  ferryRoutesFrom,
  findFerryRoute,
  getDeparturesForWeekday,
  getNextFerryDeparture,
  isScheduleSuppressed,
} from "@/lib/ferry-planner-current";

export type {
  FerryMode,
  FerryPortId,
  FerryRoute,
  FerryScheduleSource,
  FerryScheduleStatus,
  NextFerryDeparture,
} from "@/lib/ferry-planner-current";

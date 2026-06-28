import type { BusinessOSData } from "../types";

import AppointmentCalendar from "./AppointmentCalendar";
import CustomerTimeline from "./CustomerTimeline";
import NotificationCenter from "./NotificationCenter";
import TaskManager from "./TaskManager";
import JobWorkspace from "./JobWorkspace";

type Props = {
  data: BusinessOSData;
  onRefresh?: () => void;
};

export default function BusinessOperationsCenter({
  data,
  onRefresh,
}: Props) {
  return (
    <section className="space-y-6">
      <JobWorkspace data={data} />
      <NotificationCenter
        data={data}
        onRefresh={onRefresh}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <TaskManager
          data={data}
          onRefresh={onRefresh}
        />

        <AppointmentCalendar
          data={data}
          onRefresh={onRefresh}
        />
      </div>

      <CustomerTimeline data={data} />
    </section>
  );
}
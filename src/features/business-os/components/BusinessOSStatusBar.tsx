import { CalendarDays, CheckSquare2, DollarSign, Mail, UsersRound } from "lucide-react";

import type { BusinessOSData } from "../types";

export default function BusinessOSStatusBar({ data }: { data: BusinessOSData }) {
  const openTasks = data.tasks.filter((task) => task.status === "open").length;

  const scheduledAppointments = data.appointments.filter(
    (appointment) =>
      appointment.status === "scheduled" || appointment.status === "confirmed",
  ).length;

  const collectedRevenue = data.payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <section className="border-b border-white/10 bg-slate-950/70 px-5 py-3 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-2 sm:grid-cols-5">
        <StatusItem icon={Mail} label="Leads" value={data.leads.length} />
        <StatusItem icon={UsersRound} label="Customers" value={data.customers.length} />
        <StatusItem icon={CheckSquare2} label="Open Tasks" value={openTasks} />
        <StatusItem icon={CalendarDays} label="Appointments" value={scheduledAppointments} />
        <StatusItem
          icon={DollarSign}
          label="Collected"
          value={`$${Math.round(collectedRevenue).toLocaleString()}`}
        />
      </div>
    </section>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/15 text-cyan-200">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-lg font-black text-white">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
          {label}
        </p>
      </div>
    </div>
  );
}
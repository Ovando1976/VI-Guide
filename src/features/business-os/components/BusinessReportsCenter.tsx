import { BarChart3, DollarSign, Mail, Target, UserRound } from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function BusinessReportsCenter({ data }: { data: BusinessOSData }) {
  const collected = data.payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const openLeads = data.leadStats.new + data.leadStats.contacted;
  const totalLeads = data.leads.length;
  const totalCustomers = data.customers.length;

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Business Reports"
        text="A clean operating summary of leads, revenue, conversion, and customer value."
        icon={BarChart3}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <ReportMetric icon={Mail} label="Leads" value={totalLeads} />
        <ReportMetric icon={Target} label="Open Leads" value={openLeads} />
        <ReportMetric icon={UserRound} label="Customers" value={totalCustomers} />
        <ReportMetric icon={DollarSign} label="Collected" value={`$${collected.toLocaleString()}`} />
        <ReportMetric icon={BarChart3} label="Win Rate" value={`${data.winRate}%`} />
      </div>
    </BusinessOSCard>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
      <Icon className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
    </div>
  );
}
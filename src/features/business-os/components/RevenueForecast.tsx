import {
  DollarSign,
  LineChart,
  Target,
  TrendingUp,
} from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

const DEFAULT_LEAD_VALUE = 85;

export default function RevenueForecast({
  data,
}: {
  data: BusinessOSData;
}) {
  const openLeads = data.leadStats.new + data.leadStats.contacted;

  const estimatedPipeline = data.estimates.reduce(
    (sum, estimate) => sum + estimate.total,
    0,
  );

  const invoicedRevenue = data.invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0,
  );

  const collectedRevenue = data.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const outstandingRevenue = Math.max(
    invoicedRevenue - collectedRevenue,
    0,
  );

  const conservative =
    collectedRevenue +
    data.leadStats.won * DEFAULT_LEAD_VALUE;

  const likely =
    collectedRevenue +
    estimatedPipeline * 0.60 +
    outstandingRevenue * 0.80 +
    openLeads * DEFAULT_LEAD_VALUE * 0.35;

  const upside =
    collectedRevenue +
    estimatedPipeline +
    outstandingRevenue +
    openLeads * DEFAULT_LEAD_VALUE * 0.65;

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Revenue Forecast"
        text="Forecast generated from estimates, invoices, payments, and lead conversion."
        icon={LineChart}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <ForecastCard
          icon={DollarSign}
          label="Conservative"
          value={Math.round(conservative)}
        />

        <ForecastCard
          icon={TrendingUp}
          label="Likely"
          value={Math.round(likely)}
          featured
        />

        <ForecastCard
          icon={Target}
          label="Upside"
          value={Math.round(upside)}
        />
      </div>

      <div className="grid gap-4 p-5 pt-0 lg:grid-cols-4">
        <Insight
          label="Pipeline"
          value={`$${estimatedPipeline.toLocaleString()}`}
        />

        <Insight
          label="Invoiced"
          value={`$${invoicedRevenue.toLocaleString()}`}
        />

        <Insight
          label="Collected"
          value={`$${collectedRevenue.toLocaleString()}`}
        />

        <Insight
          label="Outstanding"
          value={`$${outstandingRevenue.toLocaleString()}`}
        />
      </div>

      <div className="grid gap-4 px-5 pb-5 lg:grid-cols-4">
        <Insight
          label="Open Leads"
          value={openLeads}
        />

        <Insight
          label="Won Leads"
          value={data.leadStats.won}
        />

        <Insight
          label="Win Rate"
          value={`${data.winRate}%`}
        />

        <Insight
          label="Estimates"
          value={data.estimates.length}
        />
      </div>
    </BusinessOSCard>
  );
}

function ForecastCard({
  icon: Icon,
  label,
  value,
  featured,
}: {
  icon: typeof DollarSign;
  label: string;
  value: number;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        featured
          ? "border-cyan-300/30 bg-cyan-300/15"
          : "border-white/10 bg-slate-950/60"
      }`}
    >
      <Icon className="h-6 w-6 text-cyan-300" />

      <p className="mt-4 text-4xl font-black">
        ${value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-white/55">
        {label}
      </p>
    </div>
  );
}

function Insight({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-slate-950/70 p-4">
      <p className="text-2xl font-black">{value}</p>

      <p className="mt-1 text-xs font-bold text-white/45">
        {label}
      </p>
    </div>
  );
}
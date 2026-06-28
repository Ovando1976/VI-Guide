import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Send,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard } from "./BusinessOSCard";

const DEFAULT_LEAD_VALUE = 85;

export default function ExecutiveOverview({
  data,
  isAdmin = false,
}: {
  data: BusinessOSData;
  isAdmin?: boolean;
}) {
  const openLeads = data.leadStats.new + data.leadStats.contacted;
  const projectedRevenue = Math.round(
    (data.leadStats.won + openLeads * 0.35) * DEFAULT_LEAD_VALUE,
  );

  const healthScore = getHealthScore(data);
  const healthTone =
    healthScore >= 80
      ? "text-emerald-200"
      : healthScore >= 55
        ? "text-yellow-200"
        : "text-red-200";

  const priorities = buildPriorities(data);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-[#071923] to-emerald-950/60 shadow-2xl">
      <div className="p-5 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
          VI Guide Business OS
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Merchant Command Center
            </h1>

            <p className="mt-4 max-w-2xl text-white/70">
              {isAdmin
                ? "Admin view for platform revenue, listings, leads, alerts, and business growth."
                : "Daily command center for leads, follow-ups, revenue, tasks, and customer activity."}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                  Business Health
                </p>
                <p className={`mt-2 text-5xl font-black ${healthTone}`}>
                  {healthScore}
                </p>
              </div>

              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-cyan-300 text-slate-950">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Mail} label="Open Leads" value={openLeads} />
          <Metric icon={CheckCircle2} label="Won Leads" value={data.leadStats.won} />
          <Metric icon={TrendingUp} label="Win Rate" value={`${data.winRate}%`} />
          <Metric
            icon={DollarSign}
            label="Projected Revenue"
            value={`$${projectedRevenue.toLocaleString()}`}
          />
        </div>
      </div>

      <div className="grid gap-5 border-t border-white/10 p-5 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
        <BusinessOSCard>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-black">Today’s Priorities</h2>
            <p className="mt-1 text-sm text-white/60">
              The highest-value actions to move revenue forward.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {priorities.map((item) => (
              <div key={item.title} className="flex gap-4 p-5">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${item.bg}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </BusinessOSCard>

        <BusinessOSCard>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-black">AI Daily Briefing</h2>
            <p className="mt-1 text-sm text-white/60">
              What the business owner should know right now.
            </p>
          </div>

          <div className="space-y-3 p-5">
            <BriefingLine
              icon={Mail}
              text={`${data.leadStats.new} new lead${data.leadStats.new === 1 ? "" : "s"} need attention.`}
            />
            <BriefingLine
              icon={Clock}
              text={`${data.leadStats.contacted} contacted lead${data.leadStats.contacted === 1 ? "" : "s"} should be followed up.`}
            />
            <BriefingLine
              icon={DollarSign}
              text={`Projected revenue is $${projectedRevenue.toLocaleString()} using the current lead pipeline.`}
            />
            <BriefingLine
              icon={TrendingUp}
              text={`Current win rate is ${data.winRate}%. Improve this by responding faster and closing old leads.`}
            />

            <div className="mt-5 grid grid-cols-2 gap-2">
              <QuickAction icon={Send} label="Reply Lead" />
              <QuickAction icon={CalendarDays} label="Schedule" />
              <QuickAction icon={FileText} label="Estimate" />
              <QuickAction icon={DollarSign} label="Invoice" />
            </div>
          </div>
        </BusinessOSCard>
      </div>
    </section>
  );
}

function getHealthScore(data: BusinessOSData) {
  let score = 45;

  if (data.businesses.length > 0) score += 10;
  if (data.totals.profileViews > 0) score += 10;
  if (data.totals.totalActions > 0) score += 10;
  if (data.leadStats.new === 0 && data.totals.leadCount > 0) score += 10;
  if (data.winRate >= 25) score += 15;
  if (data.featuredCount > 0) score += 10;

  return Math.min(100, score);
}

function buildPriorities(data: BusinessOSData) {
  const items = [];

  if (data.leadStats.new > 0) {
    items.push({
      icon: AlertTriangle,
      title: "Respond to new leads",
      text: `${data.leadStats.new} customer request${data.leadStats.new === 1 ? "" : "s"} should be contacted as soon as possible.`,
      bg: "bg-yellow-300 text-slate-950",
    });
  }

  if (data.leadStats.contacted > 0) {
    items.push({
      icon: Clock,
      title: "Follow up with contacted leads",
      text: "Move active conversations toward won or lost so the revenue forecast stays accurate.",
      bg: "bg-cyan-300 text-slate-950",
    });
  }

  if (data.featuredCount === 0 && data.businesses.length > 0) {
    items.push({
      icon: TrendingUp,
      title: "Upgrade first featured listings",
      text: "Featured listings are one of the fastest paths to platform revenue.",
      bg: "bg-emerald-300 text-slate-950",
    });
  }

  if (items.length === 0) {
    items.push({
      icon: CheckCircle2,
      title: "Everything is under control",
      text: "No urgent lead or revenue issues need attention right now.",
      bg: "bg-emerald-300 text-slate-950",
    });
  }

  return items;
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
      <Icon className="h-5 w-5 text-cyan-300" />
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/55">{label}</p>
    </div>
  );
}

function BriefingLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-950/70 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <p className="text-sm leading-relaxed text-white/70">{text}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
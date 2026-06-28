import {
  CalendarDays,
  Crown,
  FileText,
  Mail,
  Plus,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function QuickActionsPanel({ data }: { data: BusinessOSData }) {
  const newestLead = data.leads[0];
  const firstBusiness = data.businesses[0];

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Quick Actions"
        text="Start the next money-making action from one place."
        icon={Plus}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard icon={FileText} label="Create Estimate" href="/merchant/estimates/new" />
        <ActionCard icon={ReceiptText} label="Create Invoice" href="/merchant/invoices/new" />
        <ActionCard icon={CalendarDays} label="Schedule Job" href="/merchant/calendar" />
        <ActionCard
          icon={Mail}
          label="Reply to Lead"
          href={newestLead ? `mailto:${newestLead.visitorEmail || ""}` : "#"}
          disabled={!newestLead?.visitorEmail}
        />
        <ActionCard icon={Plus} label="Add Task" href="#business-tasks" />
        <ActionCard
          icon={Crown}
          label="Upgrade Listing"
          href={
            firstBusiness
              ? `/business-signup?business=${firstBusiness.slug || firstBusiness.id}`
              : "/business-signup"
          }
          featured
        />
      </div>
    </BusinessOSCard>
  );
}

function ActionCard({
  icon: Icon,
  label,
  href,
  disabled,
  featured,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  disabled?: boolean;
  featured?: boolean;
}) {
  const className = featured
    ? "border-yellow-300/30 bg-yellow-300 text-slate-950"
    : disabled
      ? "pointer-events-none border-white/10 bg-white/[0.04] text-white/30"
      : "border-white/10 bg-slate-950/70 text-white hover:bg-white/10";

  return (
    <a
      href={href}
      className={`flex items-center gap-4 rounded-[1.4rem] border p-4 transition ${className}`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
          featured ? "bg-slate-950 text-yellow-300" : "bg-cyan-300 text-slate-950"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <p className="font-black">{label}</p>
        <p className={`mt-1 text-xs font-bold ${featured ? "text-slate-800" : "text-white/45"}`}>
          {disabled ? "Unavailable" : "Open"}
        </p>
      </div>
    </a>
  );
}
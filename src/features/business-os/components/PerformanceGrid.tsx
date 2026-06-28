import {
  Eye,
  Globe,
  Mail,
  MapPin,
  MousePointerClick,
  Phone,
  type LucideIcon,
} from "lucide-react";

import type { BusinessOSData } from "../types";

export default function PerformanceGrid({ data }: { data: BusinessOSData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Metric icon={Eye} label="Profile Views" value={data.totals.profileViews} />
      <Metric icon={Phone} label="Phone Clicks" value={data.totals.phoneClicks} />
      <Metric icon={Globe} label="Website Clicks" value={data.totals.websiteClicks} />
      <Metric icon={MapPin} label="Directions" value={data.totals.directionRequests} />
      <Metric icon={Mail} label="Leads" value={data.totals.leadCount} />
      <Metric icon={MousePointerClick} label="Total Actions" value={data.totals.totalActions} />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl">
      <Icon className="h-5 w-5 text-cyan-300" />
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="text-xs font-bold text-white/55">{label}</p>
    </div>
  );
}
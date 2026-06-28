import { useEffect, useMemo, useState } from "react";
import { DollarSign, MousePointerClick, Star, Users } from "lucide-react";

import { getBusinesses, getBusinessAnalytics } from "../lib/firestore/businesses";
import type { Business } from "../types/business";

type AnalyticsRow = {
  id: string;
  businessId: string;
  profileViews?: number;
  websiteClicks?: number;
  phoneClicks?: number;
  directionRequests?: number;
  leadCount?: number;
};

export default function RevenueDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBusinesses(), getBusinessAnalytics()])
      .then(([businessRows, analyticsRows]) => {
        setBusinesses(businessRows);
        setAnalytics(analyticsRows as AnalyticsRow[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const featured = businesses.filter((b) => b.featured).length;
    const premium = businesses.filter((b) => b.premium).length;

    const monthlyRevenue = featured * 49 + premium * 99;

    const leads = analytics.reduce((sum, row) => sum + (row.leadCount || 0), 0);
    const clicks = analytics.reduce(
      (sum, row) =>
        sum +
        (row.websiteClicks || 0) +
        (row.phoneClicks || 0) +
        (row.directionRequests || 0),
      0
    );

    return {
      totalBusinesses: businesses.length,
      featured,
      premium,
      monthlyRevenue,
      leads,
      clicks,
    };
  }, [businesses, analytics]);

  if (loading) {
    return <main className="min-h-screen bg-slate-950 p-6 text-white">Loading revenue...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 pb-28 text-white">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
        <p className="text-sm text-cyan-300">Owner Dashboard</p>
        <h1 className="mt-2 text-3xl font-black">Revenue Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track listings, leads, clicks, and estimated monthly recurring revenue.
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard icon={<DollarSign />} label="Monthly Revenue" value={`$${stats.monthlyRevenue}`} />
        <StatCard icon={<Users />} label="Businesses" value={stats.totalBusinesses} />
        <StatCard icon={<Star />} label="Featured" value={stats.featured} />
        <StatCard icon={<MousePointerClick />} label="Clicks" value={stats.clicks} />
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h2 className="text-xl font-black">Lead Engine</h2>
        <p className="mt-3 text-4xl font-black text-cyan-300">{stats.leads}</p>
        <p className="text-sm text-slate-300">Total captured business leads</p>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
      <div className="text-cyan-300">{icon}</div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
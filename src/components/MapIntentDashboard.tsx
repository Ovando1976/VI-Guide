import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Car,
  ClipboardList,
  MapPin,
  MousePointerClick,
  Navigation,
  Route,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { subscribeToMerchantLeads } from "../lib/firestore/merchantLeads";

type IntentLead = {
  id?: string;
  partnerId?: string;
  partnerName?: string;
  placeId?: string;
  placeName?: string;
  placeType?: string;
  action?: string;
  source?: string;
  message?: string;
  lat?: number;
  lng?: number;
  createdAt?: number | string;
};

const actionLabels: Record<string, string> = {
  map_marker_select: "Marker taps",
  search_result_select: "Search selections",
  featured_card_select: "Featured card taps",
  day_plan_select: "Day-plan selections",
  directions_click: "Directions",
  day_plan_save: "Day-plan saves",
  ride_request_start: "Ride requests",
};

const actionIcons: Record<string, typeof MousePointerClick> = {
  map_marker_select: MousePointerClick,
  search_result_select: Search,
  featured_card_select: Sparkles,
  day_plan_select: Route,
  directions_click: Navigation,
  day_plan_save: ClipboardList,
  ride_request_start: Car,
};

function readLocalMapEvents(): IntentLead[] {
  try {
    return JSON.parse(window.localStorage.getItem("viNavigatorMapLeadEvents") || "[]");
  } catch {
    return [];
  }
}

function normalizeLead(raw: any): IntentLead {
  return {
    id: String(raw.id || raw.localEventId || `intent-${Date.now()}`),
    partnerId: raw.partnerId || raw.placeId || "",
    partnerName: raw.partnerName || raw.placeName || "Unknown place",
    placeId: raw.placeId || raw.partnerId || "",
    placeName: raw.placeName || raw.partnerName || "Unknown place",
    placeType: raw.placeType || "",
    action: raw.action || "map_marker_select",
    source: raw.source || "map",
    message: raw.message || "",
    lat: Number(raw.lat || 0),
    lng: Number(raw.lng || 0),
    createdAt: raw.createdAt || raw.updatedAt || "",
  };
}

function actionLabel(action: string) {
  return actionLabels[action] || action.replaceAll("_", " ");
}

function formatTime(value: unknown) {
  if (!value) return "Recently";

  if (typeof value === "number") {
    return new Date(value).toLocaleString();
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "Recently";
}

export default function MapIntentDashboard() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<IntentLead[]>(() =>
    readLocalMapEvents().map(normalizeLead)
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToMerchantLeads(
      (items: any[]) => {
        const firestoreItems = items.map(normalizeLead);
        const localItems = readLocalMapEvents().map(normalizeLead);

        const combined = [...firestoreItems, ...localItems];
        const seen = new Set<string>();

        setLeads(
          combined.filter((item) => {
            const key = item.id || `${item.placeName}-${item.action}-${item.createdAt}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
        );
      },
      (err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      }
    );

    return () => unsubscribe();
  }, []);

  const mapLeads = useMemo(
    () =>
      leads.filter((lead) =>
        String(lead.source || "").includes("map") ||
        String(lead.partnerId || "").startsWith("map-") ||
        String(lead.placeId || "").length > 0
      ),
    [leads]
  );

  const stats = useMemo(() => {
    const uniquePlaces = new Set(mapLeads.map((lead) => lead.placeName).filter(Boolean));

    return {
      total: mapLeads.length,
      places: uniquePlaces.size,
      directions: mapLeads.filter((lead) => lead.action === "directions_click").length,
      dayPlans: mapLeads.filter((lead) => lead.action === "day_plan_save").length,
      rideRequests: mapLeads.filter((lead) => lead.action === "ride_request_start").length,
    };
  }, [mapLeads]);

  const placeRows = useMemo(() => {
    const groups = new Map<
      string,
      {
        placeName: string;
        placeType: string;
        total: number;
        directions: number;
        dayPlans: number;
        rides: number;
        lastAction: string;
        lastSeen: unknown;
      }
    >();

    for (const lead of mapLeads) {
      const placeName = lead.placeName || lead.partnerName || "Unknown place";
      const existing =
        groups.get(placeName) ||
        {
          placeName,
          placeType: lead.placeType || "",
          total: 0,
          directions: 0,
          dayPlans: 0,
          rides: 0,
          lastAction: "",
          lastSeen: "",
        };

      existing.total += 1;
      existing.placeType = existing.placeType || lead.placeType || "";

      if (lead.action === "directions_click") existing.directions += 1;
      if (lead.action === "day_plan_save") existing.dayPlans += 1;
      if (lead.action === "ride_request_start") existing.rides += 1;

      existing.lastAction = lead.action || "";
      existing.lastSeen = lead.createdAt || existing.lastSeen;

      groups.set(placeName, existing);
    }

    return Array.from(groups.values()).sort((a, b) => b.total - a.total);
  }, [mapLeads]);

  const actionRows = useMemo(() => {
    const groups = new Map<string, number>();

    for (const lead of mapLeads) {
      const action = lead.action || "unknown";
      groups.set(action, (groups.get(action) || 0) + 1);
    }

    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [mapLeads]);

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <BarChart3 className="h-4 w-4" />
                Map Intent Dashboard
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Visitor demand you can sell.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Track what visitors do on the island map: marker taps,
                directions, day-plan saves, and ride requests. This turns the
                map into proof of real business value.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/map")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Open Map
              </button>
              <button
                onClick={() => navigate("/admin/leads")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Admin Leads
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl bg-amber-100 p-4 text-sm font-bold text-amber-950">
              Firestore warning: {error}. Showing local map events when available.
            </div>
          ) : null}

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Total intent" value={stats.total} icon={MousePointerClick} />
            <StatCard label="Places" value={stats.places} icon={MapPin} />
            <StatCard label="Directions" value={stats.directions} icon={Navigation} />
            <StatCard label="Day plans" value={stats.dayPlans} icon={ClipboardList} />
            <StatCard label="Ride starts" value={stats.rideRequests} icon={Car} />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Top places
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Places generating visitor action
            </h2>

            <div className="mt-5 space-y-3">
              {placeRows.length === 0 ? (
                <EmptyState />
              ) : (
                placeRows.map((row, index) => (
                  <div key={row.placeName} className="rounded-[2rem] bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                          #{index + 1} · {row.placeType || "map place"}
                        </p>
                        <h3 className="mt-1 text-xl font-black">{row.placeName}</h3>
                        <p className="mt-1 text-xs font-bold text-stone-500">
                          Last action: {actionLabel(row.lastAction)} · {formatTime(row.lastSeen)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-ink px-4 py-3 text-center text-white">
                        <p className="text-2xl font-black">{row.total}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
                          actions
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <MiniStat label="Directions" value={row.directions} />
                      <MiniStat label="Plans" value={row.dayPlans} />
                      <MiniStat label="Rides" value={row.rides} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Action mix
              </p>
              <h2 className="mt-2 text-3xl font-black">What visitors are doing</h2>

              <div className="mt-5 space-y-3">
                {actionRows.length === 0 ? (
                  <EmptyState />
                ) : (
                  actionRows.map(([action, count]) => {
                    const Icon = actionIcons[action] || MousePointerClick;
                    const max = Math.max(...actionRows.map((item) => item[1]), 1);

                    return (
                      <div key={action} className="rounded-2xl bg-stone-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-black">{actionLabel(action)}</p>
                          </div>
                          <p className="text-xl font-black">{count}</p>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-emerald-700"
                            style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <Users className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-3xl font-black">Business sales angle</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                This dashboard lets us tell a business: “Your listing did not
                just sit on a page. Visitors tapped it, asked for directions,
                saved it to a plan, or started a ride request.”
              </p>

              <button
                onClick={() => navigate("/partners")}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Open Partner Portal
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof MousePointerClick;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-4xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] bg-stone-50 p-6 text-center">
      <MapPin className="mx-auto h-8 w-8 text-emerald-700" />
      <p className="mt-3 text-lg font-black">No map activity yet</p>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-500">
        Open the map, tap places, click directions, add stops, or start a ride.
      </p>
    </div>
  );
}

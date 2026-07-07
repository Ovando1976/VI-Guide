import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Car,
  CheckCircle2,
  Clipboard,
  Compass,
  MapPin,
  MousePointerClick,
  Navigation,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { subscribeToMerchantLeads } from "../lib/firestore/merchantLeads";
import BusinessRouteTestButtons from "./BusinessRouteTestButtons";

type ProofLead = {
  id?: string;
  partnerId?: string;
  partnerName?: string;
  placeId?: string;
  placeName?: string;
  placeType?: string;
  action?: string;
  source?: string;
  message?: string;
  createdAt?: number | string;
};

type PlaceRollup = {
  placeName: string;
  placeType: string;
  total: number;
  directions: number;
  dayPlans: number;
  rides: number;
  taps: number;
  lastSeen: unknown;
};

function readLocalMapEvents(): ProofLead[] {
  try {
    return JSON.parse(window.localStorage.getItem("viNavigatorMapLeadEvents") || "[]");
  } catch {
    return [];
  }
}

function normalizeLead(raw: any): ProofLead {
  return {
    id: String(raw.id || raw.localEventId || `${raw.placeName || raw.partnerName}-${raw.action}-${raw.createdAt}`),
    partnerId: raw.partnerId || raw.placeId || "",
    partnerName: raw.partnerName || raw.placeName || "Unknown place",
    placeId: raw.placeId || raw.partnerId || "",
    placeName: raw.placeName || raw.partnerName || "Unknown place",
    placeType: raw.placeType || "",
    action: raw.action || "map_marker_select",
    source: raw.source || "map",
    message: raw.message || "",
    createdAt: raw.createdAt || raw.updatedAt || "",
  };
}

function isMapLead(lead: ProofLead) {
  return (
    String(lead.source || "").includes("map") ||
    String(lead.partnerId || "").startsWith("map-") ||
    String(lead.placeId || "").length > 0
  );
}

function buildPitch(row: PlaceRollup) {
  return `Hi — we’re building a visitor discovery and ride-request platform for the U.S. Virgin Islands.

Your business/place, ${row.placeName}, is already showing visitor intent in our demo map.

Recent activity:
- ${row.total} total visitor actions
- ${row.taps} map/search taps
- ${row.directions} direction clicks
- ${row.dayPlans} day-plan saves
- ${row.rides} ride-request starts

This means visitors are not just seeing a listing — they are taking action around it.

We’d like to help turn those actions into calls, bookings, rides, and customer visits.`;
}

function moneyEstimate(row: PlaceRollup) {
  const directionValue = row.directions * 12;
  const dayPlanValue = row.dayPlans * 20;
  const rideValue = row.rides * 35;
  const tapValue = row.taps * 3;

  return directionValue + dayPlanValue + rideValue + tapValue;
}

export default function BusinessProofDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ProofLead[]>(() =>
    readLocalMapEvents().map(normalizeLead)
  );
  const [selectedPlace, setSelectedPlace] = useState("");
  const [copied, setCopied] = useState(false);

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
      () => {
        setLeads(readLocalMapEvents().map(normalizeLead));
      }
    );

    return () => unsubscribe();
  }, []);

  const rows = useMemo(() => {
    const groups = new Map<string, PlaceRollup>();

    for (const lead of leads.filter(isMapLead)) {
      const placeName = lead.placeName || lead.partnerName || "Unknown place";
      const row =
        groups.get(placeName) ||
        {
          placeName,
          placeType: lead.placeType || "map place",
          total: 0,
          directions: 0,
          dayPlans: 0,
          rides: 0,
          taps: 0,
          lastSeen: "",
        };

      row.total += 1;
      row.placeType = row.placeType || lead.placeType || "map place";
      row.lastSeen = lead.createdAt || row.lastSeen;

      if (lead.action === "directions_click") row.directions += 1;
      else if (lead.action === "day_plan_save") row.dayPlans += 1;
      else if (lead.action === "ride_request_start") row.rides += 1;
      else row.taps += 1;

      groups.set(placeName, row);
    }

    return Array.from(groups.values()).sort((a, b) => {
      const scoreA = moneyEstimate(a) + a.total;
      const scoreB = moneyEstimate(b) + b.total;
      return scoreB - scoreA;
    });
  }, [leads]);

  const selected = useMemo(() => {
    return rows.find((row) => row.placeName === selectedPlace) || rows[0] || null;
  }, [rows, selectedPlace]);

  const pitch = selected ? buildPitch(selected) : "";

  const copyPitch = async () => {
    if (!pitch) return;

    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <BusinessRouteTestButtons />
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <button
          type="button"
          onClick={() => window.location.assign("/meeting-mode")}
          className="mb-5 flex w-full items-center justify-between rounded-[2rem] bg-[#ffcf32] px-6 py-5 text-left text-ink shadow-xl active:scale-95"
        >
          <span>
            <span className="block text-xs font-black uppercase tracking-[0.22em] text-emerald-900">
              Business presentation
            </span>
            <span className="mt-1 block text-2xl font-black">
              Meeting Mode
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-700">
              Open the taxi, hotel, chamber, tourism, and partner pitch path.
            </span>
          </span>
          <span className="text-2xl font-black">→</span>
        </button>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <BadgeDollarSign className="h-4 w-4" />
                Business Proof
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Turn visitor intent into partner sales.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Use this page as the closing screen when talking to local
                businesses. It converts map activity into a simple business
                story: visibility, directions, day plans, rides, and estimated value.
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
                onClick={() => navigate("/map-intent")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Map Intent
              </button>

              <button
                onClick={() => navigate("/partner-pipeline")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Partner Pipeline
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <HeroStat label="Tracked places" value={rows.length} icon={MapPin} />
            <HeroStat
              label="Total actions"
              value={rows.reduce((sum, row) => sum + row.total, 0)}
              icon={MousePointerClick}
            />
            <HeroStat
              label="Ride starts"
              value={rows.reduce((sum, row) => sum + row.rides, 0)}
              icon={Car}
            />
            <HeroStat
              label="Estimated value"
              value={`$${rows.reduce((sum, row) => sum + moneyEstimate(row), 0).toLocaleString()}`}
              icon={TrendingUp}
            />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Prospect list
            </p>
            <h2 className="mt-2 text-3xl font-black">Who to sell first</h2>

            <div className="mt-5 space-y-3">
              {rows.length === 0 ? (
                <div className="rounded-[2rem] bg-stone-50 p-6 text-center">
                  <Compass className="mx-auto h-8 w-8 text-emerald-700" />
                  <p className="mt-3 text-lg font-black">No business proof yet</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-stone-500">
                    Open the map, tap places, click directions, add places to a day plan,
                    and start ride requests.
                  </p>
                </div>
              ) : (
                rows.map((row, index) => {
                  const active = selected?.placeName === row.placeName;

                  return (
                    <button
                      key={row.placeName}
                      type="button"
                      onClick={() => setSelectedPlace(row.placeName)}
                      className={`w-full rounded-[2rem] p-4 text-left transition active:scale-[0.99] ${
                        active
                          ? "bg-emerald-950 text-white shadow-xl"
                          : "bg-stone-50 hover:bg-stone-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                              active ? "text-turquoise" : "text-emerald-700"
                            }`}
                          >
                            #{index + 1} · {row.placeType || "map place"}
                          </p>
                          <h3 className="mt-1 text-lg font-black">{row.placeName}</h3>
                          <p
                            className={`mt-1 text-xs font-bold ${
                              active ? "text-white/60" : "text-stone-500"
                            }`}
                          >
                            Est. value: ${moneyEstimate(row).toLocaleString()}
                          </p>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-center ${
                            active ? "bg-white text-ink" : "bg-white"
                          }`}
                        >
                          <p className="text-2xl font-black">{row.total}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
                            actions
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-5">
            {selected ? (
              <>
                <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                        Partner proof card
                      </p>
                      <h2 className="mt-2 text-3xl font-black">{selected.placeName}</h2>
                      <p className="mt-2 text-sm font-bold text-stone-500">
                        {selected.placeType || "Local business/place"} · estimated visitor value:
                        {" "}
                        <span className="text-emerald-700">
                          ${moneyEstimate(selected).toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copyPitch}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy pitch"}
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <MiniProof label="Taps" value={selected.taps} icon={MousePointerClick} />
                    <MiniProof label="Directions" value={selected.directions} icon={Navigation} />
                    <MiniProof label="Day plans" value={selected.dayPlans} icon={BarChart3} />
                    <MiniProof label="Ride starts" value={selected.rides} icon={Car} />
                  </div>
                </section>

                <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Copy-and-send pitch
                  </p>

                  <pre className="mt-4 whitespace-pre-wrap rounded-[1.5rem] bg-stone-50 p-4 text-sm font-bold leading-7 text-stone-700">
                    {pitch}
                  </pre>
                </section>

                <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
                  <Sparkles className="h-8 w-8 text-turquoise" />
                  <h2 className="mt-4 text-3xl font-black">Recommended offer</h2>
                  <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                    Start this prospect on a Founding Partner listing. Offer them
                    visibility, dashboard proof, ride-request attribution, and early
                    territory placement.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <PlanCard name="Starter" price="$49/mo" text="Claimed listing + basic dashboard" />
                    <PlanCard name="Growth" price="$99/mo" text="Featured map placement + visitor actions" featured />
                    <PlanCard name="Pro" price="$199/mo" text="Priority placement + ride attribution" />
                  </div>

                  <button
                    onClick={() => navigate("/partners")}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
                  >
                    Open Partner Portal
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              </>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof MapPin;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function MiniProof({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof MapPin;
}) {
  return (
    <div className="rounded-[1.5rem] bg-stone-50 p-4">
      <Icon className="h-5 w-5 text-emerald-700" />
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  text,
  featured = false,
}: {
  name: string;
  price: string;
  text: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] p-4 ${
        featured ? "bg-turquoise text-ink" : "bg-white/10 text-white"
      }`}
    >
      <p className="text-sm font-black">{name}</p>
      <p className="mt-2 text-3xl font-black">{price}</p>
      <p className={`mt-2 text-xs font-bold leading-5 ${featured ? "text-ink/70" : "text-white/60"}`}>
        {text}
      </p>
    </div>
  );
}

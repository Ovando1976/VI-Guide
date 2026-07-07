import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarCheck,
  Car,
  CheckCircle2,
  Clipboard,
  Compass,
  Hotel,
  Landmark,
  Mail,
  Megaphone,
  Phone,
  Plane,
  Search,
  Ship,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type AllianceStage =
  | "target"
  | "contacted"
  | "meeting_set"
  | "demo_done"
  | "pilot_partner"
  | "won"
  | "paused";

type AllianceOrg = {
  id: string;
  name: string;
  group: string;
  priority: "Primary" | "Strategic" | "Growth";
  icon: LucideIcon;
  pitch: string;
  caresAbout: string[];
  weNeed: string[];
  demoRoutes: { label: string; path: string }[];
  potentialMonthlyValue: number;
};

const STATUS_KEY = "viNavigatorAlliancePipelineStatuses";
const NOTES_KEY = "viNavigatorAlliancePipelineNotes";
const CONTACTS_KEY = "viNavigatorAlliancePipelineContacts";

const stages: { id: AllianceStage; label: string }[] = [
  { id: "target", label: "Target" },
  { id: "contacted", label: "Contacted" },
  { id: "meeting_set", label: "Meeting Set" },
  { id: "demo_done", label: "Demo Done" },
  { id: "pilot_partner", label: "Pilot Partner" },
  { id: "won", label: "Won" },
  { id: "paused", label: "Paused" },
];

const stageClasses: Record<AllianceStage, string> = {
  target: "bg-stone-100 text-stone-700",
  contacted: "bg-blue-50 text-blue-800",
  meeting_set: "bg-amber-50 text-amber-800",
  demo_done: "bg-purple-50 text-purple-800",
  pilot_partner: "bg-turquoise text-ink",
  won: "bg-emerald-50 text-emerald-800",
  paused: "bg-red-50 text-red-800",
};

const allianceOrgs: AllianceOrg[] = [
  {
    id: "taxi-association",
    name: "Taxi Association",
    group: "Transportation",
    priority: "Primary",
    icon: Car,
    pitch:
      "Use the app as a tariff-aware ride demand, dispatch, and visitor pickup coordination layer.",
    caresAbout: [
      "Official tariff integrity",
      "Fair dispatch workflow",
      "Hotel, port, beach, and attraction pickup clarity",
      "More organized visitor ride demand",
    ],
    weNeed: [
      "Tariff review",
      "Dispatcher workflow feedback",
      "Pilot dispatch users",
      "Rules for routing requests",
    ],
    demoRoutes: [
      { label: "Taxi Demo", path: "/taxi-demo" },
      { label: "Mobility", path: "/mobility" },
      { label: "Dispatch", path: "/mobility/dispatch" },
      { label: "Map", path: "/map" },
    ],
    potentialMonthlyValue: 1500,
  },
  {
    id: "usvi-hotel-association",
    name: "USVI Hotel Association / Hotel Group",
    group: "Hotels",
    priority: "Primary",
    icon: Hotel,
    pitch:
      "Position VI Guide as shared guest-movement infrastructure for hotels, taxis, attractions, restaurants, and tourism partners.",
    caresAbout: [
      "Better guest mobility",
      "Concierge support",
      "Preferred vendor visibility",
      "Territory-wide visitor experience",
    ],
    weNeed: [
      "Hotel member introductions",
      "Pilot property selection",
      "Concierge workflow feedback",
      "Guest transportation pain points",
    ],
    demoRoutes: [
      { label: "Tourism Alliance", path: "/tourism-alliance" },
      { label: "Map", path: "/map" },
      { label: "Mobility", path: "/mobility" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
    potentialMonthlyValue: 2500,
  },
  {
    id: "hotels-resorts",
    name: "Hotels & Resorts",
    group: "Hotels",
    priority: "Primary",
    icon: Building2,
    pitch:
      "Give hotels a visitor-facing concierge map with local recommendations, ride handoff, and partner discovery.",
    caresAbout: [
      "Guest satisfaction",
      "Front-desk support",
      "Trusted recommendations",
      "Reliable ride handoff",
    ],
    weNeed: [
      "Pickup/dropoff standards",
      "Preferred vendor list",
      "Concierge feedback",
      "Pilot hotel contacts",
    ],
    demoRoutes: [
      { label: "Map", path: "/map" },
      { label: "Mobility", path: "/mobility" },
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
    potentialMonthlyValue: 2000,
  },
  {
    id: "stt-stj-chamber",
    name: "St. Thomas-St. John Chamber of Commerce",
    group: "Chamber",
    priority: "Strategic",
    icon: Landmark,
    pitch:
      "Show chamber members how static listings become measurable visitor actions: taps, directions, day-plan saves, and ride starts.",
    caresAbout: [
      "Member visibility",
      "Business discovery",
      "Local economic activity",
      "Chamber-wide digital directory",
    ],
    weNeed: [
      "Pilot member list",
      "Member category feedback",
      "Chamber intro path",
      "Pricing feedback",
    ],
    demoRoutes: [
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Close", path: "/partner-close" },
      { label: "Partner Pipeline", path: "/partner-pipeline" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
    potentialMonthlyValue: 1800,
  },
  {
    id: "stx-chamber",
    name: "St. Croix Chamber of Commerce",
    group: "Chamber",
    priority: "Strategic",
    icon: Landmark,
    pitch:
      "Give St. Croix businesses a clear path into the map, mobility, visitor-intent, and partner directory ecosystem.",
    caresAbout: [
      "St. Croix business visibility",
      "Island-specific tourism routes",
      "Member value",
      "Visitor discovery beyond St. Thomas",
    ],
    weNeed: [
      "Pilot St. Croix businesses",
      "Local district priorities",
      "Attraction and restaurant lists",
      "Chamber member feedback",
    ],
    demoRoutes: [
      { label: "Map", path: "/map" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Pipeline", path: "/partner-pipeline" },
    ],
    potentialMonthlyValue: 1400,
  },
  {
    id: "tour-operators-attractions",
    name: "Tour Operators & Attractions",
    group: "Tourism Businesses",
    priority: "Growth",
    icon: Compass,
    pitch:
      "Help tour and attraction operators get discovered, saved into day plans, routed to, and connected to ride demand.",
    caresAbout: [
      "Bookings",
      "Directions",
      "Visitor planning",
      "Ride access",
    ],
    weNeed: [
      "Tour locations",
      "Booking links",
      "Photos and descriptions",
      "Featured offers",
    ],
    demoRoutes: [
      { label: "Partner Onboarding", path: "/partner-onboarding" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Map Intent", path: "/map-intent" },
      { label: "Map", path: "/map" },
    ],
    potentialMonthlyValue: 1200,
  },
  {
    id: "restaurants-beach-bars-retail",
    name: "Restaurants, Beach Bars & Retail",
    group: "Tourism Businesses",
    priority: "Growth",
    icon: Store,
    pitch:
      "Turn map discovery into calls, visits, directions, itinerary saves, and ride requests.",
    caresAbout: [
      "Customer traffic",
      "Menu and offer visibility",
      "Directions",
      "Featured placement",
    ],
    weNeed: [
      "Business details",
      "Photos",
      "Offers",
      "Phone, website, and location data",
    ],
    demoRoutes: [
      { label: "Partner Close", path: "/partner-close" },
      { label: "Partner Onboarding", path: "/partner-onboarding" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Map", path: "/map" },
    ],
    potentialMonthlyValue: 1800,
  },
  {
    id: "cruise-facing-partners",
    name: "Cruise-Facing Partners",
    group: "Cruise",
    priority: "Growth",
    icon: Ship,
    pitch:
      "Serve short-stay visitors with fast discovery, limited-time itinerary planning, and transportation handoff.",
    caresAbout: [
      "Fast visitor decisions",
      "Port-to-business routing",
      "Cruise day planning",
      "Taxi coordination",
    ],
    weNeed: [
      "Port pickup rules",
      "Cruise visitor priorities",
      "Time-boxed itinerary examples",
      "Preferred offers",
    ],
    demoRoutes: [
      { label: "Map", path: "/map" },
      { label: "Mobility", path: "/mobility" },
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
    potentialMonthlyValue: 1000,
  },
  {
    id: "tourism-stakeholders",
    name: "Tourism / Government Stakeholders",
    group: "Public Tourism",
    priority: "Strategic",
    icon: Plane,
    pitch:
      "Present the platform as visitor infrastructure that connects discovery, local businesses, mobility, and measurable tourism activity.",
    caresAbout: [
      "Visitor experience",
      "Small business support",
      "Transportation clarity",
      "Territory-wide tourism coordination",
    ],
    weNeed: [
      "Policy feedback",
      "Public-private partnership pathway",
      "Data priorities",
      "Pilot support",
    ],
    demoRoutes: [
      { label: "Tourism Alliance", path: "/tourism-alliance" },
      { label: "Map Intent", path: "/map-intent" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Taxi Demo", path: "/taxi-demo" },
    ],
    potentialMonthlyValue: 3000,
  },
];

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function stageLabel(stage: AllianceStage) {
  return stages.find((item) => item.id === stage)?.label || stage;
}

function buildFollowUp(org: AllianceOrg, stage: AllianceStage, notes: string) {
  return `Hi — this is Ovando with VI Guide.

I wanted to follow up about showing ${org.name} how the platform can support the Virgin Islands tourism ecosystem.

The core idea:
${org.pitch}

What ${org.name} can get:
- ${org.caresAbout.join("\n- ")}

What we are looking for:
- ${org.weNeed.join("\n- ")}

Current status: ${stageLabel(stage)}

Notes:
${notes || "No notes yet."}

Suggested next step:
Schedule a short demo covering the map, mobility flow, partner directory, and tourism alliance story.`;
}

export default function AlliancePipelinePage() {
  const navigate = useNavigate();

  const [statuses, setStatuses] = useState<Record<string, AllianceStage>>(() =>
    safeReadJson<Record<string, AllianceStage>>(STATUS_KEY, {})
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    safeReadJson<Record<string, string>>(NOTES_KEY, {})
  );
  const [contacts, setContacts] = useState<Record<string, { name?: string; phone?: string; email?: string }>>(() =>
    safeReadJson<Record<string, { name?: string; phone?: string; email?: string }>>(CONTACTS_KEY, {})
  );
  const [query, setQuery] = useState("");
  const [filterStage, setFilterStage] = useState<AllianceStage | "all">("all");
  const [copiedId, setCopiedId] = useState("");

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return allianceOrgs
      .map((org) => ({
        ...org,
        stage: statuses[org.id] || "target",
        notes: notes[org.id] || "",
        contact: contacts[org.id] || {},
      }))
      .filter((org) => {
        const matchesStage = filterStage === "all" || org.stage === filterStage;
        const matchesSearch =
          !search ||
          org.name.toLowerCase().includes(search) ||
          org.group.toLowerCase().includes(search) ||
          org.pitch.toLowerCase().includes(search);

        return matchesStage && matchesSearch;
      });
  }, [contacts, filterStage, notes, query, statuses]);

  const stats = useMemo(() => {
    const enriched = allianceOrgs.map((org) => ({
      ...org,
      stage: statuses[org.id] || "target",
    }));

    return {
      total: enriched.length,
      meetings: enriched.filter((org) =>
        ["meeting_set", "demo_done", "pilot_partner", "won"].includes(org.stage)
      ).length,
      pilots: enriched.filter((org) => org.stage === "pilot_partner").length,
      won: enriched.filter((org) => org.stage === "won").length,
      potential: enriched
        .filter((org) => org.stage !== "paused")
        .reduce((sum, org) => sum + org.potentialMonthlyValue, 0),
    };
  }, [statuses]);

  const updateStatus = (id: string, stage: AllianceStage) => {
    setStatuses((current) => {
      const next = { ...current, [id]: stage };
      safeWriteJson(STATUS_KEY, next);
      return next;
    });
  };

  const updateNotes = (id: string, value: string) => {
    setNotes((current) => {
      const next = { ...current, [id]: value };
      safeWriteJson(NOTES_KEY, next);
      return next;
    });
  };

  const updateContact = (
    id: string,
    field: "name" | "phone" | "email",
    value: string
  ) => {
    setContacts((current) => {
      const next = {
        ...current,
        [id]: {
          ...(current[id] || {}),
          [field]: value,
        },
      };
      safeWriteJson(CONTACTS_KEY, next);
      return next;
    });
  };

  const copyFollowUp = async (
    org: AllianceOrg,
    stage: AllianceStage,
    noteText: string
  ) => {
    try {
      await navigator.clipboard.writeText(buildFollowUp(org, stage, noteText));
      setCopiedId(org.id);
      window.setTimeout(() => setCopiedId(""), 1500);
    } catch {
      setCopiedId("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Megaphone className="h-4 w-4" />
                Alliance Pipeline
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Track the organizations we need to win.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Manage outreach to taxi, hotel, chamber, tourism, cruise, and
                government stakeholders. Keep status, meeting notes, contacts,
                demo paths, and follow-up actions in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <button
                onClick={() => navigate("/tourism-alliance")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Tourism Alliance
              </button>
              <button
                onClick={() => navigate("/taxi-demo")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Taxi Demo
              </button>
              <button
                onClick={() => navigate("/partner-pipeline")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Partner Pipeline
              </button>
              <button
                onClick={() => navigate("/map")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Map
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-5">
            <HeroStat label="Targets" value={stats.total} icon={Users} />
            <HeroStat label="Meetings+" value={stats.meetings} icon={CalendarCheck} />
            <HeroStat label="Pilots" value={stats.pilots} icon={Sparkles} />
            <HeroStat label="Won" value={stats.won} icon={CheckCircle2} />
            <HeroStat
              label="Potential"
              value={`$${stats.potential.toLocaleString()}/mo`}
              icon={BadgeDollarSign}
            />
          </div>
        </div>

        <section className="mt-6 rounded-[2.25rem] bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Outreach board
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Tourism partnership targets
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_190px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search organizations..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700 md:w-80"
                />
              </label>

              <select
                value={filterStage}
                onChange={(event) =>
                  setFilterStage(event.target.value as AllianceStage | "all")
                }
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
              >
                <option value="all">All stages</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-5">
            {rows.map((org) => {
              const Icon = org.icon;

              return (
                <article key={org.id} className="rounded-[2rem] bg-stone-50 p-4">
                  <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                    <div>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                          <Icon className="h-7 w-7" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${stageClasses[org.stage]}`}
                            >
                              {stageLabel(org.stage)}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                              {org.priority} · {org.group}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                              ${org.potentialMonthlyValue.toLocaleString()}/mo potential
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-black">{org.name}</h3>

                          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-stone-600">
                            {org.pitch}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[1.5rem] bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                            What they care about
                          </p>
                          <div className="mt-3 space-y-2">
                            {org.caresAbout.map((item) => (
                              <Bullet key={item} text={item} />
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                            What we need
                          </p>
                          <div className="mt-3 space-y-2">
                            {org.weNeed.map((item) => (
                              <Bullet key={item} text={item} muted />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {org.demoRoutes.map((route) => (
                          <button
                            key={`${org.id}-${route.path}`}
                            type="button"
                            onClick={() => navigate(route.path)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white active:scale-95"
                          >
                            {route.label}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <select
                        value={org.stage}
                        onChange={(event) =>
                          updateStatus(org.id, event.target.value as AllianceStage)
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                      >
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.label}
                          </option>
                        ))}
                      </select>

                      <div className="grid gap-2">
                        <input
                          value={org.contact.name || ""}
                          onChange={(event) =>
                            updateContact(org.id, "name", event.target.value)
                          }
                          placeholder="Contact name"
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
                        />
                        <input
                          value={org.contact.phone || ""}
                          onChange={(event) =>
                            updateContact(org.id, "phone", event.target.value)
                          }
                          placeholder="Phone"
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
                        />
                        <input
                          value={org.contact.email || ""}
                          onChange={(event) =>
                            updateContact(org.id, "email", event.target.value)
                          }
                          placeholder="Email"
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
                        />
                      </div>

                      <textarea
                        value={org.notes}
                        onChange={(event) => updateNotes(org.id, event.target.value)}
                        placeholder="Meeting notes / next follow-up..."
                        className="min-h-32 w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={org.contact.phone ? `tel:${org.contact.phone}` : undefined}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </a>

                        <a
                          href={
                            org.contact.email
                              ? `mailto:${org.contact.email}?subject=VI Guide Tourism Partnership&body=${encodeURIComponent(
                                  buildFollowUp(org, org.stage, org.notes)
                                )}`
                              : undefined
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyFollowUp(org, org.stage, org.notes)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
                      >
                        {copiedId === org.id ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clipboard className="h-4 w-4" />
                        )}
                        {copiedId === org.id ? "Copied" : "Copy Follow-Up"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function Bullet({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          muted ? "text-stone-400" : "text-emerald-700"
        }`}
      />
      <p className={`text-sm font-bold leading-6 ${muted ? "text-stone-600" : "text-emerald-950"}`}>
        {text}
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 truncate text-3xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

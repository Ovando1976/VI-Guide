import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Bus,
  Car,
  CheckCircle2,
  ClipboardList,
  Compass,
  Hotel,
  Landmark,
  Map,
  MapPin,
  Megaphone,
  Plane,
  Ship,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type AllianceGroup = {
  id: string;
  name: string;
  icon: LucideIcon;
  priority: "Primary" | "Strategic" | "Growth";
  pitch: string;
  gets: string[];
  needs: string[];
  demoRoutes: { label: string; path: string }[];
};

const allianceGroups: AllianceGroup[] = [
  {
    id: "taxi-association",
    name: "Taxi Association",
    icon: Car,
    priority: "Primary",
    pitch:
      "Position the platform as a tariff-aware ride demand, dispatch, and visitor pickup coordination system.",
    gets: [
      "Official tariff visibility",
      "Dispatcher review for custom trips",
      "Ride requests from map destinations",
      "Visitor pickup clarity at hotels, ports, beaches, and attractions",
      "Proof that the app can generate ride demand",
    ],
    needs: [
      "Tariff validation",
      "Driver/dispatcher workflow feedback",
      "Pilot dispatch partners",
      "Rules for how requests should be routed",
    ],
    demoRoutes: [
      { label: "Taxi Demo", path: "/taxi-demo" },
      { label: "Mobility", path: "/mobility" },
      { label: "Dispatch", path: "/mobility/dispatch" },
      { label: "Map", path: "/map" },
    ],
  },
  {
    id: "hotels",
    name: "Hotels & Resorts",
    icon: Hotel,
    priority: "Primary",
    pitch:
      "Give hotels a guest-facing concierge map with transportation handoff, local recommendations, and partner visibility.",
    gets: [
      "Guest discovery map",
      "Ride request handoff",
      "Recommended restaurants, tours, beaches, and attractions",
      "Front-desk support tool",
      "Visitor activity proof for hotel partners",
    ],
    needs: [
      "Hotel pickup/dropoff standards",
      "Concierge workflow feedback",
      "Preferred vendor lists",
      "Guest mobility pain points",
    ],
    demoRoutes: [
      { label: "Map", path: "/map" },
      { label: "Mobility", path: "/mobility" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Business Proof", path: "/business-proof" },
    ],
  },
  {
    id: "hotel-association",
    name: "USVI Hotel Association",
    icon: Building2,
    priority: "Strategic",
    pitch:
      "Frame the app as shared visitor infrastructure that helps hotels, taxis, attractions, restaurants, and tourism vendors coordinate better.",
    gets: [
      "Territory-wide visitor movement layer",
      "Hotel partner network visibility",
      "Shared tourism technology story",
      "Better guest routing to local businesses",
      "Data-backed proof of visitor intent",
    ],
    needs: [
      "Association-level endorsement",
      "Hotel member introductions",
      "Pilot property selection",
      "Feedback on visitor experience priorities",
    ],
    demoRoutes: [
      { label: "Tourism Alliance", path: "/tourism-alliance" },
      { label: "Map Intent", path: "/map-intent" },
      { label: "Partner Pipeline", path: "/partner-pipeline" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
  },
  {
    id: "stt-stj-chamber",
    name: "St. Thomas-St. John Chamber",
    icon: Landmark,
    priority: "Strategic",
    pitch:
      "Show the chamber how member businesses can move from static listings to measurable visitor actions.",
    gets: [
      "Member visibility engine",
      "Business proof cards",
      "Visitor-intent dashboard",
      "Partner onboarding workflow",
      "Chamber-wide digital directory concept",
    ],
    needs: [
      "Member categories",
      "Pilot member list",
      "Chamber endorsement path",
      "Feedback on pricing and member benefits",
    ],
    demoRoutes: [
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Close", path: "/partner-close" },
      { label: "Partner Pipeline", path: "/partner-pipeline" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
  },
  {
    id: "stx-chamber",
    name: "St. Croix Chamber",
    icon: Landmark,
    priority: "Strategic",
    pitch:
      "Give St. Croix businesses a dedicated path into the same map, mobility, visitor-intent, and partner directory ecosystem.",
    gets: [
      "St. Croix business discovery",
      "Map visibility for attractions and restaurants",
      "Visitor action tracking",
      "Partner sales pipeline",
      "Future island-specific business dashboard",
    ],
    needs: [
      "St. Croix pilot businesses",
      "Local categories and districts",
      "Tourism routes and attraction priorities",
      "Chamber member feedback",
    ],
    demoRoutes: [
      { label: "Map", path: "/map" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Pipeline", path: "/partner-pipeline" },
    ],
  },
  {
    id: "tour-operators",
    name: "Tour Operators & Attractions",
    icon: Compass,
    priority: "Growth",
    pitch:
      "Help tourism businesses get discovered, added to visitor plans, routed to, and connected to ride demand.",
    gets: [
      "Map placement",
      "Directions clicks",
      "Day-plan saves",
      "Ride-request attribution",
      "Business proof for partner ROI",
    ],
    needs: [
      "Tour locations",
      "Booking/contact details",
      "Featured offers",
      "Images and descriptions",
    ],
    demoRoutes: [
      { label: "Partner Onboarding", path: "/partner-onboarding" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Map Intent", path: "/map-intent" },
      { label: "Map", path: "/map" },
    ],
  },
  {
    id: "restaurants-retail",
    name: "Restaurants, Beach Bars & Retail",
    icon: Store,
    priority: "Growth",
    pitch:
      "Turn map discovery into calls, visits, directions, itinerary saves, and ride requests.",
    gets: [
      "Claimed listing",
      "Featured offer",
      "Visitor action tracking",
      "Partner directory presence",
      "Map-to-ride conversion path",
    ],
    needs: [
      "Business details",
      "Menu/offer link",
      "Photos",
      "Contact and location data",
    ],
    demoRoutes: [
      { label: "Partner Close", path: "/partner-close" },
      { label: "Partner Onboarding", path: "/partner-onboarding" },
      { label: "Partner Directory", path: "/partner-directory" },
      { label: "Map", path: "/map" },
    ],
  },
  {
    id: "cruise-partners",
    name: "Cruise-Facing Partners",
    icon: Ship,
    priority: "Growth",
    pitch:
      "Serve visitors with limited time by connecting cruise arrival context to fast discovery, routes, day plans, and rides.",
    gets: [
      "Fast visitor itinerary planning",
      "Cruise day discovery",
      "Port-to-business routing",
      "Taxi handoff",
      "Featured partner placement",
    ],
    needs: [
      "Cruise visitor priorities",
      "Port pickup rules",
      "Time-limited itinerary examples",
      "Preferred partner offers",
    ],
    demoRoutes: [
      { label: "Map", path: "/map" },
      { label: "Mobility", path: "/mobility" },
      { label: "Business Proof", path: "/business-proof" },
      { label: "Partner Directory", path: "/partner-directory" },
    ],
  },
];

const roadmap = [
  {
    title: "Phase 1",
    label: "Taxi + Hotels",
    icon: Car,
    text: "Secure taxi workflow validation and hotel concierge pilot interest.",
  },
  {
    title: "Phase 2",
    label: "Chambers + Associations",
    icon: Users,
    text: "Use the partner sales engine to pitch member visibility and visitor-intent proof.",
  },
  {
    title: "Phase 3",
    label: "Tourism Businesses",
    icon: Store,
    text: "Onboard the first 25 businesses into active and featured listings.",
  },
  {
    title: "Phase 4",
    label: "Territory Network",
    icon: Map,
    text: "Connect map discovery, mobility, partner directory, and intent analytics into one tourism platform.",
  },
];

export default function TourismAllianceHub() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Megaphone className="h-4 w-4" />
                Tourism Alliance Hub
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Build buy-in from the groups that move tourism.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                This page organizes the pitch for the Taxi Association, hotels,
                hotel association, chambers of commerce, tourism businesses,
                attractions, restaurants, and cruise-facing partners.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <button
                onClick={() => navigate("/meeting-mode")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Meeting Mode
              </button>

              <button
                onClick={() => navigate("/taxi-demo")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Taxi Demo
              </button>
              <button
                onClick={() => navigate("/alliance-pipeline")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Alliance Pipeline
              </button>

              <button
                onClick={() => navigate("/partner-pipeline")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Partner Pipeline
              </button>
              <button
                onClick={() => navigate("/partner-directory")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Directory
              </button>
              <button
                onClick={() => navigate("/map")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Map
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <HeroStat label="Partner groups" value={allianceGroups.length} icon={Users} />
            <HeroStat label="Primary targets" value={2} icon={Sparkles} />
            <HeroStat label="Demo routes" value={12} icon={ClipboardList} />
            <HeroStat label="Goal" value="25 partners" icon={BadgeDollarSign} />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Core story
              </p>
              <h2 className="mt-2 text-3xl font-black">
                One platform, different benefits.
              </h2>

              <div className="mt-5 space-y-3">
                <StoryPoint
                  icon={MapPin}
                  title="Visitors discover"
                  text="The map helps visitors find businesses, beaches, attractions, hotels, and transportation points."
                />
                <StoryPoint
                  icon={Car}
                  title="Taxis move demand"
                  text="Ride requests connect map destinations to tariff-aware mobility and dispatcher review."
                />
                <StoryPoint
                  icon={Store}
                  title="Businesses get proof"
                  text="Partner dashboards show marker taps, directions, day-plan saves, and ride-request starts."
                />
                <StoryPoint
                  icon={Users}
                  title="Associations scale it"
                  text="Hotel and chamber groups can bring many businesses into one shared tourism network."
                />
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <Plane className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-3xl font-black">Meeting order</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                Start where the operational pain is strongest: transportation
                and hotel guest movement. Then bring chambers and tourism
                groups in once the demo story is clear.
              </p>

              <div className="mt-5 space-y-3">
                {roadmap.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-2xl bg-white/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-turquoise text-ink">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-turquoise">
                            {item.title}
                          </p>
                          <h3 className="mt-1 text-lg font-black">{item.label}</h3>
                          <p className="mt-1 text-sm font-bold leading-6 text-white/60">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="grid gap-5">
            {allianceGroups.map((group) => (
              <AllianceCard key={group.id} group={group} onNavigate={navigate} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function AllianceCard({
  group,
  onNavigate,
}: {
  group: AllianceGroup;
  onNavigate: (path: string) => void;
}) {
  const Icon = group.icon;

  return (
    <article className="rounded-[2.25rem] bg-white p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
            <Icon className="h-7 w-7" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              {group.priority} partner
            </p>
            <h3 className="mt-1 text-2xl font-black">{group.name}</h3>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-stone-600">
              {group.pitch}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            What they get
          </p>
          <div className="mt-3 space-y-2">
            {group.gets.map((item) => (
              <Bullet key={item} text={item} />
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-stone-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
            What we need
          </p>
          <div className="mt-3 space-y-2">
            {group.needs.map((item) => (
              <Bullet key={item} text={item} muted />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {group.demoRoutes.map((route) => (
          <button
            key={`${group.id}-${route.path}`}
            type="button"
            onClick={() => onNavigate(route.path)}
            className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white active:scale-95"
          >
            {route.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </article>
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

function StoryPoint({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-stone-50 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="mt-1 text-sm font-bold leading-6 text-stone-600">{text}</p>
        </div>
      </div>
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

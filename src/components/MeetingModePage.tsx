import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  Compass,
  Hotel,
  Landmark,
  Map,
  MapPin,
  Megaphone,
  PlayCircle,
  Rocket,
  Ship,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type AudienceId =
  | "taxi"
  | "hotel"
  | "chamber"
  | "tourism"
  | "business"
  | "cruise";

type MeetingAudience = {
  id: AudienceId;
  label: string;
  icon: LucideIcon;
  headline: string;
  opening: string;
  pain: string[];
  solution: string[];
  demoPath: { label: string; path: string; reason: string }[];
  ask: string[];
  close: string;
};

const audiences: MeetingAudience[] = [
  {
    id: "taxi",
    label: "Taxi Association",
    icon: Car,
    headline: "A visitor-to-ride system that respects local taxi rules.",
    opening:
      "We are building a Virgin Islands visitor platform that connects map discovery to tariff-aware ride requests and dispatcher review.",
    pain: [
      "Visitors do not always know where to request rides.",
      "Pickup locations at hotels, beaches, ports, and attractions can be unclear.",
      "Unofficial pricing confusion can hurt trust.",
      "Dispatchers need a cleaner way to review custom trips.",
    ],
    solution: [
      "Map destinations connect directly to ride requests.",
      "Official tariff logic stays visible.",
      "Custom trips can be dispatcher-reviewed instead of guessed.",
      "Taxi partners become part of the visitor journey, not an afterthought.",
    ],
    demoPath: [
      { label: "Map", path: "/map", reason: "Show visitor destination discovery." },
      { label: "Mobility", path: "/mobility", reason: "Show ride request flow." },
      { label: "Dispatch", path: "/mobility/dispatch", reason: "Show command center." },
      { label: "Taxi Demo", path: "/taxi-demo", reason: "Show association-ready story." },
    ],
    ask: [
      "Review the tariff and dispatcher workflow.",
      "Identify a small pilot group.",
      "Confirm routing rules for ride requests.",
      "Help define how hotels and ports should hand off pickups.",
    ],
    close:
      "The goal is not to replace taxi operators. The goal is to make the visitor demand easier to see, quote, and organize.",
  },
  {
    id: "hotel",
    label: "Hotels / Hotel Association",
    icon: Hotel,
    headline: "A concierge and mobility layer for hotel guests.",
    opening:
      "Hotels need a better way to help guests discover places, plan movement, and request transportation without leaving staff to solve everything manually.",
    pain: [
      "Guests ask the same local discovery and transportation questions repeatedly.",
      "Front desks need reliable business and transportation recommendations.",
      "Hotels want a better guest experience without building their own app.",
      "Preferred vendors need measurable visibility.",
    ],
    solution: [
      "Guest-facing map for beaches, restaurants, tours, attractions, and partners.",
      "Ride request handoff from hotel or destination context.",
      "Partner directory for trusted local businesses.",
      "Visitor-intent proof to show what guests actually engage with.",
    ],
    demoPath: [
      { label: "Map", path: "/map", reason: "Show guest discovery." },
      { label: "Mobility", path: "/mobility", reason: "Show ride handoff." },
      { label: "Partner Directory", path: "/partner-directory", reason: "Show local network." },
      { label: "Tourism Alliance", path: "/tourism-alliance", reason: "Show territory-wide fit." },
    ],
    ask: [
      "Identify hotel pilot properties.",
      "Share common guest mobility pain points.",
      "Provide preferred vendor categories.",
      "Help define front-desk concierge workflow.",
    ],
    close:
      "This can become a shared hotel guest experience layer that supports local businesses and transportation partners.",
  },
  {
    id: "chamber",
    label: "Chambers of Commerce",
    icon: Landmark,
    headline: "A measurable visibility engine for chamber members.",
    opening:
      "Chamber members need more than static listings. They need proof that visitors are seeing, saving, visiting, and requesting rides to their businesses.",
    pain: [
      "Static directories do not show visitor intent.",
      "Small businesses need affordable digital visibility.",
      "Members need a reason to participate beyond another listing.",
      "Chambers need a territory-specific technology story.",
    ],
    solution: [
      "Business proof dashboard shows taps, directions, day plans, and ride starts.",
      "Partner onboarding converts businesses into active listings.",
      "Partner directory organizes member businesses.",
      "Map placement connects discovery to real visitor action.",
    ],
    demoPath: [
      { label: "Business Proof", path: "/business-proof", reason: "Show measurable ROI." },
      { label: "Partner Close", path: "/partner-close", reason: "Show sales workflow." },
      { label: "Partner Pipeline", path: "/partner-pipeline", reason: "Show partner management." },
      { label: "Partner Directory", path: "/partner-directory", reason: "Show member directory." },
    ],
    ask: [
      "Provide a pilot member list.",
      "Help organize businesses by category and island.",
      "Review pricing and member benefit positioning.",
      "Introduce the platform to chamber leadership or committees.",
    ],
    close:
      "This gives the chambers a modern way to help members convert tourism attention into measurable business activity.",
  },
  {
    id: "tourism",
    label: "Tourism Stakeholders",
    icon: Users,
    headline: "Shared visitor infrastructure for the Virgin Islands.",
    opening:
      "The Virgin Islands needs a connected digital layer for discovery, transportation, local business support, and visitor movement.",
    pain: [
      "Visitor discovery, transport, and business promotion are fragmented.",
      "Small businesses do not always know where visitor attention is going.",
      "Transportation clarity affects the visitor experience.",
      "Tourism partners need shared infrastructure, not isolated tools.",
    ],
    solution: [
      "One map for discovery and planning.",
      "One mobility flow for ride requests and dispatcher review.",
      "One partner system for local business onboarding.",
      "One alliance pipeline for hotels, taxis, chambers, and tourism groups.",
    ],
    demoPath: [
      { label: "Tourism Alliance", path: "/tourism-alliance", reason: "Show ecosystem story." },
      { label: "Alliance Pipeline", path: "/alliance-pipeline", reason: "Show outreach management." },
      { label: "Map Intent", path: "/map-intent", reason: "Show visitor behavior." },
      { label: "Map", path: "/map", reason: "Show product core." },
    ],
    ask: [
      "Help validate the territory-wide tourism use case.",
      "Identify the right public/private stakeholders.",
      "Support a pilot across taxi, hotel, and business groups.",
      "Define what visitor data and reporting matters most.",
    ],
    close:
      "This can become a practical tourism operating layer that supports visitors, transport, and local businesses at the same time.",
  },
  {
    id: "business",
    label: "Tourism Businesses",
    icon: Store,
    headline: "Turn visitor attention into directions, day plans, and rides.",
    opening:
      "Restaurants, beach bars, attractions, retail shops, and tour operators need visibility that leads to action.",
    pain: [
      "Visitors may pass nearby businesses without discovering them.",
      "Ads and listings rarely prove real visitor intent.",
      "Small businesses need affordable promotion.",
      "Transportation access affects whether visitors actually arrive.",
    ],
    solution: [
      "Claimed partner listing.",
      "Featured offer and category placement.",
      "Directions, day-plan, and ride-request tracking.",
      "Business proof dashboard to show value.",
    ],
    demoPath: [
      { label: "Map", path: "/map", reason: "Show discovery." },
      { label: "Business Proof", path: "/business-proof", reason: "Show ROI proof." },
      { label: "Partner Onboarding", path: "/partner-onboarding", reason: "Show setup." },
      { label: "Partner Directory", path: "/partner-directory", reason: "Show active listing." },
    ],
    ask: [
      "Provide business details, photos, address, and offer.",
      "Choose a partner plan.",
      "Validate listing category and location.",
      "Join the first 25 founding partners.",
    ],
    close:
      "The sales promise is simple: we help visitors find you, plan you, route to you, and request rides to you.",
  },
  {
    id: "cruise",
    label: "Cruise-Facing Partners",
    icon: Ship,
    headline: "Fast discovery for visitors with limited time.",
    opening:
      "Cruise visitors need quick decisions, clear routing, and reliable transport handoff while they are on island.",
    pain: [
      "Cruise visitors have limited time.",
      "They need simple choices fast.",
      "Port-to-business routing can be confusing.",
      "Local partners need a better way to capture short-stay attention.",
    ],
    solution: [
      "Map-first discovery for nearby experiences.",
      "Day-plan saves for short itineraries.",
      "Ride request handoff from port or business destination.",
      "Featured partner placement for cruise-facing businesses.",
    ],
    demoPath: [
      { label: "Map", path: "/map", reason: "Show quick discovery." },
      { label: "Mobility", path: "/mobility", reason: "Show ride handoff." },
      { label: "Partner Directory", path: "/partner-directory", reason: "Show partner network." },
      { label: "Business Proof", path: "/business-proof", reason: "Show visitor intent." },
    ],
    ask: [
      "Identify port-area priority businesses.",
      "Define cruise-day itinerary examples.",
      "Confirm pickup and timing constraints.",
      "Recruit initial cruise-facing partners.",
    ],
    close:
      "This helps short-stay visitors make faster choices while creating measurable value for local businesses and transportation partners.",
  },
];

const quickLinks = [
  { label: "Map", path: "/map", icon: Map },
  { label: "Mobility", path: "/mobility", icon: Car },
  { label: "Dispatch", path: "/mobility/dispatch", icon: ClipboardList },
  { label: "Map Intent", path: "/map-intent", icon: MapPin },
  { label: "Business Proof", path: "/business-proof", icon: BadgeDollarSign },
  { label: "Direct Booking", path: "/direct-booking", icon: BedDouble },
  { label: "Partner Pipeline", path: "/partner-pipeline", icon: Rocket },
  { label: "Alliance Pipeline", path: "/alliance-pipeline", icon: Users },
  { label: "Tourism Alliance", path: "/tourism-alliance", icon: Megaphone },
];

export default function MeetingModePage() {
  const navigate = useNavigate();
  const [audienceId, setAudienceId] = useState<AudienceId>("taxi");

  const audience = useMemo(
    () => audiences.find((item) => item.id === audienceId) || audiences[0],
    [audienceId]
  );

  const AudienceIcon = audience.icon;

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <PlayCircle className="h-4 w-4" />
                Meeting Mode
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                One clean pitch path for every room.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Select the audience, follow the story, open the right demo
                screens, and close with a specific ask.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-5 text-ink lg:w-[360px]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Current audience
              </p>
              <div className="mt-4 flex items-start gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                  <AudienceIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-black">{audience.label}</p>
                  <p className="mt-1 text-sm font-bold text-stone-500">
                    {audience.headline}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <HeroStat label="Pitch audience" value={audience.label} icon={AudienceIcon} />
            <HeroStat label="Demo stops" value={audience.demoPath.length} icon={ClipboardList} />
            <HeroStat label="Core ask" value={audience.ask.length} icon={CheckCircle2} />
            <HeroStat label="Goal" value="Pilot buy-in" icon={Sparkles} />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Choose audience
              </p>

              <div className="mt-4 grid gap-2">
                {audiences.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === audienceId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAudienceId(item.id)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black active:scale-95 ${
                        active
                          ? "bg-emerald-950 text-white"
                          : "bg-stone-50 text-ink hover:bg-stone-100"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-turquoise" : "text-emerald-700"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-turquoise">
                Quick open
              </p>

              <div className="mt-4 grid gap-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <button
                      key={link.path}
                      type="button"
                      onClick={() => navigate(link.path)}
                      className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white active:scale-95"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-turquoise" />
                        {link.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Opening
              </p>
              <h2 className="mt-2 text-4xl font-black leading-tight">
                {audience.headline}
              </h2>
              <p className="mt-4 text-base font-bold leading-8 text-stone-600">
                {audience.opening}
              </p>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <PitchBlock
                title="Pain points"
                tone="stone"
                items={audience.pain}
                icon={MapPin}
              />
              <PitchBlock
                title="Our solution"
                tone="emerald"
                items={audience.solution}
                icon={Sparkles}
              />
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-turquoise">
                Live demo path
              </p>
              <h2 className="mt-2 text-3xl font-black">Open these screens in order.</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {audience.demoPath.map((step, index) => (
                  <button
                    key={`${step.path}-${index}`}
                    type="button"
                    onClick={() => navigate(step.path)}
                    className="rounded-[1.75rem] bg-white p-4 text-left text-ink shadow-xl active:scale-95"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                      Demo stop {index + 1}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <h3 className="text-2xl font-black">{step.label}</h3>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
                      {step.reason}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  The ask
                </p>
                <h2 className="mt-2 text-3xl font-black">What we need from them</h2>

                <div className="mt-5 space-y-3">
                  {audience.ask.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <p className="text-sm font-bold leading-6 text-stone-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2.25rem] bg-turquoise p-5 text-ink shadow-xl">
                <Rocket className="h-9 w-9" />
                <h2 className="mt-4 text-3xl font-black">Close</h2>
                <p className="mt-3 text-sm font-black leading-7">
                  {audience.close}
                </p>

                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/alliance-pipeline")}
                    className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                  >
                    Update Alliance Pipeline
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/tourism-alliance")}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
                  >
                    Open Tourism Alliance Hub
                  </button>
                </div>
              </section>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function PitchBlock({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
  tone: "stone" | "emerald";
}) {
  return (
    <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-12 w-12 place-items-center rounded-2xl ${
            tone === "emerald" ? "bg-emerald-950 text-turquoise" : "bg-stone-100 text-emerald-700"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-3xl font-black">{title}</h2>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm font-bold leading-6 text-stone-700">{item}</p>
          </div>
        ))}
      </div>
    </section>
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
      <p className="mt-4 truncate text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

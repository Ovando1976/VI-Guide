import { Route, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { PlaceActionBar } from "@/components/place/place-action-bar";
import {
  inferPlaceCapabilities,
  PlaceCapabilityGrid,
  type PlaceCapability,
} from "@/components/place/place-capability-grid";
import {
  UnifiedPlaceCategoryExtension,
  UnifiedPlaceContinuity,
  UnifiedPlaceQuickFacts,
  type UnifiedPlaceFact,
  type UnifiedPlaceKind,
  type UnifiedPlaceSection,
} from "@/components/place/unified-place-sections";
import type { JourneyStopInput } from "@/lib/journey-planner";

type HeroCallout = { eyebrow: string; description: string };
type Props = {
  name: string;
  eyebrow: string;
  description: string;
  hero: ReactNode;
  meta?: ReactNode;
  heroCallout?: HeroCallout;
  actions: {
    island: string;
    mapHref?: string;
    rideHref?: string;
    website?: string | null;
    conciergeHref?: string;
    bookingHref?: string;
    journeyStop?: JourneyStopInput;
  };
  kind?: UnifiedPlaceKind;
  quickFacts?: UnifiedPlaceFact[];
  categoryFacts?: UnifiedPlaceFact[];
  categorySections?: UnifiedPlaceSection[];
  categoryTitle?: string;
  capabilities?: PlaceCapability[];
  capabilityTitle?: string;
  capabilityDescription?: string;
  primary: ReactNode;
  aside?: ReactNode;
  below?: ReactNode;
  back?: ReactNode;
  share?: ReactNode;
  className?: string;
};

const DEFAULT_HERO_CALLOUT: HeroCallout = {
  eyebrow: "Make this stop part of the day",
  description:
    "Connect this destination with transportation, nearby recommendations, timing, and a backup plan.",
};

export function PremiumDetailShell({
  name,
  eyebrow,
  description,
  hero,
  meta,
  heroCallout = DEFAULT_HERO_CALLOUT,
  actions,
  kind,
  quickFacts = [],
  categoryFacts = [],
  categorySections = [],
  categoryTitle,
  capabilities,
  capabilityTitle,
  capabilityDescription,
  primary,
  aside,
  below,
  back,
  share,
  className = "",
}: Props) {
  const resolvedKind = kind ?? inferUnifiedKind(actions.journeyStop?.kind);
  const resolvedBookingHref = actions.bookingHref;
  const resolvedCapabilities =
    capabilities ??
    inferPlaceCapabilities({
      name,
      eyebrow,
      description,
      kind: resolvedKind,
      hasWebsite: Boolean(actions.website),
      hasBooking: Boolean(resolvedBookingHref),
    });
  const resolvedQuickFacts = quickFacts.length
    ? quickFacts
    : buildCapabilityFacts(actions);
  const resolvedCategoryFacts = categoryFacts.length
    ? categoryFacts
    : buildCategoryFacts(resolvedKind, actions);
  const conciergeHref =
    actions.conciergeHref ??
    buildConciergeHref(name, actions.island, resolvedKind);

  return (
    <main
      className={`min-h-screen bg-[#f8f4ea] px-4 py-5 pb-[calc(8rem+env(safe-area-inset-bottom))] text-[#043331] sm:px-6 lg:py-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <ViPublicHeader
          actionHref={conciergeHref}
          actionLabel="Ask VI Concierge"
          actionIcon={Sparkles}
          secondaryHref="/planner"
          secondaryLabel="My Trip"
        />

        {back || share ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>{back}</div>
            <div>{share}</div>
          </div>
        ) : (
          <div className="flex justify-end">
            <a
              href="/planner"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.16em] shadow-sm"
            >
              <Route className="h-4 w-4 text-teal-700" /> My Trip
            </a>
          </div>
        )}

        <section className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm lg:rounded-[40px]">
          <div className="grid lg:grid-cols-[1.25fr_.75fr]">
            <div className="min-h-[340px] sm:min-h-[440px] lg:min-h-[540px]">
              {hero}
            </div>
            <div className="flex flex-col justify-between bg-[linear-gradient(145deg,#043331_0%,#0b5d5b_62%,#14b8a6_100%)] p-7 text-white sm:p-10">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[.3em] text-[#fde68a]">
                  {eyebrow}
                </div>
                <h1 className="mt-4 text-4xl font-black italic leading-[.95] tracking-[-.045em] sm:text-5xl lg:text-6xl">
                  {name}
                </h1>
                <p className="mt-5 text-base font-semibold leading-7 text-white/80">
                  {description}
                </p>
                {meta ? <div className="mt-6">{meta}</div> : null}
              </div>
              <div className="mt-10 rounded-[24px] border border-white/15 bg-black/10 p-5 backdrop-blur-sm">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#fde68a]">
                  {heroCallout.eyebrow}
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                  {heroCallout.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        <PlaceActionBar
          name={name}
          island={actions.island}
          mapHref={actions.mapHref}
          rideHref={actions.rideHref}
          website={actions.website}
          conciergeHref={conciergeHref}
          bookingHref={resolvedBookingHref}
          journeyStop={actions.journeyStop}
        />

        <UnifiedPlaceQuickFacts facts={resolvedQuickFacts} />

        <PlaceCapabilityGrid
          capabilities={resolvedCapabilities}
          name={name}
          island={actions.island}
          mapHref={actions.mapHref}
          rideHref={actions.rideHref}
          website={actions.website}
          bookingHref={resolvedBookingHref}
          journeyStop={actions.journeyStop}
          title={capabilityTitle}
          description={capabilityDescription}
        />

        <UnifiedPlaceCategoryExtension
          kind={resolvedKind}
          title={categoryTitle}
          facts={resolvedCategoryFacts}
          sections={categorySections}
        />

        <section
          className={aside ? "grid gap-7 lg:grid-cols-[1fr_380px]" : undefined}
        >
          <div className="space-y-7">{primary}</div>
          {aside ? (
            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              {aside}
            </aside>
          ) : null}
        </section>

        <UnifiedPlaceContinuity
          mapHref={actions.mapHref}
          rideHref={actions.rideHref}
          conciergeHref={conciergeHref}
          bookingHref={resolvedBookingHref}
        />

        {below}
      </div>
    </main>
  );
}

function inferUnifiedKind(kind?: string): UnifiedPlaceKind {
  if (kind === "beach") return "beach";
  if (kind === "stay" || kind === "hotel" || kind === "accommodation") {
    return "stay";
  }
  if (kind === "restaurant" || kind === "dining") return "restaurant";
  if (kind === "historic" || kind === "heritage") return "historic";
  if (kind === "fishing" || kind === "fish") return "fishing";
  if (kind === "attraction" || kind === "activity" || kind === "tour") {
    return "attraction";
  }
  return "place";
}

function buildCapabilityFacts(actions: Props["actions"]): UnifiedPlaceFact[] {
  return [
    { label: "Island", value: actions.island },
    actions.mapHref
      ? {
          label: "Map",
          value: "Ready",
          note: "Open this destination in the Living Map.",
        }
      : {
          label: "Map",
          value: "Location pending",
          note: "Map coverage is still being completed.",
        },
    actions.rideHref
      ? {
          label: "Transportation",
          value: "Plan a ride",
          note: "Carry this destination into Mobility.",
        }
      : {
          label: "Transportation",
          value: "Ask Concierge",
          note: "Get locally grounded movement guidance.",
        },
    actions.journeyStop
      ? {
          label: "Trip planning",
          value: "Saveable",
          note: "Add this stop to an itinerary.",
        }
      : {
          label: "Trip planning",
          value: "Explore",
          note: "Continue through nearby recommendations.",
        },
  ];
}

function buildCategoryFacts(
  kind: UnifiedPlaceKind,
  actions: Props["actions"],
): UnifiedPlaceFact[] {
  const resolvedBookingHref = actions.bookingHref;
  const shared: UnifiedPlaceFact[] = [
    {
      label: "Local context",
      value: "Concierge ready",
      note: "Ask for timing, nearby options, and a practical plan.",
    },
    {
      label: "Route continuity",
      value: actions.mapHref ? "Connected" : "Planning",
      note: actions.mapHref
        ? "Move directly between this page and the Living Map."
        : "Location coverage is still being completed.",
    },
  ];

  if (kind === "beach") {
    return [
      ...shared,
      {
        label: "Beach planning",
        value: "Access first",
        note: "Confirm conditions, facilities, parking, and the safest arrival plan before leaving.",
      },
      {
        label: "Ride home",
        value: actions.rideHref ? "Available" : "Ask Concierge",
        note: "Plan return transportation before low-light or peak-demand periods.",
      },
    ];
  }

  if (kind === "stay") {
    return [
      ...shared,
      {
        label: "Stay planning",
        value: "Trip connected",
        note: "Keep check-in, nearby plans, and transport together.",
      },
      {
        label: "Booking",
        value: resolvedBookingHref ? "Available" : "Check options",
        note: "Use verified booking or contact actions when supplied.",
      },
    ];
  }

  if (kind === "restaurant") {
    return [
      ...shared,
      {
        label: "Dining plan",
        value: "Day aware",
        note: "Pair the meal with nearby activities and travel time.",
      },
      {
        label: "Return travel",
        value: actions.rideHref ? "Available" : "Plan ahead",
        note: "Keep a safe ride option attached to evening plans.",
      },
    ];
  }

  return shared;
}

function buildConciergeHref(
  name: string,
  island: string,
  kind: UnifiedPlaceKind,
) {
  const prompt = `Help me plan a visit to ${name} on ${island}. Treat it as a ${kind} stop. Include the best timing, practical access, nearby food or activities, transportation, and a backup option.`;
  return `/concierge?open=true&prompt=${encodeURIComponent(prompt)}`;
}

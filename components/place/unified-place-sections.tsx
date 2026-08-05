import Link from "next/link";
import type { ReactNode } from "react";
import {
  BedDouble,
  Clock3,
  Fish,
  History,
  Landmark,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

export type UnifiedPlaceKind =
  | "beach"
  | "stay"
  | "restaurant"
  | "historic"
  | "fishing"
  | "attraction"
  | "place";

export type UnifiedPlaceFact = {
  label: string;
  value: string;
  note?: string;
};

export type UnifiedPlaceSection = {
  title: string;
  description?: string;
  content: ReactNode;
};

type QuickFactsProps = {
  facts: UnifiedPlaceFact[];
};

export function UnifiedPlaceQuickFacts({ facts }: QuickFactsProps) {
  if (!facts.length) return null;

  return (
    <section className="rounded-[28px] border border-[#dbe7e3] bg-white p-6 shadow-[0_18px_48px_rgba(4,51,49,.07)] sm:p-8">
      <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#a85b16]">
        Quick facts
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map((fact) => (
          <article
            key={`${fact.label}-${fact.value}`}
            className="rounded-[22px] border border-[#dce8e4] bg-[#fbf8f1] p-5"
          >
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0f766e]">
              {fact.label}
            </div>
            <div className="mt-2 text-lg font-black tracking-[-.02em] text-[#073b39]">
              {fact.value}
            </div>
            {fact.note ? (
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
                {fact.note}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

type CategoryExtensionProps = {
  kind: UnifiedPlaceKind;
  title?: string;
  facts?: UnifiedPlaceFact[];
  sections?: UnifiedPlaceSection[];
};

const KIND_DETAILS: Record<
  UnifiedPlaceKind,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: typeof Waves;
  }
> = {
  beach: {
    eyebrow: "Beach intelligence",
    title: "Plan the shoreline, not just the stop.",
    description:
      "Surface conditions, facilities, access, safety, snorkeling, timing, and transportation in one consistent place experience.",
    icon: Waves,
  },
  stay: {
    eyebrow: "Stay intelligence",
    title: "From room choice to island movement.",
    description:
      "Keep amenities, check-in details, booking actions, nearby experiences, and transportation together.",
    icon: BedDouble,
  },
  restaurant: {
    eyebrow: "Dining intelligence",
    title: "Make the meal fit the day.",
    description:
      "Connect cuisine, hours, reservations, parking, nearby plans, and a safe ride home.",
    icon: UtensilsCrossed,
  },
  historic: {
    eyebrow: "Heritage intelligence",
    title: "Place history back into the landscape.",
    description:
      "Present cultural context, timelines, archival material, related sites, and map continuity together.",
    icon: History,
  },
  fishing: {
    eyebrow: "Fishing intelligence",
    title: "Plan around species, seasons, access, and rules.",
    description:
      "Bring regulations, launch points, timing, nearby services, and conditions into one responsible planning surface.",
    icon: Fish,
  },
  attraction: {
    eyebrow: "Experience intelligence",
    title: "Turn an attraction into a connected itinerary stop.",
    description:
      "Combine timing, tickets, nearby places, route planning, transportation, and Concierge guidance.",
    icon: Landmark,
  },
  place: {
    eyebrow: "Place intelligence",
    title: "Everything needed to understand and use this place.",
    description:
      "Keep location, access, context, nearby options, transportation, and Concierge actions synchronized.",
    icon: MapPin,
  },
};

export function UnifiedPlaceCategoryExtension({
  kind,
  title,
  facts = [],
  sections = [],
}: CategoryExtensionProps) {
  const detail = KIND_DETAILS[kind];
  const Icon = detail.icon;

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#d8e5e1] bg-white shadow-[0_22px_60px_rgba(4,51,49,.08)]">
      <div className="grid gap-0 lg:grid-cols-[.72fr_1.28fr]">
        <div className="bg-[linear-gradient(145deg,#073b39_0%,#0f766e_70%,#14b8a6_100%)] p-7 text-white sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/12">
            <Icon size={25} aria-hidden="true" />
          </span>
          <div className="mt-6 text-[10px] font-black uppercase tracking-[.24em] text-[#fde68a]">
            {detail.eyebrow}
          </div>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-[1.02] tracking-[-.035em]">
            {title ?? detail.title}
          </h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-white/75">
            {detail.description}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {facts.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => (
                <article
                  key={`${fact.label}-${fact.value}`}
                  className="rounded-[22px] border border-[#dce8e4] bg-[#fbf8f1] p-5"
                >
                  <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0f766e]">
                    {fact.label}
                  </div>
                  <div className="mt-2 text-lg font-black text-[#073b39]">
                    {fact.value}
                  </div>
                  {fact.note ? (
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
                      {fact.note}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {sections.length ? (
            <div className={facts.length ? "mt-6 space-y-4" : "space-y-4"}>
              {sections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-[22px] border border-[#dce8e4] p-5"
                >
                  <h3 className="text-lg font-black text-[#073b39]">
                    {section.title}
                  </h3>
                  {section.description ? (
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {section.description}
                    </p>
                  ) : null}
                  <div className="mt-4">{section.content}</div>
                </article>
              ))}
            </div>
          ) : null}

          {!facts.length && !sections.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Placeholder icon={Clock3} title="Best timing" text="Add category-aware timing guidance here." />
              <Placeholder icon={ShieldCheck} title="Access & safety" text="Add verified access, safety, and operating details here." />
              <Placeholder icon={Navigation} title="Transportation" text="Connect route planning and ride booking." />
              <Placeholder icon={Sparkles} title="Concierge context" text="Ground VI Concierge in this destination." />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type ContinuityProps = {
  mapHref?: string;
  rideHref?: string;
  conciergeHref?: string;
  bookingHref?: string;
};

export function UnifiedPlaceContinuity({
  mapHref,
  rideHref,
  conciergeHref,
  bookingHref,
}: ContinuityProps) {
  const actions = [
    mapHref ? { label: "Open on map", href: mapHref, icon: MapPin } : null,
    rideHref ? { label: "Plan transportation", href: rideHref, icon: Navigation } : null,
    conciergeHref ? { label: "Ask VI Concierge", href: conciergeHref, icon: Sparkles } : null,
    bookingHref ? { label: "Book or reserve", href: bookingHref, icon: Clock3 } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: typeof MapPin }>;

  if (!actions.length) return null;

  return (
    <section className="rounded-[28px] border border-[#dbe7e3] bg-[#073b39] p-6 text-white shadow-[0_24px_70px_rgba(4,51,49,.16)] sm:p-8">
      <div className="text-[10px] font-black uppercase tracking-[.24em] text-[#f5c451]">
        Continue the journey
      </div>
      <h2 className="mt-3 font-serif text-3xl font-bold tracking-[-.035em]">
        Move naturally from place to plan.
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-[20px] border border-white/15 bg-white/10 px-4 py-4 text-sm font-black transition hover:bg-white/16"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f5c451] text-[#073b39]">
              <Icon size={18} aria-hidden="true" />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Placeholder({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[22px] border border-[#dce8e4] bg-[#fbf8f1] p-5">
      <Icon size={20} className="text-[#0f766e]" aria-hidden="true" />
      <h3 className="mt-3 text-base font-black text-[#073b39]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{text}</p>
    </article>
  );
}

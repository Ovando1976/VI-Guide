import Link from "next/link";
import { ExternalLink, Map, Navigation, Sparkles } from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import type { JourneyStopInput } from "@/lib/journey-planner";

type Props = {
  name: string;
  island: string;
  mapHref?: string;
  rideHref?: string;
  website?: string | null;
  journeyStop?: JourneyStopInput;
  className?: string;
};

export function PlaceActionBar({
  name,
  island,
  mapHref,
  rideHref,
  website,
  journeyStop,
  className = "",
}: Props) {
  const conciergeHref = `/map?concierge=open&prompt=${encodeURIComponent(
    `Plan a complete island experience around ${name} on ${island}, including transportation, nearby places, timing, and a backup option.`,
  )}`;

  return (
    <section
      className={`rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      aria-label={`Actions for ${name}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {mapHref ? <Action href={mapHref} icon={Map} label="View on map" /> : null}
        {rideHref ? <Action href={rideHref} icon={Navigation} label="Plan a ride" accent /> : null}
        {journeyStop ? <AddToJourneyButton stop={journeyStop} /> : null}
        <Action href={conciergeHref} icon={Sparkles} label="Plan my day" />
        {website ? <Action href={website} icon={ExternalLink} label="Official website" external /> : null}
      </div>
    </section>
  );
}

function Action({
  href,
  icon: Icon,
  label,
  accent = false,
  external = false,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  accent?: boolean;
  external?: boolean;
}) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[10px] font-black uppercase tracking-[.16em] transition hover:-translate-y-0.5 ${
    accent
      ? "bg-[#f5b942] text-[#043331] hover:bg-[#ffca55]"
      : "border border-slate-200 bg-[#f8f4ea] text-[#043331] hover:border-[#0f766e] hover:bg-white"
  }`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

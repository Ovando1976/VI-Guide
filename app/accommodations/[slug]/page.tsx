import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

import { TagPill } from "@/components/directory/tag-pill";
import { PremiumDetailShell } from "@/components/place/premium-detail-shell";
import { StayActionCard } from "@/components/stay-action-card";
import { getAccommodationBySlug } from "@/lib/accommodations";
import { buildDiscoveryMapHref } from "@/lib/discovery/map-links";

const ISLAND_NAMES = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

type Props = { params: Promise<{ slug: string }> };

export default async function AccommodationDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getAccommodationBySlug(slug);
  if (!item) notFound();

  const islandName = ISLAND_NAMES[item.island];
  const highlights = Array.from(
    new Set([
      item.category,
      item.location,
      ...(item.bestFor ?? []),
      ...item.tags,
    ]),
  )
    .filter(Boolean)
    .slice(0, 8) as string[];
  const mapHref = buildDiscoveryMapHref({
    id: item.id,
    name: item.name,
    slug: item.slug,
    island: item.island,
    type: "stay",
    lat: item.lat,
    lng: item.lng,
    location: item.address ?? item.location,
    description: item.description,
  });
  const rideParams = new URLSearchParams({
    island: item.island,
    destination: item.name,
  });
  if (item.estateGeoid) rideParams.set("to", item.estateGeoid);
  if (typeof item.lat === "number") rideParams.set("toLat", String(item.lat));
  if (typeof item.lng === "number") rideParams.set("toLng", String(item.lng));
  const rideHref = `/mobility?${rideParams.toString()}`;
  const listingHref = `/accommodations/${item.slug}`;

  return (
    <PremiumDetailShell
      className="stay-detail"
      name={item.name}
      eyebrow={`${islandName} · ${item.location ?? item.category}`}
      description={item.description}
      back={
        <Link
          href="/accommodations"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] transition hover:border-[#0f766e]"
        >
          <ArrowLeft size={15} /> All stays
        </Link>
      }
      hero={
        <div
          className="h-full min-h-[340px] bg-[#043331] bg-cover bg-center transition duration-500 group-hover:scale-[1.025] sm:min-h-[440px] lg:min-h-[540px]"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(4,51,49,.02),rgba(4,51,49,.28)),url('${item.heroImage}')`,
          }}
          role="img"
          aria-label={item.name}
        />
      }
      meta={
        <div className="flex flex-wrap gap-2">
          <HeroPill icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Verified stay" />
          <HeroPill label={item.category} />
          {item.location ? <HeroPill label={item.location} /> : null}
          <HeroPill label={`Reviewed ${item.verifiedAt}`} />
        </div>
      }
      heroCallout={{
        eyebrow: "Make this your island base",
        description:
          "Connect this property with arrival transportation, nearby beaches, dining, ferry timing, and a realistic backup plan.",
      }}
      actions={{
        island: islandName,
        mapHref,
        rideHref,
        website: item.website,
        journeyStop: {
          id: item.id,
          title: item.name,
          island: item.island,
          kind: "stay",
          summary: item.description,
          ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
          ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
          href: listingHref,
          mapHref,
          bookingHref: listingHref,
        },
      }}
      primary={
        <>
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">
              Why consider this stay
            </div>
            <p className="mt-4 text-lg font-semibold leading-8 text-slate-700">
              {item.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.map((entry) => (
                <TagPill key={entry} label={entry} />
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <InfoCard icon={BedDouble} title="Stay type" value={item.category} />
            <InfoCard
              icon={Waves}
              title="Island base"
              value={item.location ?? islandName}
            />
            <InfoCard
              icon={ShieldCheck}
              title="Catalog status"
              value="Verified source"
            />
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">
                  Property information
                </div>
                <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-slate-600">
                  {item.address ? (
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 shrink-0 text-teal-700" />
                      <span>{item.address}</span>
                    </div>
                  ) : null}
                  {item.phone ? (
                    <a className="flex gap-3 hover:text-teal-800" href={`tel:${item.phone}`}>
                      <Phone className="h-5 w-5 shrink-0 text-teal-700" />
                      <span>{item.phone}</span>
                    </a>
                  ) : null}
                  {item.website ? (
                    <a
                      className="flex gap-3 hover:text-teal-800"
                      href={item.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-5 w-5 shrink-0 text-teal-700" />
                      <span>Official property website</span>
                    </a>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">
                  Source transparency
                </div>
                <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
                  Verified using {item.sourceLabel}. USVI Explorer distinguishes catalog
                  verification from live room availability, rates, and reservation
                  confirmation.
                </p>
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-teal-800"
                  >
                    Review source <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[30px] bg-[#043331] p-7 text-white sm:p-8">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5b942]">
              <Sparkles size={14} /> Make it a complete trip
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
              Connect your stay, transportation, and island days.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/65">
              Ask the concierge for a grounded plan built around this property,
              including arrival timing, nearby beaches, dinner options, ferry
              connections, and a return ride.
            </p>
          </section>
        </>
      }
      aside={
        <StayActionCard
          id={item.id}
          name={item.name}
          website={item.website}
          island={islandName}
          islandCode={item.island}
          location={item.location}
          listingHref={listingHref}
          rideHref={rideHref}
        />
      }
    />
  );
}

function HeroPill({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/90">
      {icon}
      {label}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof BedDouble;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]">
        <Icon size={19} />
      </span>
      <div className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-slate-400">
        {title}
      </div>
      <strong className="mt-1 block capitalize">{value}</strong>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Landmark,
  MapPin,
  Sparkles,
} from "lucide-react";

import { PremiumDetailShell } from "@/components/place/premium-detail-shell";
import { buildDiscoveryMapHref } from "@/lib/discovery/map-links";
import {
  getTravelKnowledge,
  getTravelKnowledgeItem,
} from "@/lib/travel-knowledge";

const ISLAND_NAMES = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

export default function HistoricDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const site = getTravelKnowledgeItem("historic", params.slug);
  if (!site) notFound();

  const islandName = ISLAND_NAMES[site.island];
  const mapHref = buildDiscoveryMapHref({
    id: site.id,
    name: site.name,
    slug: site.slug,
    island: site.island,
    type: "historic",
    lat: site.lat,
    lng: site.lng,
    location: site.address,
    description: site.description,
    estateGeoid: site.estateGeoid,
  });
  const rideParams = new URLSearchParams({
    island: site.island,
    destination: site.name,
  });
  if (site.estateGeoid) rideParams.set("to", site.estateGeoid);
  if (typeof site.lat === "number") rideParams.set("toLat", String(site.lat));
  if (typeof site.lng === "number") rideParams.set("toLng", String(site.lng));
  const rideHref = `/mobility?${rideParams.toString()}`;
  const detailHref = `/historic/${site.slug}`;
  const conciergeHref = `/concierge?context=heritage&island=${site.island}&prompt=${encodeURIComponent(
    `Plan a heritage experience around ${site.name} with nearby places, food, transportation, and realistic timing.`,
  )}`;
  const gallery = Array.from(
    new Set([site.heroImage, ...(site.images ?? [])].filter(Boolean)),
  ).slice(0, 6);
  const nearby = getTravelKnowledge("historic")
    .filter((item) => item.id !== site.id && item.island === site.island)
    .slice(0, 3);

  return (
    <PremiumDetailShell
      name={site.name}
      eyebrow={`${islandName} heritage`}
      description={site.description}
      back={
        <Link
          href="/heritage"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.18em]"
        >
          <ArrowLeft className="h-4 w-4" /> Heritage guide
        </Link>
      }
      hero={
        <div
          className="h-full min-h-[340px] bg-[#043331] bg-cover bg-center transition duration-500 group-hover:scale-[1.025] sm:min-h-[440px] lg:min-h-[540px]"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(4,51,49,.05),rgba(4,51,49,.42)),url('${site.heroImage}')`,
          }}
          role="img"
          aria-label={site.name}
        />
      }
      meta={
        <div className="flex flex-wrap gap-2">
          <HeroPill icon label={site.category || "Historic place"} />
          {site.tags.slice(0, 4).map((tag) => (
            <HeroPill key={tag} label={tag} />
          ))}
        </div>
      }
      heroCallout={{
        eyebrow: "Visit with context",
        description:
          "Keep the story, imagery, map context, transportation, nearby landmarks, and realistic timing connected in one experience.",
      }}
      actions={{
        island: islandName,
        mapHref,
        rideHref,
        journeyStop: {
          id: site.id,
          title: site.name,
          island: site.island,
          kind: "historic",
          summary: site.description,
          ...(typeof site.lat === "number" ? { lat: site.lat } : {}),
          ...(typeof site.lng === "number" ? { lng: site.lng } : {}),
          href: detailHref,
          mapHref,
        },
      }}
      primary={
        <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">
            Cultural context
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
            Visit with context, not just directions.
          </h2>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            {site.description} USVI Explorer keeps the place, imagery, map context,
            transportation, and nearby discovery connected in one experience.
          </p>
          {site.address ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#edf6f2] px-4 py-2 text-xs font-bold text-[#075e58]">
              <MapPin className="h-4 w-4" /> {site.address}
            </div>
          ) : null}
        </section>
      }
      aside={
        <section className="rounded-[30px] bg-[#e8f5f2] p-7">
          <Sparkles className="h-6 w-6 text-teal-700" />
          <h2 className="mt-4 text-2xl font-black tracking-[-.03em]">
            Build a heritage route
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Combine this stop with nearby landmarks, food, transportation, and
            realistic timing without leaving USVI Explorer.
          </p>
          <Link
            href={conciergeHref}
            className="mt-6 inline-flex rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white"
          >
            Ask concierge
          </Link>
        </section>
      }
      below={
        <>
          {gallery.length > 1 ? (
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">
                    Visual record
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">
                    See the place from more than one angle
                  </h2>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((image) => (
                  <div
                    key={image}
                    className="aspect-[4/3] rounded-[22px] bg-slate-100 bg-cover bg-center"
                    style={{ backgroundImage: `url('${image}')` }}
                    role="img"
                    aria-label={`${site.name} gallery view`}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {nearby.length ? (
            <section className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">
                    Continue exploring
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
                    More heritage on {islandName}
                  </h2>
                </div>
                <Link
                  href={`/heritage?island=${site.island}`}
                  className="hidden items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-[#075e58] sm:inline-flex"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {nearby.map((item) => (
                  <Link
                    key={item.id}
                    href={`/historic/${item.slug}`}
                    className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div
                      className="h-40 bg-[#043331] bg-cover bg-center transition duration-500 group-hover:scale-[1.025]"
                      style={{ backgroundImage: `url('${item.heroImage}')` }}
                      role="img"
                      aria-label={item.name}
                    />
                    <div className="relative bg-white p-5">
                      <p className="text-[9px] font-black uppercase tracking-[.17em] text-amber-700">
                        {item.category}
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-.03em]">
                        {item.name}
                      </h3>
                      <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#075e58]">
                        Open place <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      }
    />
  );
}

function HeroPill({ label, icon = false }: { label: string; icon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/90">
      {icon ? <Landmark className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
  );
}

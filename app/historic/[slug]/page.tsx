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

import { PlaceActionBar } from "@/components/place/place-action-bar";
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
  const rideParams = new URLSearchParams({ island: site.island, destination: site.name });
  if (site.estateGeoid) rideParams.set("toGeoid", site.estateGeoid);
  if (typeof site.lat === "number") rideParams.set("toLat", String(site.lat));
  if (typeof site.lng === "number") rideParams.set("toLng", String(site.lng));
  const rideHref = `/mobility?${rideParams.toString()}`;
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
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <Link
          href="/heritage"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.18em]"
        >
          <ArrowLeft className="h-4 w-4" /> Heritage guide
        </Link>

        <section className="overflow-hidden rounded-[36px] bg-[#043331] text-white shadow-[0_30px_80px_rgba(4,51,49,.2)]">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div
              className="min-h-[380px] bg-cover bg-center lg:min-h-[560px]"
              style={{
                backgroundImage: `linear-gradient(180deg,rgba(4,51,49,.05),rgba(4,51,49,.45)),url('${site.heroImage}')`,
              }}
            />
            <div className="flex flex-col justify-between p-7 sm:p-10">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-[#f5c451]">
                  <Landmark className="h-4 w-4" /> {islandName} heritage
                </div>
                <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">
                  {site.name}
                </h1>
                <p className="mt-6 text-base font-semibold leading-8 text-white/72">
                  {site.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {site.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <PlaceActionBar
          className="relative z-10 mx-2 -mt-12 sm:mx-5"
          name={site.name}
          island={islandName}
          mapHref={mapHref}
          rideHref={rideHref}
        />

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">
              Cultural context
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
              Visit with context, not just directions.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              {site.description} VI Guide keeps the place, imagery, map context,
              transportation, and nearby discovery connected in one experience.
            </p>
            {site.address ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#edf6f2] px-4 py-2 text-xs font-bold text-[#075e58]">
                <MapPin className="h-4 w-4" /> {site.address}
              </div>
            ) : null}
          </div>

          <aside className="rounded-[30px] bg-[#e8f5f2] p-7">
            <Sparkles className="h-6 w-6 text-teal-700" />
            <h2 className="mt-4 text-2xl font-black tracking-[-.03em]">
              Build a heritage route
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Combine this stop with nearby landmarks, food, transportation,
              and realistic timing without leaving VI Guide.
            </p>
            <Link
              href={conciergeHref}
              className="mt-6 inline-flex rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white"
            >
              Ask concierge
            </Link>
          </aside>
        </section>

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
                />
              ))}
            </div>
          </section>
        ) : null}

        {nearby.length ? (
          <section>
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
                    className="h-40 bg-[#043331] bg-cover bg-center"
                    style={{ backgroundImage: `url('${item.heroImage}')` }}
                  />
                  <div className="p-5">
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
      </div>
    </main>
  );
}

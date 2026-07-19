import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ISLAND_META, normalizeEstateCollection } from "@/lib/usvi";
import { queryTerritoryMapPlaces } from "@/lib/territory/catalog";
import { getNearbyEstates, getNearbyPlaces } from "@/lib/geo";
import type { EstateCollection } from "@/types/usvi";

const EstateDetailMap = dynamic(
  () =>
    import("@/components/estate-detail-map").then((mod) => mod.EstateDetailMap),
  { ssr: false }
);

const ESTATES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/0/query?" +
  new URLSearchParams({
    where: "STATE='78'",
    outFields:
      "GEOID,STATE,COUNTY,BASENAME,NAME,CENTLAT,CENTLON,INTPTLAT,INTPTLON,ESTATE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  }).toString();

export default async function EstatePage({
  params,
}: {
  params: Promise<{ geoid: string }>;
}) {
  const { geoid } = await params;

  const response = await fetch(ESTATES_URL, {
    cache: "no-store",
  });

  if (!response.ok) notFound();

  const data = (await response.json()) as EstateCollection;
  const estates = normalizeEstateCollection(data);
  const estate = estates.find((item) => item.geoid === geoid);

  if (!estate) notFound();

  const islandMeta = ISLAND_META[estate.island];

  const nearbyPlaces = getNearbyPlaces(
    estate,
    queryTerritoryMapPlaces({
      island: estate.island,
    }),
    6
  );

  const nearbyEstates = getNearbyEstates(estate, estates, 6);

  return (
    <main className="min-h-screen bg-[#fdfcf9] text-[#043331]">
      <section className="bg-gradient-to-br from-[#043331] via-[#012a28] to-teal-700 pb-16 pt-10 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/90"
          >
            Back to explorer
          </Link>

          <div className="mt-8 text-[11px] font-black uppercase tracking-[0.45em] text-amber-400">
            Official Estate Profile
          </div>

          <h1 className="mt-4 text-5xl font-black italic tracking-tight md:text-7xl">
            {estate.baseName}
          </h1>

          <p className="mt-4 max-w-3xl text-sm uppercase tracking-[0.28em] text-teal-100/70">
            {islandMeta.name} · GEOID {estate.geoid}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.8fr]">
          <div className="space-y-8">
            <EstateDetailMap estate={estate} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="GEOID" value={estate.geoid} />
              <Metric label="Estate Code" value={estate.estateCode || "—"} />
              <Metric label="Island" value={islandMeta.name} />
              <Metric
                label="Nearby Places"
                value={String(nearbyPlaces.length)}
              />
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">
                Coordinate Ledger
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DataCard
                  label="Internal Point"
                  value={`${estate.internalPoint.lat.toFixed(
                    6
                  )}, ${estate.internalPoint.lng.toFixed(6)}`}
                />
                <DataCard
                  label="Centroid"
                  value={`${estate.centroid.lat.toFixed(
                    6
                  )}, ${estate.centroid.lng.toFixed(6)}`}
                />
                <DataCard label="Full Name" value={estate.fullName} />
                <DataCard label="County Code" value={estate.county} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">
                Nearby Places
              </div>

              <div className="mt-5 space-y-4">
                {nearbyPlaces.length ? (
                  nearbyPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-lg font-black italic tracking-tight">
                        {place.name}
                      </div>

                      <div className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                        {[place.category, place.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>

                      <div className="mt-3 text-sm font-semibold text-[#043331]">
                        {place.distanceKm.toFixed(2)} km from estate center
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
                    No positioned places are available near this estate.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">
                Neighboring Estates
              </div>

              <div className="mt-5 space-y-4">
                {nearbyEstates.map((nearby) => (
                  <Link
                    key={nearby.geoid}
                    href={`/estate/${nearby.geoid}`}
                    className="block rounded-[22px] border border-slate-200 bg-white p-4 transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <div className="text-lg font-black italic tracking-tight">
                      {nearby.baseName}
                    </div>
                    <div className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                      {nearby.geoid}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#043331]">
                      {nearby.distanceKm.toFixed(2)} km away
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-[#043331]">
        {value}
      </div>
    </div>
  );
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-slate-50 p-5">
      <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-lg font-black tracking-tight text-[#043331]">
        {value}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
} from "lucide-react";

import { DirectoryCard } from "@/components/directory/directory-card";
import { GooglePlacePhoto } from "@/components/directory/google-place-photo";
import { PlaceActionBar } from "@/components/place/place-action-bar";
import { buildDirectoryMapHref } from "@/lib/discovery/map-links";
import { getNearbyDirectoryItems } from "@/lib/nearby";
import { getTravelKnowledge, getTravelKnowledgeItem } from "@/lib/travel-knowledge";
import type { DirectoryIsland, DirectoryItem } from "@/types/directory";

type DirectoryKind = "place" | "beach";

type Props = {
  slug: string;
  kind: DirectoryKind;
};

export function DirectoryDetailScreen({ slug, kind }: Props) {
  const pluralLabel = kind === "beach" ? "beaches" : "places";
  const knowledgeKind = kind === "beach" ? "beaches" : "places";
  const item = getTravelKnowledgeItem(knowledgeKind, slug) ?? null;
  const allItems = getTravelKnowledge(knowledgeKind);

  const nearby = useMemo(
    () => (item ? getNearbyDirectoryItems(item, allItems, 6, 12) : []),
    [allItems, item],
  );

  if (!item) {
    return (
      <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <BackLink href={`/${pluralLabel}`} label={`Back to ${pluralLabel}`} />
          <div className="rounded-[28px] border border-rose-200 bg-white p-8 font-semibold text-rose-700 shadow-sm">
            {`${capitalize(kind)} not found.`}
          </div>
        </div>
      </main>
    );
  }

  const photo = getGooglePhoto(item.heroImage);
  const mapHref = buildDirectoryMapHref(item, kind);
  const rideHref = buildRideHref(item);
  const directionsHref = buildDirectionsHref(item);
  const islandName = formatIsland(item.island);

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink href={`/${pluralLabel}`} label={`Back to ${pluralLabel}`} />
          <ShareButton name={item.name} />
        </div>

        <section className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm lg:rounded-[40px]">
          <div className="grid lg:grid-cols-[1.25fr_.75fr]">
            <GooglePlacePhoto
              placeId={photo.placeId}
              name={item.name}
              island={item.island.toUpperCase()}
              fallbackImage={photo.fallback || item.heroImage}
              className="min-h-[340px] sm:min-h-[440px] lg:min-h-[540px]"
            />

            <div className="flex flex-col justify-between bg-[linear-gradient(145deg,#043331_0%,#0b5d5b_62%,#14b8a6_100%)] p-7 text-white sm:p-10">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[.3em] text-[#fde68a]">
                  {islandName} · {kind}
                </div>
                <h1 className="mt-4 text-4xl font-black italic leading-[.95] tracking-[-.045em] sm:text-5xl lg:text-6xl">
                  {item.name}
                </h1>
                <p className="mt-5 text-base font-semibold leading-7 text-white/80">
                  {item.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.featured ? <HeroPill icon label="Featured" /> : null}
                  <HeroPill label={item.category || capitalize(kind)} />
                  {item.tags.slice(0, 3).map((tag) => <HeroPill key={tag} label={tag} />)}
                </div>
              </div>

              <div className="mt-10 rounded-[24px] border border-white/15 bg-black/10 p-5 backdrop-blur-sm">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#fde68a]">Make this stop part of the day</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/70">Connect this destination with transportation, nearby recommendations, timing, and a backup plan.</p>
              </div>
            </div>
          </div>
        </section>

        <PlaceActionBar
          name={item.name}
          island={islandName}
          mapHref={mapHref}
          rideHref={rideHref}
          website={item.website}
        />

        <section className="grid gap-7 lg:grid-cols-[1fr_380px]">
          <div className="space-y-7">
            <Panel eyebrow="Discover" title={`About ${item.name}`}>
              <p className="text-base font-semibold leading-8 text-slate-600">{item.description}</p>
              {item.tags.length ? <PillList values={item.tags} /> : null}
            </Panel>

            {item.amenities?.length || item.bestFor?.length ? (
              <div className="grid gap-7 md:grid-cols-2">
                {item.bestFor?.length ? (
                  <Panel eyebrow="Good to know" title="Best for"><PillList values={item.bestFor} /></Panel>
                ) : null}
                {item.amenities?.length ? (
                  <Panel eyebrow="At a glance" title="Amenities"><PillList values={item.amenities} /></Panel>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <Panel eyebrow="Location" title="Territory details">
              <div className="grid gap-3">
                <Fact icon={MapPin} label="Island" value={islandName} />
                {item.address ? <Fact icon={MapPin} label="Address" value={item.address} /> : null}
                {item.estateGeoid ? <Fact label="Estate" value={item.estateGeoid} /> : null}
                {item.phone ? <Fact icon={Phone} label="Phone" value={item.phone} href={`tel:${item.phone}`} /> : null}
                {item.hours?.length ? <Fact icon={Clock3} label="Hours" value={item.hours.join(" · ")} /> : null}
                {item.website ? <Fact icon={ExternalLink} label="Website" value="Visit website" href={item.website} external /> : null}
              </div>
              <a href={directionsHref} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[.18em] text-white transition hover:bg-[#075e58]">
                <Navigation className="h-4 w-4" /> Directions
              </a>
            </Panel>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="text-[11px] font-black uppercase tracking-[.25em] text-amber-500">Nearby on {islandName}</div>
          <h2 className="text-3xl font-black italic tracking-tight">Keep exploring</h2>
          {nearby.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {nearby.map(({ item: nearbyItem, distanceMiles }) => (
                <DirectoryCard
                  key={nearbyItem.id}
                  item={{ ...nearbyItem, tags: [`${distanceMiles.toFixed(1)} mi away`, ...nearbyItem.tags] }}
                  href={`/${pluralLabel}/${nearbyItem.slug}`}
                  eyebrow="Nearby"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 font-semibold text-slate-500 shadow-sm">Nearby recommendations will appear as coordinates are added.</div>
          )}
        </section>
      </div>
    </main>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8"><div className="text-[11px] font-black uppercase tracking-[.24em] text-amber-500">{eyebrow}</div><h2 className="mt-2 text-3xl font-black italic tracking-tight">{title}</h2><div className="mt-5">{children}</div></section>;
}

function PillList({ values }: { values: string[] }) {
  return <div className="mt-5 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="rounded-full border border-slate-200 bg-[#f8f4ea] px-4 py-2 text-[10px] font-black uppercase tracking-[.14em]">{value}</span>)}</div>;
}

function Fact({ label, value, icon: Icon, href, external }: { label: string; value: string; icon?: typeof MapPin; href?: string; external?: boolean }) {
  const content = <><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">{Icon ? <Icon className="h-3.5 w-3.5" /> : null}{label}</div><div className="mt-1 text-sm font-black leading-6 text-[#043331]">{value}</div></>;
  return href ? <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="rounded-[18px] border border-slate-200 bg-[#f8f4ea] p-4 transition hover:border-teal-600">{content}</a> : <div className="rounded-[18px] border border-slate-200 bg-[#f8f4ea] p-4">{content}</div>;
}

function HeroPill({ label, icon = false }: { label: string; icon?: boolean }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/90">{icon ? <Sparkles className="h-3.5 w-3.5" /> : null}{label}</span>;
}

function BackLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[.17em] shadow-sm"><ArrowLeft className="h-4 w-4" />{label}</Link>;
}

function ShareButton({ name }: { name: string }) {
  const [shared, setShared] = useState(false);
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: name, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") console.error("share failed", error);
    }
  }
  return <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[.17em] shadow-sm"><Share2 className="h-4 w-4" />{shared ? "Link copied" : "Share"}</button>;
}

function buildRideHref(item: DirectoryItem) {
  const params = new URLSearchParams({ island: item.island, destination: item.name });
  if (item.estateGeoid) params.set("toGeoid", item.estateGeoid);
  if (typeof item.lat === "number") params.set("toLat", String(item.lat));
  if (typeof item.lng === "number") params.set("toLng", String(item.lng));
  return `/mobility?${params.toString()}`;
}

function buildDirectionsHref(item: DirectoryItem) {
  const destination = typeof item.lat === "number" && typeof item.lng === "number" ? `${item.lat},${item.lng}` : [item.name, item.address, formatIsland(item.island), "USVI"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function getGooglePhoto(value: string) {
  if (!value.startsWith("/api/google-places/photo?")) return { placeId: "", fallback: "" };
  const params = new URLSearchParams(value.split("?")[1] || "");
  return { placeId: params.get("placeId") || "", fallback: params.get("fallback") || "" };
}

function formatIsland(island: DirectoryIsland) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  return "St. Croix";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

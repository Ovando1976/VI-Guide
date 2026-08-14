"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  Car,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Footprints,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { DirectoryCard } from "@/components/directory/directory-card";
import { GooglePlacePhoto } from "@/components/directory/google-place-photo";
import { PremiumDetailShell } from "@/components/place/premium-detail-shell";
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
  const detailHref = `/${pluralLabel}/${item.slug}`;

  return (
    <PremiumDetailShell
      name={item.name}
      eyebrow={`${islandName} · ${kind}`}
      description={item.description}
      back={<BackLink href={`/${pluralLabel}`} label={`Back to ${pluralLabel}`} />}
      share={<ShareButton name={item.name} />}
      hero={
        <GooglePlacePhoto
          placeId={photo.placeId}
          name={item.name}
          island={item.island.toUpperCase()}
          fallbackImage={photo.fallback || item.heroImage}
          className="h-full min-h-[340px] sm:min-h-[440px] lg:min-h-[540px]"
        />
      }
      meta={
        <div className="flex flex-wrap gap-2">
          {item.featured ? <HeroPill icon label="Featured" /> : null}
          <HeroPill label={item.category || capitalize(kind)} />
          {item.tags.slice(0, 3).map((tag) => (
            <HeroPill key={tag} label={tag} />
          ))}
        </div>
      }
      actions={{
        island: islandName,
        mapHref,
        rideHref,
        website: item.website,
        journeyStop: {
          id: item.id,
          title: item.name,
          island: item.island,
          kind,
          summary: item.description,
          ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
          ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
          href: detailHref,
          mapHref,
          bookingHref: rideHref,
        },
      }}
      primary={
        <>
          <Panel eyebrow="Discover" title={`About ${item.name}`}>
            <p className="text-base font-semibold leading-8 text-slate-600">
              {item.description}
            </p>
            {item.tags.length ? <PillList values={item.tags} /> : null}
          </Panel>

          {item.amenities?.length || item.bestFor?.length ? (
            <div className="grid gap-7 md:grid-cols-2">
              {item.bestFor?.length ? (
                <Panel eyebrow="Good to know" title="Best for">
                  <PillList values={item.bestFor} />
                </Panel>
              ) : null}
              {item.amenities?.length ? (
                <Panel eyebrow="At a glance" title="Amenities">
                  <PillList values={item.amenities} />
                </Panel>
              ) : null}
            </div>
          ) : null}

          {item.accessNotes?.length || item.safetyNotes?.length ? (
            <div className="grid gap-7 md:grid-cols-2">
              {item.accessNotes?.length ? (
                <Panel eyebrow="Arrival plan" title="Getting there">
                  <NoteList values={item.accessNotes} icon={Footprints} />
                </Panel>
              ) : null}
              {item.safetyNotes?.length ? (
                <Panel eyebrow="Conditions matter" title="Safety notes">
                  <NoteList values={item.safetyNotes} icon={AlertTriangle} tone="amber" />
                </Panel>
              ) : null}
            </div>
          ) : null}
        </>
      }
      aside={
        <>
          <Panel eyebrow="Location" title="Territory details">
          <div className="grid gap-3">
            <Fact icon={MapPin} label="Island" value={islandName} />
            {item.address ? <Fact icon={MapPin} label="Address" value={item.address} /> : null}
            {item.estateGeoid ? <Fact label="Estate" value={item.estateGeoid} /> : null}
            {item.phone ? (
              <Fact icon={Phone} label="Phone" value={item.phone} href={`tel:${item.phone}`} />
            ) : null}
            {item.hours?.length ? (
              <Fact icon={Clock3} label="Hours" value={item.hours.join(" · ")} />
            ) : null}
            {item.fees ? <Fact icon={CircleDollarSign} label="Fees" value={item.fees} /> : null}
            {item.parking ? <Fact icon={Car} label="Parking" value={item.parking} /> : null}
            {item.accessibility ? <Fact icon={Accessibility} label="Accessibility" value={item.accessibility} /> : null}
            {item.website ? (
              <Fact icon={ExternalLink} label="Website" value="Visit website" href={item.website} external />
            ) : null}
          </div>
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[.18em] text-white transition hover:bg-[#075e58]"
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
          </Panel>
          <Panel eyebrow="Guide confidence" title="Know before you go">
            <div className="grid gap-3">
              <Fact
                icon={ShieldCheck}
                label={item.sourceUrl || item.sourceUrls?.length ? "Evidence" : "Catalog status"}
                value={item.sourceLabel ?? (item.sourceUrl || item.sourceUrls?.length ? "Public source linked" : "Curated USVI Explorer entry")}
              />
              {item.verifiedAt ? <Fact icon={Clock3} label="Reviewed" value={formatReviewDate(item.verifiedAt)} /> : null}
            </div>
            {item.sourceUrl ? (
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#b8dcd6] bg-[#eaf8f5] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-[#0f766e] transition hover:border-[#0f766e]">
                Inspect source <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="mt-4 rounded-2xl bg-[#fff7df] p-4 text-xs font-semibold leading-5 text-[#765820]">Hours, access, prices, and conditions can change. Confirm time-sensitive details before depending on this stop.</p>
            )}
          </Panel>
        </>
      }
      below={
        <section className="space-y-4">
          <div className="text-[11px] font-black uppercase tracking-[.25em] text-amber-500">
            Nearby on {islandName}
          </div>
          <h2 className="text-3xl font-black italic tracking-tight">Keep exploring</h2>
          {nearby.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {nearby.map(({ item: nearbyItem, distanceMiles }) => (
                <DirectoryCard
                  key={nearbyItem.id}
                  item={{
                    ...nearbyItem,
                    tags: [`${distanceMiles.toFixed(1)} mi away`, ...nearbyItem.tags],
                  }}
                  href={`/${pluralLabel}/${nearbyItem.slug}`}
                  eyebrow="Nearby"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 font-semibold text-slate-500 shadow-sm">
              Nearby recommendations will appear as coordinates are added.
            </div>
          )}
        </section>
      }
    />
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
      <div className="text-[11px] font-black uppercase tracking-[.24em] text-amber-500">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-black italic tracking-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PillList({ values }: { values: string[] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-full border border-slate-200 bg-[#f8f4ea] px-4 py-2 text-[10px] font-black uppercase tracking-[.14em]">
          {value}
        </span>
      ))}
    </div>
  );
}

function NoteList({ values, icon: Icon, tone = "teal" }: { values: string[]; icon: typeof Footprints; tone?: "teal" | "amber" }) {
  return (
    <ul className="grid gap-3">
      {values.map((value) => (
        <li key={value} className={`flex gap-3 rounded-2xl border p-4 text-sm font-semibold leading-6 ${tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-[#cce5e0] bg-[#eef9f6] text-[#244b47]"}`}>
          <Icon className={`mt-1 h-4 w-4 shrink-0 ${tone === "amber" ? "text-amber-600" : "text-[#0f766e]"}`} />
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ label, value, icon: Icon, href, external }: { label: string; value: string; icon?: typeof MapPin; href?: string; external?: boolean }) {
  const content = (
    <>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div className="mt-1 text-sm font-black leading-6 text-[#043331]">{value}</div>
    </>
  );

  return href ? (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="rounded-[18px] border border-slate-200 bg-[#f8f4ea] p-4 transition hover:border-teal-600">
      {content}
    </a>
  ) : (
    <div className="rounded-[18px] border border-slate-200 bg-[#f8f4ea] p-4">{content}</div>
  );
}

function HeroPill({ label, icon = false }: { label: string; icon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/90">
      {icon ? <Sparkles className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[.17em] shadow-sm">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

function ShareButton({ name }: { name: string }) {
  const [shared, setShared] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") console.error("share failed", error);
    }
  }

  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[.17em] shadow-sm">
      <Share2 className="h-4 w-4" />
      {shared ? "Link copied" : "Share"}
    </button>
  );
}

function buildRideHref(item: DirectoryItem) {
  const params = new URLSearchParams({ island: item.island, destination: item.name });
  if (item.estateGeoid) params.set("to", item.estateGeoid);
  if (typeof item.lat === "number") params.set("toLat", String(item.lat));
  if (typeof item.lng === "number") params.set("toLng", String(item.lng));
  return `/mobility?${params.toString()}`;
}

function buildDirectionsHref(item: DirectoryItem) {
  const destination = typeof item.lat === "number" && typeof item.lng === "number"
    ? `${item.lat},${item.lng}`
    : [item.name, item.address, formatIsland(item.island), "USVI"].filter(Boolean).join(", ");
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

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

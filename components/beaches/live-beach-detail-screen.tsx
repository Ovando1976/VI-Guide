"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Accessibility,
  ArrowLeft,
  BadgeCheck,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  ShieldCheck,
  Waves,
} from "lucide-react";

import { PremiumDetailShell } from "@/components/place/premium-detail-shell";
import { buildDiscoveryMapHref } from "@/lib/discovery/map-links";

type IslandCode = "stt" | "stj" | "stx";

type BeachDetail = {
  id: string;
  googlePlaceId: string;
  name: string;
  island: IslandCode;
  lat: number;
  lng: number;
  location?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUri?: string;
  website?: string;
  image?: string;
  heroImage?: string;
  images?: string[];
  hours?: string[];
  accessibility?: Record<string, boolean>;
  verifiedAt?: string;
};

type BeachFeedResponse = {
  places?: BeachDetail[];
};

export function LiveBeachDetailScreen({ placeId }: { placeId: string }) {
  const [beach, setBeach] = useState<BeachDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  const loadBeach = useCallback(async (signal: AbortSignal) => {
    setStatus("loading");

    try {
      const response = await fetch(
        `/api/beaches/detail?id=${encodeURIComponent(placeId)}&v=3`,
        { signal, cache: "no-store" },
      );
      const payload = (await response.json()) as BeachDetail & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Beach details could not be loaded.");
      setBeach(withIdealFallback(payload));
      setStatus("ready");
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    try {
      const recovered = await recoverFromIslandFeeds(placeId, signal);
      if (!recovered) throw new Error("Beach record was not found in the live island feeds.");
      setBeach(withIdealFallback(recovered));
      setStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  }, [placeId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadBeach(controller.signal);
    return () => controller.abort();
  }, [attempt, loadBeach]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#f8f4ea] p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-16 animate-pulse rounded-[24px] bg-white" />
          <div className="h-[70vh] animate-pulse rounded-[36px] bg-[#e6f2ef]" />
        </div>
      </main>
    );
  }

  if (status === "error" || !beach) {
    return (
      <main className="min-h-screen bg-[#f8f4ea] p-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[#dce8e5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f7f4] text-[#0f766e]">
            <Waves className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-[#12312f]">Beach details temporarily unavailable</h1>
          <p className="mt-3 text-[#61716e]">The live beach service did not return this record. Try the request again or return to the verified beach guide.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setAttempt((value) => value + 1)} className="rounded-full bg-[#0f766e] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white">Try again</button>
            <Link href="/beaches" className="rounded-full border border-[#c4ddd8] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-[#12312f]">Return to beaches</Link>
          </div>
        </div>
      </main>
    );
  }

  const images = uniqueImages(
    beach.images?.length
      ? beach.images
      : beach.image
        ? [beach.image]
        : [idealIslandImage(beach.island)],
  );
  const accessible = Object.entries(beach.accessibility ?? {})
    .filter(([, value]) => value)
    .map(([key]) =>
      key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
    );
  const description =
    beach.description ??
    "Beach and shoreline destination in the U.S. Virgin Islands.";
  const detailHref = `/beaches/${encodeURIComponent(beach.googlePlaceId || placeId)}`;
  const mapHref = buildDiscoveryMapHref({
    id: beach.id,
    name: beach.name,
    slug: beach.googlePlaceId || placeId,
    href: detailHref,
    island: beach.island,
    type: "beach",
    lat: beach.lat,
    lng: beach.lng,
    location: beach.location,
    description,
    rating: beach.rating,
  });
  const rideParams = new URLSearchParams({
    island: beach.island,
    destination: beach.name,
    toLat: String(beach.lat),
    toLng: String(beach.lng),
  });
  const rideHref = `/mobility?${rideParams.toString()}`;
  const directionsHref =
    beach.googleMapsUri ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${beach.lat},${beach.lng}`)}`;

  return (
    <PremiumDetailShell
      className="live-beach-detail"
      name={beach.name}
      eyebrow={`${islandLabel(beach.island)} · Beach`}
      description={description}
      kind="beach"
      back={
        <Link
          href="/beaches"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.17em] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> All beaches
        </Link>
      }
      hero={
        <div className="relative h-full min-h-[340px] sm:min-h-[440px] lg:min-h-[540px]">
          <Image
            src={images[0]}
            alt={`${beach.name} in ${islandLabel(beach.island)}`}
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 65vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,51,49,.02),rgba(4,51,49,.25))]" />
        </div>
      }
      meta={
        <div className="flex flex-wrap gap-2">
          <HeroPill icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Verified beach" />
          {typeof beach.rating === "number" ? (
            <HeroPill
              label={`★ ${beach.rating.toFixed(1)}${beach.reviewCount ? ` · ${beach.reviewCount} reviews` : ""}`}
            />
          ) : null}
          {beach.location ? <HeroPill label={beach.location} /> : null}
        </div>
      }
      heroCallout={{
        eyebrow: "Plan the shoreline day",
        description:
          "Save the beach, add it to My Trip, open it on the Living Map, plan the ride, and ask Concierge about timing, access, food, conditions, and a backup option.",
      }}
      actions={{
        island: islandLabel(beach.island),
        mapHref,
        rideHref,
        website: beach.website,
        journeyStop: {
          id: beach.id,
          title: beach.name,
          island: beach.island,
          kind: "beach",
          summary: description,
          lat: beach.lat,
          lng: beach.lng,
          href: detailHref,
          mapHref,
        },
      }}
      quickFacts={[
        { label: "Island", value: islandLabel(beach.island) },
        {
          label: "Map",
          value: "Live location",
          note: `${beach.lat.toFixed(5)}, ${beach.lng.toFixed(5)}`,
        },
        {
          label: "Transportation",
          value: "Ride ready",
          note: "Carry this beach directly into VI Guide Mobility.",
        },
        {
          label: "Access",
          value: beach.hours?.length ? "Hours available" : "Confirm locally",
          note: "Parking, surf, currents, facilities, and access conditions can change.",
        },
      ]}
      primary={
        <>
          <Panel eyebrow="Discover" title={`About ${beach.name}`}>
            <p className="text-base font-semibold leading-8 text-slate-600">{description}</p>
          </Panel>

          {images.length > 1 ? (
            <Panel eyebrow="Beach gallery" title="See more of the shoreline">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {images.slice(1, 7).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={image}
                      alt={`${beach.name} view ${index + 2}`}
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {beach.hours?.length ? (
            <Panel eyebrow="Timing" title="Access hours">
              <div className="grid gap-2 text-sm font-semibold text-slate-600">
                {beach.hours.map((line) => (
                  <div key={line} className="flex gap-3 rounded-2xl bg-[#f8f4ea] p-4">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-6 text-sm font-semibold leading-7 text-amber-950/75 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p>
                U.S. Virgin Islands beaches are subject to public shoreline access principles. Access conditions, parking, surf, currents, and facilities can change, so verify current local conditions before visiting.
              </p>
            </div>
          </section>
        </>
      }
      aside={
        <div className="space-y-4">
          <Panel eyebrow="Location" title="Beach details">
            <div className="grid gap-3">
              <Fact icon={MapPin} label="Island" value={islandLabel(beach.island)} />
              {beach.location ? <Fact icon={MapPin} label="Location" value={beach.location} /> : null}
              <Fact
                icon={MapPin}
                label="Coordinates"
                value={`${beach.lat.toFixed(5)}, ${beach.lng.toFixed(5)}`}
              />
            </div>
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
            >
              <Navigation className="h-4 w-4" /> Directions
            </a>
            {beach.website ? (
              <a
                href={beach.website}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#043331]"
              >
                <ExternalLink className="h-4 w-4" /> Official website
              </a>
            ) : null}
          </Panel>

          {accessible.length ? (
            <Panel eyebrow="Accessibility" title="Access features">
              <div className="flex flex-wrap gap-2">
                {accessible.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef7f5] px-3 py-2 text-xs font-bold text-[#315451]"
                  >
                    <Accessibility className="h-3.5 w-3.5" /> {item}
                  </span>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      }
    />
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#043331]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-[#f8f4ea] p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-teal-700" /> {label}
      </div>
      <div className="mt-1 text-sm font-black leading-6 text-[#043331]">{value}</div>
    </div>
  );
}

function HeroPill({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/90">
      {icon}
      {label}
    </span>
  );
}

async function recoverFromIslandFeeds(placeId: string, signal: AbortSignal) {
  const feeds = await Promise.all(
    (["stt", "stj", "stx"] as IslandCode[]).map(async (island) => {
      const response = await fetch(`/api/beaches/live?island=${island}&catalogVersion=3`, {
        signal,
        cache: "no-store",
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as BeachFeedResponse;
      return Array.isArray(payload.places) ? payload.places : [];
    }),
  );

  return feeds.flat().find((item) => item.googlePlaceId === placeId || item.id === `live-beach:${placeId}`) ?? null;
}

function withIdealFallback(beach: BeachDetail): BeachDetail {
  const fallback = idealIslandImage(beach.island);
  const images = uniqueImages([...(beach.images ?? []), beach.image, beach.heroImage, fallback]);
  return { ...beach, image: images[0], heroImage: images[0], images };
}

function uniqueImages(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function idealIslandImage(island: IslandCode) {
  if (island === "stj") return "/images/places/st-john/trunk-bay-beach-1.jpg";
  if (island === "stt") return "/images/places/st-thomas/magens-bay-beach-1.jpg";
  return "/images/places/st-croix/cane-bay-beach-1.jpg";
}

function islandLabel(island: IslandCode) {
  return island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : "St. Croix";
}

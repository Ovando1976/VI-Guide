"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto h-[70vh] max-w-6xl animate-pulse rounded-[32px] bg-[#e6f2ef]" />
      </main>
    );
  }

  if (status === "error" || !beach) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[#dce8e5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f7f4] text-2xl">🌊</div>
          <h1 className="mt-5 text-2xl font-black text-[#12312f]">Beach details temporarily unavailable</h1>
          <p className="mt-3 text-[#61716e]">The live beach service did not return this record. Try the request again or return to the verified beach map.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setAttempt((value) => value + 1)} className="rounded-xl bg-[#0f766e] px-5 py-3 font-black text-white">Try again</button>
            <Link href="/map?lens=beaches" className="rounded-xl border border-[#c4ddd8] bg-white px-5 py-3 font-black text-[#12312f]">Return to beaches</Link>
          </div>
        </div>
      </main>
    );
  }

  const images = uniqueImages(beach.images?.length ? beach.images : beach.image ? [beach.image] : [idealIslandImage(beach.island)]);
  const accessible = Object.entries(beach.accessibility ?? {})
    .filter(([, value]) => value)
    .map(([key]) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()));

  return (
    <main className="min-h-screen bg-[#fbfaf6] pb-24">
      <section className="relative min-h-[58vh] overflow-hidden bg-[#0f766e]">
        <img src={images[0]} alt={`${beach.name} in ${islandLabel(beach.island)}`} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062f2d]/90 via-[#062f2d]/25 to-transparent" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-end px-6 pb-10 pt-24 md:px-10">
          <div className="text-xs font-black uppercase tracking-[.24em] text-[#f4c75f]">Verified USVI beach</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black text-white md:text-6xl">{beach.name}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-white/85">
            <span>{beach.location ?? islandLabel(beach.island)}</span>
            {typeof beach.rating === "number" ? <span>★ {beach.rating.toFixed(1)}{beach.reviewCount ? ` · ${beach.reviewCount} reviews` : ""}</span> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[1.5fr_.8fr] md:px-10">
        <div className="space-y-6">
          <article className="rounded-[28px] border border-[#dce8e5] bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#0f766e]">About this beach</div>
            <p className="mt-4 text-lg leading-8 text-[#425a57]">{beach.description ?? "Beach and shoreline destination in the U.S. Virgin Islands."}</p>
          </article>

          {images.length > 1 ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{images.slice(1, 7).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${beach.name} view ${index + 2}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />)}</div> : null}

          {beach.hours?.length ? <article className="rounded-[28px] border border-[#dce8e5] bg-white p-6"><h2 className="text-xl font-black text-[#12312f]">Access hours</h2><div className="mt-4 grid gap-2 text-sm text-[#526966]">{beach.hours.map((line) => <div key={line}>{line}</div>)}</div></article> : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[#b9d7d2] bg-[#e9f7f4] p-5">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0f766e]">Beach actions</div>
            <div className="mt-4 grid gap-3">
              {beach.googleMapsUri ? <a href={beach.googleMapsUri} target="_blank" rel="noreferrer" className="rounded-xl bg-[#0f766e] px-4 py-3 text-center font-black text-white">Open directions</a> : null}
              <Link href={`/mobility?island=${beach.island}&destination=${encodeURIComponent(beach.name)}`} className="rounded-xl bg-[#12312f] px-4 py-3 text-center font-black text-white">Plan a ride</Link>
              <Link href={`/planner?add=${encodeURIComponent(beach.id)}`} className="rounded-xl border border-[#c4ddd8] bg-white px-4 py-3 text-center font-black text-[#12312f]">Add to My Trip</Link>
              {beach.website ? <a href={beach.website} target="_blank" rel="noreferrer" className="rounded-xl border border-[#c4ddd8] bg-white px-4 py-3 text-center font-black text-[#12312f]">Official website</a> : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#dce8e5] bg-white p-5">
            <h2 className="text-lg font-black text-[#12312f]">Location</h2>
            <p className="mt-2 text-sm leading-6 text-[#61716e]">{beach.location ?? islandLabel(beach.island)}</p>
            <p className="mt-3 text-xs font-semibold text-[#7b8b88]">Coordinates: {beach.lat.toFixed(5)}, {beach.lng.toFixed(5)}</p>
          </div>

          {accessible.length ? <div className="rounded-[28px] border border-[#dce8e5] bg-white p-5"><h2 className="text-lg font-black text-[#12312f]">Accessibility</h2><div className="mt-3 flex flex-wrap gap-2">{accessible.map((item) => <span key={item} className="rounded-full bg-[#eef7f5] px-3 py-2 text-xs font-bold text-[#315451]">{item}</span>)}</div></div> : null}

          <div className="rounded-[28px] border border-[#eadba8] bg-[#fff8df] p-5 text-sm leading-6 text-[#68551d]">All beaches in the U.S. Virgin Islands are subject to public shoreline access principles. Access conditions, parking, surf, currents, and facilities can change, so verify local conditions before visiting.</div>
        </aside>
      </section>
    </main>
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

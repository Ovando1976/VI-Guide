"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BeachDetail = {
  id: string;
  googlePlaceId: string;
  name: string;
  island: "stt" | "stj" | "stx";
  lat: number;
  lng: number;
  location?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUri?: string;
  website?: string;
  image?: string;
  images?: string[];
  hours?: string[];
  accessibility?: Record<string, boolean>;
  verifiedAt?: string;
};

export function LiveBeachDetailScreen({ placeId }: { placeId: string }) {
  const [beach, setBeach] = useState<BeachDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    fetch(`/api/beaches/detail?id=${encodeURIComponent(placeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as BeachDetail & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Beach details could not be loaded.");
        setBeach(payload);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [placeId]);

  if (status === "loading") {
    return <main className="min-h-screen bg-[#fbfaf6] p-6"><div className="mx-auto h-[70vh] max-w-6xl animate-pulse rounded-[32px] bg-[#e6f2ef]" /></main>;
  }

  if (status === "error" || !beach) {
    return <main className="min-h-screen bg-[#fbfaf6] p-6"><div className="mx-auto max-w-3xl rounded-[28px] border border-[#dce8e5] bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#12312f]">Beach details unavailable</h1><p className="mt-3 text-[#61716e]">This live beach record could not be loaded right now.</p><Link href="/map" className="mt-6 inline-flex rounded-xl bg-[#0f766e] px-5 py-3 font-black text-white">Return to map</Link></div></main>;
  }

  const images = beach.images?.length ? beach.images : beach.image ? [beach.image] : [];
  const accessible = Object.entries(beach.accessibility ?? {}).filter(([, value]) => value).map(([key]) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()));

  return (
    <main className="min-h-screen bg-[#fbfaf6] pb-24">
      <section className="relative min-h-[58vh] overflow-hidden bg-[#0f766e]">
        {images[0] ? <img src={images[0]} alt={beach.name} className="absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#062f2d]/90 via-[#062f2d]/30 to-transparent" />
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

          {images.length > 1 ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{images.slice(1, 7).map((image, index) => <img key={image} src={image} alt={`${beach.name} view ${index + 2}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />)}</div> : null}

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

function islandLabel(island: BeachDetail["island"]) {
  return island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : "St. Croix";
}

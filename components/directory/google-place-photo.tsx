"use client";

import { useEffect, useState } from "react";

type Attribution = { displayName: string; uri: string };
type PhotoPayload = { photoUri: string; attributions: Attribution[]; matchedName?: string };

export function GooglePlacePhoto({ placeId = "", name, island = "", fallbackImage = "", className = "h-52 sm:h-56" }: { placeId?: string; name: string; island?: string; fallbackImage?: string; className?: string }) {
  const [payload, setPayload] = useState<PhotoPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setPayload(null);
    setFailed(false);
    const params = new URLSearchParams({ query: name });
    if (placeId) params.set("placeId", placeId);
    if (island) params.set("island", island);
    fetch(`/api/google-places/photo-meta?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result?.photoUri) throw new Error(result?.error || "Photo unavailable.");
        return result as PhotoPayload;
      })
      .then(setPayload)
      .catch((error) => {
        if (error?.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [island, name, placeId]);

  if (failed) {
    const officialFallback = getOfficialFallback(name);
    const resolvedFallback = officialFallback?.image || fallbackImage;
    if (isUsableFallback(resolvedFallback)) {
      return <div className={`relative overflow-hidden bg-cover bg-center ${className}`} style={{ backgroundImage: `url('${resolvedFallback}')` }} role="img" aria-label={name}>
        {officialFallback ? <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-[9px] font-bold text-white/90"><a href={officialFallback.source} target="_blank" rel="noreferrer" className="underline">Photo: {officialFallback.credit}</a></div> : null}
      </div>;
    }
    return <div className={`grid place-items-center bg-[linear-gradient(135deg,#043331,#0f766e)] px-6 text-center text-xs font-black uppercase tracking-[.18em] text-white ${className}`}>Photo temporarily unavailable</div>;
  }
  if (!payload) return <div className={`animate-pulse bg-slate-100 ${className}`} role="status" aria-label={`Loading photo of ${name}`} />;

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={payload.photoUri} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" onError={() => setFailed(true)} />
      <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-[9px] font-bold text-white/90">
        {payload.attributions.length ? payload.attributions.map((attribution, index) => attribution.uri ? <a key={`${attribution.uri}-${index}`} href={attribution.uri} target="_blank" rel="noreferrer" className="underline">Photo: {attribution.displayName}</a> : <span key={`${attribution.displayName}-${index}`}>Photo: {attribution.displayName}</span>) : <span>Photo via Google</span>}
      </div>
    </div>
  );
}

function isUsableFallback(value: string) {
  if (!value.startsWith("/") || value.endsWith(".svg")) return false;
  return /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(value);
}

function getOfficialFallback(name: string) {
  if (name.trim().toLowerCase() === "hook line & sinker") {
    return {
      image: "/images/places/hook-line-sinker.jpg",
      source: "https://hlsvi.com/",
      credit: "Hook Line & Sinker",
    };
  }
  return null;
}

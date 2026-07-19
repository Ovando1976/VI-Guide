import Link from "next/link";
import type { DirectoryItem } from "@/types/directory";
import { TagPill } from "@/components/directory/tag-pill";
import { GooglePlacePhoto } from "@/components/directory/google-place-photo";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";

type Props = {
  item: DirectoryItem;
  href: string;
  eyebrow?: string;
};

export function DirectoryCard({ item, href, eyebrow }: Props) {
  const googlePhoto = getGooglePhoto(item.heroImage);
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(4,51,49,.07)] transition duration-300 hover:-translate-y-1 hover:border-teal-700/20 hover:shadow-[0_22px_50px_rgba(4,51,49,.13)]"
    >
      <GooglePlacePhoto
        placeId={googlePhoto.placeId}
        name={item.name}
        island={item.island.toUpperCase()}
        fallbackImage={googlePhoto.fallback || item.heroImage}
      />
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-emerald-800"><BadgeCheck size={12} /> Verified</span>
          <ArrowUpRight size={17} className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0f766e]" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-500">
            {eyebrow ?? item.category}
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {item.island.toUpperCase()}
          </div>
        </div>

        <h2 className="mt-3 text-2xl font-black tracking-[-.03em] text-[#043331]">
          {item.name}
        </h2>

        {item.address || item.tags[1] ? <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin size={14} className="text-[#0f766e]" /><span className="line-clamp-1">{item.address || item.tags[1]}</span></div> : null}

        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      </div>
    </Link>
  );
}

function getGooglePhoto(value?: string) {
  if (!value?.startsWith("/api/google-places/photo?")) return { placeId: "", fallback: "" };
  const params = new URLSearchParams(value.split("?")[1] || "");
  return { placeId: params.get("placeId") || "", fallback: params.get("fallback") || "" };
}

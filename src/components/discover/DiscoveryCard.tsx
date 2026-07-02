import type { ReactNode } from "react";
import {
  Bot,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Sparkles,
  Star,
  Waves,
} from "lucide-react";

import type { DiscoveryItem } from "./discoveryTypes";

const FALLBACK_IMAGE = "/images/beaches/magens-bay.jpg";

export default function DiscoveryCard({
  item,
  onOpen,
}: {
  item: DiscoveryItem;
  onOpen: (item: DiscoveryItem) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-2xl transition duration-300 hover:-translate-y-1 hover:shadow-emerald-300/10">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="block w-full text-left"
      >
        <div className="relative h-64 overflow-hidden bg-slate-200">
          <img
            src={item.coverImage || FALLBACK_IMAGE}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          <div className="absolute left-5 top-5 rounded-full bg-emerald-300 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-950 shadow-xl">
            {item.displayCategory ?? item.category}
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
              <Star className="h-4 w-4 fill-white" />
              4.8
              <span className="text-white/50">•</span>
              <Clock className="h-4 w-4" />
              Open now
            </div>

            <h3 className="text-3xl font-black leading-none tracking-tight text-white">
              {item.title}
            </h3>

            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-white/80">
              <MapPin className="h-3.5 w-3.5" />
              {String(item.islandCode).replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <p className="line-clamp-3 text-sm font-medium leading-relaxed text-slate-600">
            {item.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={<Waves />} label="Conditions" value="Good" />
            <MiniStat icon={<Navigation />} label="Drive" value="12 min" />
            <MiniStat icon={<Sparkles />} label="AI Ready" value="Smart" />
          </div>
        </div>
      </button>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-4">
        <Action icon={<Navigation />} label="Directions" />
        <Action icon={<Heart />} label="Save" />
        <Action icon={<Bot />} label="Ask AI" active />
      </div>
    </article>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3">
      <div className="text-emerald-700 [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <p className="mt-2 text-xs font-black">{value}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Action({
  icon,
  label,
  active,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className={[
        "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-black transition",
        active
          ? "bg-emerald-300 text-slate-950"
          : "bg-slate-100 text-slate-600 hover:bg-emerald-100",
      ].join(" ")}
    >
      <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      {label}
    </button>
  );
}
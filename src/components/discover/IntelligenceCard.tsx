import type React from "react";
import {
  Bot,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Star,
  Waves,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;

type Props = {
  title: string;
  category?: string;
  description?: string;
  image?: string;
  island?: string;
  onClick?: () => void;
  onDirectionsClick?: (event: React.MouseEvent) => void;
  onSaveClick?: (event: React.MouseEvent) => void;
  onAskAiClick?: (event: React.MouseEvent) => void;
};

const FALLBACK_IMAGE = "/images/beaches/magens-bay.jpg";

function cleanImage(src?: string) {
  const value = String(src ?? "").trim();
  if (!value || value === "undefined" || value === "null") {
    return FALLBACK_IMAGE;
  }
  return value;
}

export default function IntelligenceCard({
  title,
  category = "Discovery",
  description = "Island discovery record.",
  image,
  island,
  onClick,
  onDirectionsClick,
  onSaveClick,
  onAskAiClick,
}: Props) {
  const imageSrc = cleanImage(image);

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-2xl transition hover:-translate-y-1 active:scale-[0.99]">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.();
          }
        }}
        className="cursor-pointer focus:outline-none"
      >
        <div className="relative h-56 overflow-hidden bg-slate-200">
          <img
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          <div className="absolute left-5 top-5 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-950">
            {category}
          </div>

          <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm font-black text-white">
            <Star className="h-4 w-4 fill-white" />
            4.8
            <span className="text-white/60">•</span>
            <Clock className="h-4 w-4" />
            Open now
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-2xl font-black tracking-tight">{title}</h3>

          {island ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              {island.replaceAll("_", " ")}
            </p>
          ) : null}

          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {description}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat icon={Waves} label="Conditions" value="Good" />
            <MiniStat icon={Navigation} label="Drive" value="12 min" />
            <MiniStat icon={Bot} label="AI" value="Ready" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-4">
        <Action icon={Navigation} label="Directions" onClick={onDirectionsClick} />
        <Action icon={Heart} label="Save" onClick={onSaveClick} />
        <Action icon={Bot} label="Ask AI" onClick={onAskAiClick} />
      </div>
    </article>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3">
      <Icon className="h-4 w-4 text-emerald-700" />
      <p className="mt-2 text-xs font-black">{value}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
}: {
  icon: IconType;
  label: string;
  onClick?: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-emerald-300 hover:text-slate-950"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
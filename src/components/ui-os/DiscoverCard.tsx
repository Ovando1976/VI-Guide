import type { LucideIcon } from "lucide-react";

export function DiscoverCard({
  title,
  eyebrow,
  description,
  image,
  icon: Icon,
  onClick,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  image?: string;
  icon?: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white text-left text-slate-950 shadow-2xl transition hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className="relative h-52 bg-slate-200">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

        {Icon ? (
          <div className="absolute left-5 top-5 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300 text-slate-950 shadow-xl">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      <div className="p-6">
        {eyebrow ? (
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">
            {eyebrow}
          </p>
        ) : null}

        <h3 className="mt-2 text-3xl font-black tracking-tight">{title}</h3>

        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip text="Directions" />
          <Chip text="Save" />
          <Chip text="Ask AI" />
        </div>
      </div>
    </button>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {text}
    </span>
  );
}
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function CategoryPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition active:scale-95",
        active
          ? "border-emerald-300/50 bg-emerald-300 text-slate-950"
          : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
import { Search, Sparkles } from "lucide-react";

export function HeroSearch({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask anything about the Virgin Islands...",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/70 px-5 py-4 shadow-2xl backdrop-blur">
      <Search className="h-5 w-5 text-emerald-300" />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit?.();
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/35"
      />

      <button
        type="button"
        onClick={onSubmit}
        className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    </div>
  );
}
import { Search, X } from "lucide-react";
import type { MapPoint } from "../maps/IslandMap";

type Props = {
  value: string;
  results: MapPoint[];
  onChange: (value: string) => void;
  onClear: () => void;
  onSelect: (point: MapPoint) => void;
};

export default function AtlasSearch({
  value,
  results,
  onChange,
  onClear,
  onSelect,
}: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search places, estates, beaches, history, businesses..."
        className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/80 pl-14 pr-14 text-sm font-bold text-white shadow-xl outline-none backdrop-blur placeholder:text-white/40 focus:border-emerald-300/60"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-[950] mt-2 max-h-96 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
          {results.map((point) => (
            <button
              key={`${point.type}-${point.id}`}
              type="button"
              onClick={() => onSelect(point)}
              className="w-full border-b border-white/10 p-4 text-left transition last:border-b-0 hover:bg-white/10"
            >
              <p className="text-sm font-black text-white">{point.title}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                {point.type}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
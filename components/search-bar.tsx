"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const SUGGESTED_SEARCHES = [
  "Charlotte Amalie",
  "Red Hook",
  "Cruz Bay",
  "Bovoni",
  "Airport",
  "Bolongo",
];

export function SearchBar({ value, onChange }: Props) {
  return (
    <section className="rounded-[30px] bg-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f59e0b]">
            Estate search
          </div>
          <div className="mt-2 text-2xl font-black italic tracking-tight text-[#043331]">
            Find where the islands actually move
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            Search estates by name, estate code, or GEOID to anchor your next route.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SEARCHES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className="rounded-full border border-slate-200 bg-[#f8f4ea] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#043331] transition hover:border-[#f5b942] hover:bg-[#fff4d6]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="relative">
          <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black uppercase tracking-[0.24em] text-slate-400">
            Search
          </div>

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Try Agnes Fancy, Bovoni, Estate code, or GEOID..."
            className="w-full rounded-[28px] border border-slate-200 bg-[#f8f4ea] py-5 pl-28 pr-6 text-lg font-semibold text-[#043331] outline-none transition placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white"
          />
        </div>
      </div>
    </section>
  );
}
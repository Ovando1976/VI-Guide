"use client";

export type DateRangeKey = "today" | "week" | "month" | "all";

const OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeKey;
  onChange: (value: DateRangeKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const active = option.key === value;

        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              active
                ? "bg-[#043331] text-white"
                : "border border-slate-200 bg-white text-[#043331] hover:border-slate-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
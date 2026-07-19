"use client";

import clsx from "clsx";
import type { DirectoryIsland } from "@/types/directory";

type Props = {
  value: DirectoryIsland | "all";
  onChange: (value: DirectoryIsland | "all") => void;
};

const OPTIONS: { value: DirectoryIsland | "all"; label: string }[] = [
  { value: "all", label: "All Islands" },
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
];

export function IslandFilterTabs({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
            value === option.value
              ? "bg-[#043331] text-white"
              : "border border-slate-200 bg-white text-[#043331] hover:border-[#0f766e]/35 hover:bg-[#f8f4ea]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
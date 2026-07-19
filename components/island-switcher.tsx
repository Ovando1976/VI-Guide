"use client";

import type { IslandCode } from "@/types/usvi";

type Props = {
  value: IslandCode;
  onChange: (value: IslandCode) => void;
};

const ISLANDS: {
  value: IslandCode;
  code: string;
  name: string;
  detail: string;
}[] = [
  {
    value: "stt",
    code: "STT",
    name: "St. Thomas",
    detail: "Harbor, airport, town, hillside access",
  },
  {
    value: "stj",
    code: "STJ",
    name: "St. John",
    detail: "Ferry, villas, beaches, Cruz Bay",
  },
  {
    value: "stx",
    code: "STX",
    name: "St. Croix",
    detail: "Long corridors, towns, historic estates",
  },
];

export function IslandSwitcher({ value, onChange }: Props) {
  const activeIsland =
    ISLANDS.find((island) => island.value === value) ?? ISLANDS[0];

  return (
    <div className="rounded-[26px] border border-white/12 bg-white/8 p-3 backdrop-blur-xl">
      <div className="grid grid-cols-3 gap-2">
        {ISLANDS.map((island) => {
          const active = island.value === value;

          return (
            <button
              key={island.value}
              type="button"
              onClick={() => onChange(island.value)}
              className={`rounded-[20px] border px-3 py-3 text-left transition ${
                active
                  ? "border-amber-300/50 bg-amber-400 text-[#11302f] shadow-[0_8px_24px_rgba(245,185,66,0.22)]"
                  : "border-white/10 bg-white/6 text-white hover:bg-white/12"
              }`}
            >
              <div
                className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                  active ? "text-[#6b4b00]/80" : "text-white/50"
                }`}
              >
                {island.code}
              </div>

              <div className="mt-1 text-base font-black leading-tight">
                {island.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[18px] border border-white/10 bg-black/10 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
          Selected island profile
        </div>
        <div className="mt-1 text-sm font-black text-white">
          {activeIsland.name}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50/65">
          {activeIsland.detail}
        </div>
      </div>
    </div>
  );
}

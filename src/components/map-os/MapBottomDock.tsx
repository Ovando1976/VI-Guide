import {
  Eye,
  LocateFixed,
  Navigation,
  Share2,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { IslandCode } from "../../types";
import type { SelectedMapItem } from "./mapTypes";
import { getItemTitle, go } from "./mapUtils";

type Props = {
  item: SelectedMapItem;
  selectedIsland: IslandCode;
};

export default function MapBottomDock({ item, selectedIsland }: Props) {
  const title = getItemTitle(item);
  const encodedTitle = encodeURIComponent(title);

  return (
    <section className="absolute bottom-[74px] left-1/2 z-40 hidden -translate-x-1/2 rounded-[2rem] border border-white/10 bg-[#050b18]/88 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:block">
      <div className="grid grid-cols-5 gap-2">
        <DockAction
          icon={Navigation}
          label="Directions"
          active
          onClick={() =>
            go(`/mobility?island=${selectedIsland}&destination=${encodedTitle}`)
          }
        />
        <DockAction icon={Star} label="Save" />
        <DockAction icon={Share2} label="Share" />
        <DockAction icon={LocateFixed} label="Nearby" />
        <DockAction icon={Eye} label="Street View" />
      </div>
    </section>
  );
}

function DockAction({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[108px] flex-col items-center rounded-3xl px-5 py-4 text-sm font-black transition ${
        active
          ? "bg-emerald-400 text-[#022c22]"
          : "text-white/75 hover:bg-white/10"
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="mt-2">{label}</span>
    </button>
  );
}
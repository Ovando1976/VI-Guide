import {
  Building2,
  ChevronDown,
  Layers3,
  MapPin,
  Tag,
} from "lucide-react";

type Props = {
  currentIsland: string;
  showLabels: boolean;
  setShowLabels: (value: boolean | ((current: boolean) => boolean)) => void;
  showParcels: boolean;
  setShowParcels: (value: boolean | ((current: boolean) => boolean)) => void;
  showBoundaries: boolean;
  setShowBoundaries: (value: boolean | ((current: boolean) => boolean)) => void;
};

export default function MapLayerToolbar({
  currentIsland,
  showLabels,
  setShowLabels,
  showParcels,
  setShowParcels,
  showBoundaries,
  setShowBoundaries,
}: Props) {
  return (
    <>
      <div className="absolute left-[480px] top-[92px] z-30 hidden items-center gap-3 lg:flex">
        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-[#050b18]/82 px-5 py-3 text-sm font-black shadow-2xl backdrop-blur-2xl">
          <MapPin className="h-4 w-4 text-emerald-300" />
          {currentIsland}
          <ChevronDown className="h-4 w-4 text-white/55" />
        </button>

        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-[#050b18]/82 px-5 py-3 text-sm font-black shadow-2xl backdrop-blur-2xl">
          <Layers3 className="h-4 w-4 text-white/80" />
          Layers
          <ChevronDown className="h-4 w-4 text-white/55" />
        </button>
      </div>

      <div className="absolute right-6 top-[132px] z-30 hidden flex-col gap-3 lg:flex">
        <LayerButton
          label="Labels"
          active={showLabels}
          onClick={() => setShowLabels((value) => !value)}
        />
        <LayerButton
          label="Parcels"
          active={showParcels}
          onClick={() => setShowParcels((value) => !value)}
        />
        <LayerButton
          label="Bounds"
          active={showBoundaries}
          onClick={() => setShowBoundaries((value) => !value)}
        />
      </div>
    </>
  );
}

function LayerButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon =
    label === "Labels" ? Tag : label === "Parcels" ? Building2 : Layers3;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`grid h-14 w-14 place-items-center rounded-2xl border shadow-2xl backdrop-blur-2xl transition ${
        active
          ? "border-emerald-300/50 bg-emerald-400 text-[#022c22]"
          : "border-white/10 bg-[#050b18]/86 text-white/80 hover:bg-white/[0.08]"
      }`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
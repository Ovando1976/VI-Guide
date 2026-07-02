import IslandMap from "../../../components/maps/IslandMap";
import type { IslandCode } from "../../../types";

type FocusTarget = {
  center?: [number, number] | number[];
  zoom?: number;
  pitch?: number;
  bearing?: number;
};

type EstateExplorerMapProps = {
  selectedEstateGeoid?: string;
  selectedIsland?: IslandCode | "all" | "unk" | "stt" | "stj" | "stx" | "wat";
  focusTarget?: FocusTarget | null;
  highlightEstate?: string | null;
  showParcels?: boolean;
  showParcelLabels?: boolean;
  showEstateLabels?: boolean;
  showEstateBoundaries?: boolean;
  className?: string;
};

export function EstateExplorerMap({
  selectedIsland = "st_thomas",
  focusTarget,
  highlightEstate,
  showParcels = false,
  showParcelLabels = false,
  showEstateLabels = true,
  showEstateBoundaries = true,
  className = "",
}: EstateExplorerMapProps) {
  return (
    <IslandMap
      selectedIsland={selectedIsland === "stt" ? "st_thomas" : selectedIsland === "stj" ? "st_john" : selectedIsland === "stx" ? "st_croix" : selectedIsland === "wat" ? "water_island" : selectedIsland === "all" || selectedIsland === "unk" ? "st_thomas" : selectedIsland}
      focusTarget={focusTarget ?? undefined}
      highlightEstate={highlightEstate ?? undefined}
      showParcels={showParcels}
      showParcelLabels={showParcelLabels}
      showEstateLabels={showEstateLabels}
      showEstateBoundaries={showEstateBoundaries}
      showControls
      className={className}
    />
  );
}

export default EstateExplorerMap;

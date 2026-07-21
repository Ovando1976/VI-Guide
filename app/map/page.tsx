import dynamic from "next/dynamic";

import { MapIntelligenceBridge } from "@/components/intelligence/map-intelligence-bridge";

const ExplorerMapScreen = dynamic(
  () =>
    import("@/components/explorer/explorer-map-screen").then(
      (module) => module.ExplorerMapScreen,
    ),
  { ssr: false },
);

export default function MapPage() {
  return (
    <>
      <MapIntelligenceBridge />
      <ExplorerMapScreen />
    </>
  );
}

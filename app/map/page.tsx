import dynamic from "next/dynamic";
import { Suspense } from "react";

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
      <Suspense fallback={null}>
        <MapIntelligenceBridge />
      </Suspense>
      <ExplorerMapScreen />
    </>
  );
}

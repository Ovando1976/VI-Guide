import dynamic from "next/dynamic";

const ExplorerMapScreen = dynamic(
  () =>
    import("@/components/explorer/explorer-map-screen").then(
      (module) => module.ExplorerMapScreen,
    ),
  { ssr: false },
);

export default function MapPage() {
  return <ExplorerMapScreen />;
}

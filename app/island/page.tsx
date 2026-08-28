import type { Metadata } from "next";

import { IslandGenerativeWorkspace } from "@/components/island-workspace/island-generative-workspace";
import { UnifiedWorkspaceProvider } from "@/components/workspace/unified-workspace-controller";

const description =
  "A single adaptive USVI workspace that connects Island intelligence, the Living Map, trip state, mobility, local knowledge, trusted imagery, and governed actions around the traveler's mission.";

export const metadata: Metadata = {
  title: "Island Workspace",
  description,
  alternates: { canonical: "/island" },
  openGraph: {
    type: "website",
    siteName: "USVI Explorer",
    title: "Island Workspace | USVI Explorer",
    description,
    url: "/island",
  },
  twitter: {
    card: "summary_large_image",
    title: "Island Workspace | USVI Explorer",
    description,
  },
};

export default function IslandWorkspacePage() {
  return (
    <UnifiedWorkspaceProvider>
      <IslandGenerativeWorkspace />
    </UnifiedWorkspaceProvider>
  );
}

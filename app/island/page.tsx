import Link from "next/link";
import type { Metadata } from "next";

import { IslandGenerativeWorkspace } from "@/components/island-workspace/island-generative-workspace";
import { UnifiedWorkspaceProvider } from "@/components/workspace/unified-workspace-controller";

const description =
  "A single adaptive USVI workspace that connects Island intelligence, the Living Map, trip state, mobility, local knowledge, trusted imagery, and governed actions around the traveler's mission.";

const MOBILE_LENSES = [
  ["Island", "/island"],
  ["Discover", "/explore"],
  ["Move", "/mobility"],
  ["Stay", "/accommodations"],
  ["Eat", "/dining"],
  ["Experience", "/activities"],
  ["History", "/history"],
  ["Community", "/community"],
] as const;

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
    <div className="island-workspace-page pb-[env(safe-area-inset-bottom)]">
      <nav
        aria-label="Island workspace lenses"
        className="island-mobile-lenses sticky top-0 z-[70] flex min-h-[52px] gap-1 overflow-x-auto border-b border-white/8 bg-[#03141b]/96 px-3 py-2 backdrop-blur-2xl lg:hidden"
      >
        {MOBILE_LENSES.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={href === "/island" ? "page" : undefined}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-[10px] font-black transition ${
              href === "/island"
                ? "bg-cyan-200 text-[#04242d]"
                : "border border-white/8 bg-white/[.035] text-white/52 hover:bg-white/[.07] hover:text-white/80"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <UnifiedWorkspaceProvider>
        <IslandGenerativeWorkspace />
      </UnifiedWorkspaceProvider>

      <style>{`
        .island-workspace-page .island-context-map {
          isolation: isolate;
          position: relative;
          z-index: 0;
        }

        @media (max-width: 1023px) {
          .island-workspace-page main header {
            top: 52px !important;
          }

          @supports (bottom: max(.5rem, env(safe-area-inset-bottom))) {
            .island-workspace-page main section.sticky {
              bottom: max(.5rem, env(safe-area-inset-bottom)) !important;
            }
          }
        }
      `}</style>
    </div>
  );
}

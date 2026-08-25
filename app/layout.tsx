import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import "./globals.css";
import "./experience-system.css";
import "./concierge-responsive.css";
import "./map-premium.css";
import "./mobile-navigation-fix.css";
import "./operations-navigation.css";
import "./taxi-image-framing.css";
import "./home-mobile-polish.css";
import { AcquisitionTracker } from "@/components/acquisition-tracker";
import { ActiveIslandRouteSync } from "@/components/active-island-route-sync";
import { AuthProvider } from "@/components/auth-provider";
import { AppNavigation } from "@/components/app-navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import { JourneyIntelligenceSync } from "@/components/intelligence/journey-intelligence-sync";
import { TravelerMemorySync } from "@/components/intelligence/traveler-memory-sync";
import { JourneyCloudSync } from "@/components/journey/journey-cloud-sync";
import { JourneyMapStateBridge } from "@/components/journey/journey-map-state-bridge";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://usvi-explorer.com"),
  applicationName: "USVI Explorer",
  title: {
    default: "USVI Explorer — Discover, Plan & Move Through the USVI",
    template: "%s | USVI Explorer",
  },
  description:
    "Discover beaches, stays, culture, dining and transportation, then turn local insight into one connected U.S. Virgin Islands trip.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "USVI Explorer",
    title: "USVI Explorer — Your Smart Virgin Islands Travel Companion",
    description: "Discover, plan and move through St. Thomas, St. John and St. Croix with one connected local travel companion.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "USVI Explorer",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  category: "travel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#062b3a",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={null}>
            <AcquisitionTracker />
            <ActiveIslandRouteSync />
          </Suspense>
          <TravelerMemorySync />
          <JourneyCloudSync />
          <JourneyIntelligenceSync />
          <JourneyMapStateBridge />
          {children}
          <AppNavigation />
        </AuthProvider>
      </body>
    </html>
  );
}

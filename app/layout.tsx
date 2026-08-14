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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://usvi-compass.vercel.app"),
  applicationName: "USVI Compass",
  title: {
    default: "USVI Compass — Explore the U.S. Virgin Islands",
    template: "%s | USVI Compass",
  },
  description:
    "Explore beaches, places, stays, heritage, transportation, and grounded island plans across the U.S. Virgin Islands.",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "USVI Compass",
    title: "USVI Compass — Explore the U.S. Virgin Islands",
    description: "Plan rides, beaches, stays, experiences, cruise days, and connected island trips across the U.S. Virgin Islands.",
    url: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "USVI Compass",
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
  themeColor: "#032f2d",
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

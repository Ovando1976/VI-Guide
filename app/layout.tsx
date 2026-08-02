import type { Metadata, Viewport } from "next";

import "./globals.css";
import "./concierge-responsive.css";
import "./map-premium.css";
import "./mobile-navigation-fix.css";
import { AuthProvider } from "@/components/auth-provider";
import { AppNavigation } from "@/components/app-navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import { TravelerMemorySync } from "@/components/intelligence/traveler-memory-sync";

export const metadata: Metadata = {
  applicationName: "VI Guide",
  title: {
    default: "VI Guide — Explore the U.S. Virgin Islands",
    template: "%s | VI Guide",
  },
  description:
    "Explore beaches, places, stays, heritage, transportation, and grounded island plans across the U.S. Virgin Islands.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VI Guide",
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
  themeColor: "#f8fbfa",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ScrollToTop />
          <TravelerMemorySync />
          {children}
          <AppNavigation />
        </AuthProvider>
      </body>
    </html>
  );
}

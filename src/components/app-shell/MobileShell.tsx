import React from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { IslandPicker } from "./IslandPicker";
import JoinPage from "../JoinPage";
import TaxiAssociationDemoPage from "../TaxiAssociationDemoPage";
import MapIntentDashboard from "../MapIntentDashboard";
import BusinessProofDashboard from "../BusinessProofDashboard";
import PartnerClosePage from "../PartnerClosePage";
import PartnerPipelinePage from "../PartnerPipelinePage";
import PartnerOnboardingPage from "../PartnerOnboardingPage";
import PartnerDirectoryPage from "../PartnerDirectoryPage";
import TourismAllianceHub from "../TourismAllianceHub";
import AlliancePipelinePage from "../AlliancePipelinePage";
import MeetingModePage from "../MeetingModePage";
import DirectBookingHub from "../DirectBookingHub";
import BookingPartnersPage from "../BookingPartnersPage";
import CustomerStaysPage from "../CustomerStaysPage";
import CustomerAccommodationDetailPage from "../CustomerAccommodationDetailPage";
import AccommodationPartnerPortalPage from "../AccommodationPartnerPortalPage";
import AccommodationReviewPage from "../AccommodationReviewPage";
import BookingInboxPage from "../BookingInboxPage";
import RevenueDashboardPage from "../RevenueDashboardPage";
import PartnerOutreachPage from "../PartnerOutreachPage";
import PartnerBillingPage from "../PartnerBillingPage";
import { AdminDeskPage, PartnerDeskPage, VisitorDeskPage } from "../AppDeskPages";

interface MobileShellProps {
  children: React.ReactNode;
  isMerchant?: boolean;
}

const PRESENTATION_ROUTES = [
  "/demo",
  "/join",
  "/taxi-demo",
  "/map-intent",
  "/business-proof",
  "/partner-close",
  "/partner-pipeline",
  "/partner-onboarding",
  "/partner-directory",
  "/tourism-alliance",
  "/alliance-pipeline",
  "/meeting-mode",
  "/direct-booking",
  "/booking-partners",
  "/lodging",
  "/stays",
  "/hotels",
  "/mobility",
  "/admin/leads",
  "/partners",
  "/merchant/demo",
  "/mobility/dispatch",
];

function isPresentationPath(pathname: string) {
  return PRESENTATION_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function MobileShell({ children }: MobileShellProps) {
  const location = useLocation();
  const routeContent =
    location.pathname === "/join" ? (
      <JoinPage />
    ) : location.pathname === "/taxi-demo" ? (
      <TaxiAssociationDemoPage />
    ) : location.pathname === "/map-intent" ? (
      <MapIntentDashboard />
    ) : location.pathname === "/business-proof" ? (
      <BusinessProofDashboard />
    ) : location.pathname === "/partner-close" ? (
      <PartnerClosePage />
    ) : location.pathname === "/partner-pipeline" ? (
      <PartnerPipelinePage />
    ) : location.pathname === "/partner-onboarding" ? (
      <PartnerOnboardingPage />
    ) : location.pathname === "/partner-directory" ? (
      <PartnerDirectoryPage />
    ) : location.pathname === "/tourism-alliance" ? (
      <TourismAllianceHub />
    ) : location.pathname === "/alliance-pipeline" ? (
      <AlliancePipelinePage />
    ) : location.pathname === "/meeting-mode" ? (
      <MeetingModePage />
    ) : location.pathname === "/direct-booking" ? (
      <DirectBookingHub />
    ) : location.pathname === "/visitor-desk" ? (
      <VisitorDeskPage />
    ) : location.pathname === "/admin-desk" ? (
      <AdminDeskPage />
    ) : location.pathname === "/partner-desk" ? (
      <PartnerDeskPage />
    ) : location.pathname === "/partner-billing" ? (
      <PartnerBillingPage />
    ) : location.pathname === "/partner-outreach" ? (
      <PartnerOutreachPage />
    ) : location.pathname === "/revenue-dashboard" ? (
      <RevenueDashboardPage />
    ) : location.pathname === "/booking-inbox" ? (
      <BookingInboxPage />
    ) : location.pathname === "/booking-partners" ? (
      <BookingPartnersPage />
    ) : location.pathname === "/accommodation-partner" ? (
      <AccommodationPartnerPortalPage />
    ) : location.pathname === "/accommodation-review" ? (
      <AccommodationReviewPage />
    ) : ["/hotels", "/stays", "/lodging"].some((prefix) =>
      location.pathname.startsWith(`${prefix}/`)
    ) ? (
      <CustomerAccommodationDetailPage />
    ) : ["/hotels", "/stays", "/lodging"].includes(location.pathname) ? (
      <CustomerStaysPage />
    ) : (
      children
    );
  const showRevenueJoinCta =
    location.pathname === "/demo" || location.pathname === "/partners";
  const isPresentationRoute = isPresentationPath(location.pathname);

  return (
    <div
      className={[
        "relative min-h-screen overflow-x-hidden bg-sand font-sans text-ink selection:bg-turquoise/30",
        isPresentationRoute
          ? "pb-[calc(env(safe-area-inset-bottom)+5rem)]"
          : "pb-40",
      ].join(" ")}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-turquoise/5 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-ocean/5 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-coral/5 blur-[150px]" />
      </div>

      {!isPresentationRoute && (
        <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6">
          <div className="pointer-events-auto rounded-2xl bg-white/75 px-3 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
            <IslandPicker />
          </div>
        </header>
      )}

      <main
        className={[
          "relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          isPresentationRoute ? "pt-8 md:pt-10" : "",
        ].join(" ")}
      >
        <div
          className={
            isPresentationRoute ? "mx-auto max-w-6xl" : "mx-auto max-w-4xl"
          }
        >
          {showRevenueJoinCta ? (
        <a
          href="/join"
          className="fixed bottom-6 left-4 right-4 z-[90] inline-flex items-center justify-center rounded-2xl bg-turquoise px-5 py-4 text-sm font-black text-ink shadow-2xl ring-1 ring-black/10 active:scale-95 md:left-auto md:right-8 md:w-auto"
        >
          Join as Founding Partner
        </a>
      ) : null}

      {routeContent}
        </div>
      </main>

      {!isPresentationRoute && <BottomNav />}
    </div>
  );
}

import React from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { IslandPicker } from "./IslandPicker";

interface MobileShellProps {
  children: React.ReactNode;
  isMerchant?: boolean;
}

const PRESENTATION_ROUTES = ["/partners", "/merchant/demo"];

function isPresentationPath(pathname: string) {
  return PRESENTATION_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function MobileShell({ children }: MobileShellProps) {
  const location = useLocation();
  const isPresentationRoute = isPresentationPath(location.pathname);

  return (
    <div
      className={[
        "relative min-h-screen overflow-x-hidden bg-sand font-sans text-ink selection:bg-turquoise/30",
        isPresentationRoute ? "pb-[calc(env(safe-area-inset-bottom)+5rem)]" : "pb-40",
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

      <main className={["relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", isPresentationRoute ? "pt-8 md:pt-10" : ""].join(" ")}>
        <div
          className={
            isPresentationRoute ? "mx-auto max-w-6xl" : "mx-auto max-w-4xl"
          }
        >
          {children}
        </div>
      </main>

      {!isPresentationRoute && <BottomNav />}
    </div>
  );
}

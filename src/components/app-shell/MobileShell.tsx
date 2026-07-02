import React from "react";
import { BottomNav } from "./BottomNav";
import { IslandPicker } from "./IslandPicker";

interface MobileShellProps {
  children: React.ReactNode;
  isMerchant?: boolean;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#061016] font-sans text-white selection:bg-emerald-300/30">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[12%] -left-[12%] h-[42rem] w-[42rem] rounded-full bg-emerald-400/10 blur-[140px]" />
        <div className="absolute top-[18%] -right-[12%] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-[8%] left-[20%] h-[38rem] w-[38rem] rounded-full bg-orange-300/5 blur-[150px]" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-5 pointer-events-none">
        <div className="pointer-events-auto">
          <IslandPicker />
        </div>
      </header>

      <main className="relative z-10 min-h-screen pb-32">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
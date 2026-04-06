import React from 'react';
import { BottomNav } from './BottomNav';
import { IslandPicker } from './IslandPicker';

interface MobileShellProps {
  children: React.ReactNode;
  isMerchant?: boolean;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-sand pb-32 font-sans text-ink selection:bg-turquoise/30 relative overflow-x-hidden">
      {/* Atmospheric Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-turquoise/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-ocean/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-coral/5 rounded-full blur-[150px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <IslandPicker />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

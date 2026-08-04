import { Suspense } from "react";

import { MissionMode } from "@/components/concierge/mission-mode";

export default function MissionModePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#041018] px-4 py-12 text-white">
          <div className="mx-auto max-w-6xl animate-pulse space-y-5">
            <div className="h-5 w-52 rounded bg-white/10" />
            <div className="h-14 max-w-2xl rounded bg-white/10" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-56 rounded-[24px] bg-white/[.06]" />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <MissionMode />
    </Suspense>
  );
}

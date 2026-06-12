import React from "react";
import { useCollectionCount } from "../hooks/useCollectionCount";

export default function PlatformStats() {
  const beaches = useCollectionCount("beaches");
  const places = useCollectionCount("places");
  const events = useCollectionCount("events");
  const estates = useCollectionCount("estates");

  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {[
        ["Beaches", beaches],
        ["Places", places],
        ["Events", events],
        ["Estates", estates],
      ].map(([label, count]) => (
        <div key={label} className="rounded-2xl bg-white/10 p-3 text-center">
          <p className="text-lg font-black text-white">{count}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-100">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

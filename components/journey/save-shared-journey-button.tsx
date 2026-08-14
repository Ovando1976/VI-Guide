"use client";

import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createJourneyPlan,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";

export function SaveSharedJourneyButton({ plan }: { plan: JourneyPlan }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  function saveCopy() {
    if (state !== "idle") return;
    setState("saving");

    const copy = createJourneyPlan(
      plan.island,
      `My copy · ${plan.title}`.slice(0, 120),
    );
    upsertJourneyPlan({
      ...copy,
      date: plan.date,
      status: "draft",
      notes: ["Saved from a shared USVI Explorer journey.", plan.notes]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 2000),
      plan: plan.plan.map((stop) => ({ ...stop })),
    });

    setState("saved");
    router.push("/planner");
  }

  const Icon = state === "saving" ? Loader2 : state === "saved" ? Check : BookmarkPlus;

  return (
    <button
      type="button"
      onClick={saveCopy}
      disabled={state !== "idle"}
      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-80"
    >
      <Icon size={15} className={state === "saving" ? "animate-spin" : ""} />
      {state === "saved" ? "Saved to planner" : "Save a copy"}
    </button>
  );
}

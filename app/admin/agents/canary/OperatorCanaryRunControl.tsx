"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play, ShieldCheck } from "lucide-react";

type RunResponse = {
  status?: string;
  reason?: string;
  worker?: {
    status?: string;
    modelCalls?: number;
    brokerCalls?: number;
    brokerCompleted?: number;
  } | null;
  error?: string;
};

function messageFor(result: RunResponse) {
  if (result.status === "completed") {
    const worker = result.worker;
    return `Run complete · worker ${worker?.status ?? "unknown"} · ${worker?.modelCalls ?? 0} model call(s) · ${worker?.brokerCompleted ?? 0}/${worker?.brokerCalls ?? 0} broker lookup(s).`;
  }
  if (result.status === "already_completed") {
    return "This preview commit already completed its one-shot canary.";
  }
  if (result.status === "already_running") {
    return "This preview commit already has a canary run in progress.";
  }
  if (result.status === "already_failed") {
    return "This preview commit already consumed its one-shot canary and requires a new preview commit before retrying.";
  }
  if (result.reason === "idempotency_unavailable") {
    return "Canary denied because the one-shot idempotency store is unavailable.";
  }
  if (result.reason) return `Canary denied: ${result.reason.replaceAll("_", " ")}.`;
  return result.error ?? "The canary could not be run.";
}

export function OperatorCanaryRunControl({ preview }: { preview: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    if (!preview || running) return;
    setRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/agents/canary/run", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const result = (await response.json().catch(() => ({}))) as RunResponse;
      setMessage(messageFor(result));
      if (response.ok) router.refresh();
    } catch {
      setMessage("The canary request failed before a result was returned.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="w-[min(92vw,390px)] rounded-2xl border border-violet-200/20 bg-[#071820]/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-violet-200">
          <ShieldCheck size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-100/55">
            One-shot operator canary
          </p>
          <p className="mt-1 text-xs leading-5 text-white/50">
            Fixed synthetic request · one read-only directory tool · no traveler memory, booking, payment, dispatch, or deployment authority.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={!preview || running}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200/20 bg-violet-300/10 px-3 text-xs font-black text-violet-100 transition hover:bg-violet-300/15 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Play size={14} />
        {running ? "Running bounded canary…" : preview ? "Run synthetic preview canary" : "Preview-only · production denied"}
      </button>

      {message ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-[11px] leading-5 text-white/55" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}

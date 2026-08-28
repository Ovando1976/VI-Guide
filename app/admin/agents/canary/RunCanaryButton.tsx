"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2, ShieldCheck } from "lucide-react";

type RunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function RunCanaryButton() {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ status: "idle" });

  async function runCanary() {
    if (state.status === "running") return;
    const idempotencyKey = crypto.randomUUID();
    setState({ status: "running" });

    try {
      const response = await fetch("/api/admin/agents/canary/run", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            status?: string;
            runId?: string;
            environment?: string;
            worker?: { status?: string; modelCalls?: number; brokerCalls?: number };
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Synthetic canary was denied safely.");
      }

      const worker = payload?.worker;
      const detail = worker
        ? `${worker.status ?? "completed"} · ${worker.modelCalls ?? 0} model call(s) · ${worker.brokerCalls ?? 0} broker lookup(s)`
        : payload?.status === "replayed"
          ? "Duplicate request suppressed; no second model run occurred."
          : "Canary completed.";
      setState({ status: "success", message: detail });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Synthetic canary could not complete safely.",
      });
    }
  }

  return (
    <div className="pointer-events-auto w-[min(92vw,390px)] rounded-[22px] border border-violet-200/20 bg-[#0a202d]/95 p-3.5 text-white shadow-2xl shadow-black/45 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-300/12 text-violet-200">
          <FlaskConical size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black">Synthetic preview canary</p>
            <ShieldCheck size={13} className="text-emerald-200/80" />
          </div>
          <p className="mt-1 text-[10px] leading-4 text-white/42">
            One bounded worker task. Synthetic context. Recommend + knowledge only. Read-only broker. Production denied in code.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={runCanary}
        disabled={state.status === "running"}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-300 px-3 text-xs font-black text-[#17102b] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {state.status === "running" ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Running bounded canary
          </>
        ) : (
          <>
            <FlaskConical size={14} /> Run synthetic preview canary
          </>
        )}
      </button>

      {state.status === "success" || state.status === "error" ? (
        <p
          className={`mt-2 text-[10px] leading-4 ${
            state.status === "success" ? "text-emerald-100/70" : "text-amber-100/75"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

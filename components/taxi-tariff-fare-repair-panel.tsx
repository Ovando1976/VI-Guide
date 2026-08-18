"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, ShieldAlert } from "lucide-react";

export function TaxiTariffFareRepairPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function submit(file: File, apply: boolean) {
    const response = await fetch(
      `/api/admin/taxi-tariffs/audit/repair${apply ? "?apply=true" : ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "text/csv; charset=utf-8" },
        body: await file.text(),
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to validate tariff fare repair.");
    }
    return payload as { repaired?: number; tariffCount?: number; dryRun?: boolean };
  }

  async function handleFile(file: File) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const preview = await submit(file, false);
      const repaired = preview.repaired ?? 0;
      const tariffCount = preview.tariffCount ?? 0;
      setMessage(
        `Dry run passed: ${repaired} missing group fares across ${tariffCount} tariff records are safe to fill.`,
      );
      const approved = window.confirm(
        `Dry run passed for ${repaired} rules across ${tariffCount} tariff records. Apply the repair now? Existing fares, route endpoints, governance state, and activation state will not be overwritten.`,
      );
      if (!approved) return;

      const applied = await submit(file, true);
      setMessage(
        `Repair applied: ${applied.repaired ?? 0} previously-missing group fares filled. Run the production audit again now.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to repair tariff group fares.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-[30px] border border-amber-200 bg-amber-50/70 p-5 text-[#043331] shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-amber-800">
            <ShieldAlert className="h-4 w-4" />
            Controlled data repair
          </div>
          <h2 className="mt-2 text-xl font-black tracking-[-.03em]">Restore published group fares</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Upload the reconciled CSV. The server first performs a dry run, requires every base fare to still match production, and refuses to overwrite any existing group fare. A second confirmation is required before Firestore is changed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          Validate fare repair CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {message ? <div className="mt-4 text-sm font-bold text-emerald-900">{message}</div> : null}
      {error ? <div className="mt-4 text-sm font-bold text-rose-900">{error}</div> : null}
    </section>
  );
}

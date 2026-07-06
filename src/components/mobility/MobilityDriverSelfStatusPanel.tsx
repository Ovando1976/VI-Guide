import { useState } from "react";
import { CheckCircle2, Clock, Power, RefreshCw } from "lucide-react";

import {
  updateMobilityDriverProfile,
  type MobilityDriverProfile,
  type MobilityDriverStatus,
} from "../../services/mobilityDrivers";

const STATUS_OPTIONS: Array<{
  value: MobilityDriverStatus;
  label: string;
  description: string;
}> = [
  {
    value: "available",
    label: "Available",
    description: "Ready for new dispatch assignments.",
  },
  {
    value: "busy",
    label: "Busy",
    description: "Working or temporarily unavailable.",
  },
  {
    value: "offline",
    label: "Offline",
    description: "Not accepting trips right now.",
  },
];

function statusIcon(status: MobilityDriverStatus) {
  if (status === "available") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "busy") return <Clock className="h-4 w-4" />;
  return <Power className="h-4 w-4" />;
}

function statusTone(status: MobilityDriverStatus, activeStatus: MobilityDriverStatus) {
  if (status !== activeStatus) {
    return "border-slate-200 bg-white text-slate-700 hover:border-emerald-300";
  }

  if (status === "available") {
    return "border-emerald-300 bg-emerald-700 text-white";
  }

  if (status === "busy") {
    return "border-amber-300 bg-amber-500 text-white";
  }

  return "border-slate-400 bg-slate-950 text-white";
}

export default function MobilityDriverSelfStatusPanel({
  selectedDriver,
}: {
  selectedDriver?: MobilityDriverProfile | null;
}) {
  const [savingStatus, setSavingStatus] =
    useState<MobilityDriverStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!selectedDriver) return null;

  async function handleStatusChange(status: MobilityDriverStatus) {
    if (!selectedDriver) return;

    setSavingStatus(status);
    setError(null);

    try {
      await updateMobilityDriverProfile(selectedDriver.driverId, {
        status,
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not update driver status.",
      );
    } finally {
      setSavingStatus(null);
    }
  }

  return (
    <section className="mx-auto mt-6 max-w-6xl rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Driver status
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {selectedDriver.driverName || selectedDriver.name}
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {selectedDriver.vehicleLabel} · Current status:{" "}
            <span className="capitalize text-emerald-800">
              {selectedDriver.status}
            </span>
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Dispatch visibility
          </p>
          <p className="mt-1 text-sm font-black text-emerald-950">
            {selectedDriver.status === "available"
              ? "Recommended"
              : selectedDriver.status === "busy"
                ? "Visible as busy"
                : "Visible as offline"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleStatusChange(option.value)}
            disabled={Boolean(savingStatus)}
            className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${statusTone(
              option.value,
              selectedDriver.status,
            )}`}
          >
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em]">
              {savingStatus === option.value ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                statusIcon(option.value)
              )}
              {option.label}
            </span>

            <span className="mt-2 block text-xs font-bold opacity-80">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}
    </section>
  );
}

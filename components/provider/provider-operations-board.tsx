"use client";

import {
  CalendarDays,
  Clock3,
  Loader2,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import type {
  ProviderAvailabilityDay,
  ProviderOperationsConfig,
} from "@/types/provider-operations";

function buildInitialDays(capacity: number): ProviderAvailabilityDay[] {
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      isOpen: true,
      capacity,
      startTime: "09:00",
      endTime: "17:00",
    };
  });
}

export function ProviderOperationsBoard() {
  const [listingId, setListingId] = useState("");
  const [listingName, setListingName] = useState("");
  const [defaultCapacity, setDefaultCapacity] = useState(10);
  const [days, setDays] = useState<ProviderAvailabilityDay[]>(() => buildInitialDays(10));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const openDays = days.filter((day) => day.isOpen);
    return {
      openDays: openDays.length,
      totalCapacity: openDays.reduce((sum, day) => sum + day.capacity, 0),
      blackoutDays: days.length - openDays.length,
    };
  }, [days]);

  async function loadProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listingId.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/provider-operations?listingId=${encodeURIComponent(listingId.trim())}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as
        | { config?: ProviderOperationsConfig | null; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to load provider operations.");

      if (payload?.config) {
        setListingName(payload.config.listingName);
        setDefaultCapacity(payload.config.defaultCapacity);
        setDays(payload.config.days.length ? payload.config.days : buildInitialDays(payload.config.defaultCapacity));
        setMessage("Provider operations loaded.");
      } else {
        setDays(buildInitialDays(defaultCapacity));
        setMessage("No saved operations found. Set availability and save the provider.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load provider operations.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProvider() {
    if (!listingId.trim() || !listingName.trim()) {
      setError("Enter a listing ID and provider name before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/provider-operations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listingId.trim(),
          listingName: listingName.trim(),
          timezone: "America/St_Thomas",
          defaultCapacity,
          days,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { config?: ProviderOperationsConfig; error?: string }
        | null;
      if (!response.ok || !payload?.config) {
        throw new Error(payload?.error || "Unable to save provider operations.");
      }
      setMessage("Provider availability and capacity saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save provider operations.");
    } finally {
      setSaving(false);
    }
  }

  function updateDay(index: number, patch: Partial<ProviderAvailabilityDay>) {
    setDays((current) =>
      current.map((day, currentIndex) =>
        currentIndex === index ? { ...day, ...patch } : day,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">Provider Operations</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Availability & Capacity</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Set operating days, hours, capacity, and blackout periods for each participating business.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveProvider()}
              disabled={saving}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save operations
            </button>
          </div>
        </section>

        <form onSubmit={loadProvider} className="mt-6 grid gap-3 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_160px_140px]">
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Listing ID
            <input
              required
              value={listingId}
              onChange={(event) => setListingId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
              placeholder="provider-listing-id"
            />
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Provider name
            <input
              required
              value={listingName}
              onChange={(event) => setListingName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
              placeholder="Island operator"
            />
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Default capacity
            <input
              type="number"
              min={1}
              max={500}
              value={defaultCapacity}
              onChange={(event) => setDefaultCapacity(Number(event.target.value) || 1)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load provider"}
          </button>
        </form>

        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div> : null}
        {message ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">{message}</div> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric icon={CalendarDays} label="Open days" value={String(summary.openDays)} />
          <Metric icon={Users} label="Total capacity" value={String(summary.totalCapacity)} />
          <Metric icon={ShieldCheck} label="Blackout days" value={String(summary.blackoutDays)} />
        </section>

        <section className="mt-6 space-y-3">
          {days.map((day, index) => (
            <article key={day.date} className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[150px_110px_120px_120px_130px_1fr] md:items-end">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Date</p>
                <p className="mt-2 text-sm font-black">{day.date}</p>
              </div>
              <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                Open
                <button
                  type="button"
                  onClick={() => updateDay(index, { isOpen: !day.isOpen })}
                  className={`mt-2 min-h-11 w-full rounded-2xl text-[9px] font-black uppercase tracking-[.14em] ${day.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}
                >
                  {day.isOpen ? "Open" : "Closed"}
                </button>
              </label>
              <Field label="Start" value={day.startTime} type="time" onChange={(value) => updateDay(index, { startTime: value })} />
              <Field label="End" value={day.endTime} type="time" onChange={(value) => updateDay(index, { endTime: value })} />
              <Field label="Capacity" value={String(day.capacity)} type="number" onChange={(value) => updateDay(index, { capacity: Number(value) || 0 })} />
              <Field label="Operations note" value={day.note ?? ""} onChange={(value) => updateDay(index, { note: value })} placeholder="Weather, staffing, pickup window..." />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
      />
    </label>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <div className="mt-4 text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</div>
    </div>
  );
}

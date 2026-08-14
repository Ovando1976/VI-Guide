"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Send,
  ShieldCheck,
  ShipWheel,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type PortOption = {
  id: string;
  label: string;
};

export type ShoreExcursionCruiseDefaults = {
  startDate?: string;
  preferredTime?: string;
  shipName?: string;
  cruiseLine?: string;
  portId?: string;
  allAboardTime?: string;
  allAboardEstimated?: boolean;
  officialPortCall?: string;
  partySize?: number;
};

type Props = {
  offerId: string;
  offerTitle: string;
  durationMinutes: number;
  minReturnBufferMinutes: number;
  maxGuests: number;
  ports: PortOption[];
  defaults?: ShoreExcursionCruiseDefaults;
};

export function ShoreExcursionBookingForm({
  offerId,
  offerTitle,
  durationMinutes,
  minReturnBufferMinutes,
  maxGuests,
  ports,
  defaults,
}: Props) {
  const today = useMemo(() => getUsviToday(), []);
  const defaultPartySize = normalizePartySize(defaults?.partySize, 2);
  const [form, setForm] = useState(() => ({
    startDate:
      defaults?.startDate && defaults.startDate >= today
        ? defaults.startDate
        : today,
    preferredTime: validTime(defaults?.preferredTime)
      ? defaults!.preferredTime!
      : "09:00",
    shipName: defaults?.shipName?.slice(0, 160) ?? "",
    cruiseLine: defaults?.cruiseLine?.slice(0, 160) ?? "",
    portId:
      defaults?.portId && ports.some((port) => port.id === defaults.portId)
        ? defaults.portId
        : ports[0]?.id ?? "",
    allAboardTime: validTime(defaults?.allAboardTime)
      ? defaults!.allAboardTime!
      : "16:30",
    adults: String(Math.min(maxGuests, defaultPartySize)),
    children: "0",
    guestName: "",
    email: "",
    phone: "",
    notes: "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    reference: string;
    bookingId: string;
    duplicate: boolean;
  } | null>(null);

  const timing = useMemo(
    () =>
      calculateTiming({
        startTime: form.preferredTime,
        allAboardTime: form.allAboardTime,
        durationMinutes,
        minReturnBufferMinutes,
      }),
    [
      form.preferredTime,
      form.allAboardTime,
      durationMinutes,
      minReturnBufferMinutes,
    ],
  );

  function patch(values: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...values }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/shore-excursions/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          startDate: form.startDate,
          preferredTime: form.preferredTime,
          shipName: form.shipName,
          cruiseLine: form.cruiseLine,
          portId: form.portId,
          allAboardTime: form.allAboardTime,
          adults: Number(form.adults),
          children: Number(form.children),
          guestName: form.guestName,
          email: form.email,
          ...(defaults?.officialPortCall
            ? { officialPortCall: defaults.officialPortCall }
            : {}),
          ...(form.phone ? { phone: form.phone } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            bookingId?: string;
            reference?: string;
            duplicate?: boolean;
            error?: string;
          }
        | null;
      if (!response.ok || !payload?.bookingId || !payload.reference) {
        throw new Error(payload?.error || "Unable to submit this shore excursion request.");
      }
      setSuccess({
        bookingId: payload.bookingId,
        reference: payload.reference,
        duplicate: payload.duplicate === true,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to submit this shore excursion request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-6 text-[#043331] shadow-sm sm:p-8">
        <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        <p className="mt-5 text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">
          {success.duplicate ? "Request already received" : "Cruise-day request received"}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
          {success.duplicate
            ? "USVI Explorer found your existing shore excursion request."
            : "Your shore excursion request is in the operator queue."}
        </h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-emerald-950/70">
          Reference <strong>{success.reference}</strong>. The request captured your
          ship, port, all-aboard time, and the excursion&apos;s required return buffer.
          When provider capacity is published, USVI Explorer rechecks it at submission;
          the operator still confirms final pickup and fulfillment details.
        </p>
        <a
          href={`/bookings?booking=${encodeURIComponent(success.bookingId)}`}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
        >
          Track this request
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 text-[#043331] shadow-sm sm:p-8">
      <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
        <ShipWheel className="h-4 w-4" /> Match this excursion to my ship
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
        Check the return window before requesting {offerTitle}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        USVI Explorer will reject a start time that cannot preserve the operator&apos;s{" "}
        {minReturnBufferMinutes}-minute minimum return-to-ship buffer.
      </p>

      {defaults?.shipName || defaults?.startDate ? (
        <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4 text-sm font-semibold leading-6 text-teal-950/75">
          <strong className="text-teal-900">
            {defaults.officialPortCall
              ? "Official port-call match applied."
              : "Selected sailing applied."}
          </strong>{" "}
          Ship, port date, cruise line, and available ship-clock values were carried
          into this request automatically.
          {defaults.allAboardEstimated ? (
            <span className="mt-2 block text-amber-800">
              The all-aboard value is a planning proxy set 30 minutes before the
              published scheduled departure. Verify the ship&apos;s actual all-aboard
              announcement onboard and edit this field if it differs.
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={`mt-5 rounded-2xl border px-4 py-4 ${
          timing.ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <div className="flex gap-3">
          {timing.ok ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          )}
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em]">
              {timing.ok ? "Timing clears the minimum buffer" : "Choose an earlier start"}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 opacity-75">
              {timing.ok
                ? `Planned return to port ${timing.excursionEndsAt}; safe return deadline ${timing.safeReturnDeadline}.`
                : timing.latestSafeStartTime
                  ? `Latest safe start is ${timing.latestSafeStartTime} for an all-aboard time of ${form.allAboardTime}.`
                  : "Enter a valid excursion start and same-day all-aboard time."}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Port date" icon={CalendarDays}>
          <input
            type="date"
            min={today}
            value={form.startDate}
            onChange={(event) => patch({ startDate: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Cruise port" icon={ShipWheel}>
          <select
            value={form.portId}
            onChange={(event) => patch({ portId: event.target.value })}
            className={inputClass()}
          >
            {ports.map((port) => (
              <option key={port.id} value={port.id}>
                {port.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ship name" icon={ShipWheel}>
          <input
            value={form.shipName}
            onChange={(event) => patch({ shipName: event.target.value })}
            maxLength={160}
            className={inputClass()}
            placeholder="e.g. Icon of the Seas"
          />
        </Field>
        <Field label="Cruise line (optional)">
          <input
            value={form.cruiseLine}
            onChange={(event) => patch({ cruiseLine: event.target.value })}
            maxLength={160}
            className={inputClass()}
            placeholder="e.g. Royal Caribbean"
          />
        </Field>
        <Field label="Excursion start" icon={Clock3}>
          <input
            type="time"
            value={form.preferredTime}
            onChange={(event) => patch({ preferredTime: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Ship all aboard" icon={Clock3}>
          <input
            type="time"
            value={form.allAboardTime}
            onChange={(event) => patch({ allAboardTime: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Adults" icon={Users}>
          <input
            type="number"
            min={1}
            max={maxGuests}
            value={form.adults}
            onChange={(event) => patch({ adults: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Children" icon={Users}>
          <input
            type="number"
            min={0}
            max={maxGuests}
            value={form.children}
            onChange={(event) => patch({ children: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Guest name">
          <input
            value={form.guestName}
            onChange={(event) => patch({ guestName: event.target.value })}
            maxLength={160}
            className={inputClass()}
            placeholder="Full name"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
            maxLength={220}
            className={inputClass()}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => patch({ phone: event.target.value })}
            maxLength={40}
            className={inputClass()}
            placeholder="(340) 555-0123"
          />
        </Field>
        <div className="hidden sm:block" />
        <div className="sm:col-span-2">
          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              maxLength={1600}
              rows={4}
              className={inputClass("py-3")}
              placeholder="Mobility needs, children ages, celebrations, or pickup questions"
            />
          </Field>
        </div>
      </div>

      <button
        type="button"
        disabled={submitting || !timing.ok}
        onClick={() => void submit()}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.15em] text-[#043331] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Request shore excursion
      </button>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
      <span className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-teal-700" /> : null}
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function calculateTiming(input: {
  startTime: string;
  allAboardTime: string;
  durationMinutes: number;
  minReturnBufferMinutes: number;
}) {
  const start = parseTime(input.startTime);
  const allAboard = parseTime(input.allAboardTime);
  if (start === null || allAboard === null || allAboard <= start) {
    return { ok: false as const, latestSafeStartTime: null };
  }
  const excursionEnds = start + input.durationMinutes;
  const safeReturnDeadline = allAboard - input.minReturnBufferMinutes;
  const latestSafeStart = safeReturnDeadline - input.durationMinutes;
  return excursionEnds <= safeReturnDeadline
    ? {
        ok: true as const,
        excursionEndsAt: formatMinutes(excursionEnds),
        safeReturnDeadline: formatMinutes(safeReturnDeadline),
      }
    : {
        ok: false as const,
        latestSafeStartTime:
          latestSafeStart >= 0 ? formatMinutes(latestSafeStart) : null,
      };
}

function parseTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizePartySize(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(100, Math.trunc(number)));
}

function getUsviToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function inputClass(extra = "") {
  return `min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600 ${extra}`;
}

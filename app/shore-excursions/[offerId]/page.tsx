import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Route,
  ShieldCheck,
  ShipWheel,
  Users,
} from "lucide-react";

import { CruiseHubNav } from "@/components/cruise/cruise-hub-nav";
import {
  ShoreExcursionBookingForm,
  type ShoreExcursionCruiseDefaults,
} from "@/components/shore-excursions/shore-excursion-booking-form";
import { formatMerchantOfferMoney } from "@/lib/merchant-offers";
import { loadPublicShoreExcursion } from "@/lib/shore-excursion-public";
import { shoreExcursionPort } from "@/lib/shore-excursions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ShoreExcursionDetailPage({
  params,
  searchParams = {},
}: {
  params: { offerId: string };
  searchParams?: SearchParams;
}) {
  const excursion = await loadPublicShoreExcursion(params.offerId);
  if (!excursion) notFound();

  const ports = excursion.supportedPorts
    .map((portId) => shoreExcursionPort(portId))
    .filter(isShoreExcursionPort);
  const defaults = cruiseDefaults(searchParams);
  const backHref = withQuery("/shore-excursions", preserveCruiseQuery(searchParams));

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-28 text-[#043331]">
      <CruiseHubNav compact />
      <section className="px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" /> Port-day options
          </Link>

          <section className="mt-5 overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.38),transparent_36%),linear-gradient(145deg,#032f2d,#0b6b64)] p-8 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:p-12 lg:p-16">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-[#f5c451]">
                  <ShipWheel className="h-4 w-4" /> Cruise Hub · Port-day booking
                </p>
                <h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
                  {excursion.offer.offerTitle}
                </h1>
                <p className="mt-5 text-sm font-semibold text-white/60">
                  Operated by {excursion.offer.listingName} · {humanizeIsland(excursion.island)}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[.08] p-6">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-white/45">
                  Package price
                </p>
                <p className="mt-2 text-4xl font-black tracking-[-.04em]">
                  {formatMerchantOfferMoney(excursion.offer.offerPriceCents)}
                </p>
                <p className="mt-2 text-xs font-semibold text-white/60">
                  {excursion.offer.offerDepositCents
                    ? `${formatMerchantOfferMoney(excursion.offer.offerDepositCents)} deposit after operator availability review`
                    : "Availability is confirmed before any payment request"}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-7 grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div className="space-y-6">
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                  Cruise-day operating profile
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Detail
                    icon={Clock3}
                    label="Port-to-port duration"
                    value={formatDuration(excursion.durationMinutes)}
                  />
                  <Detail
                    icon={ShieldCheck}
                    label="Minimum ship buffer"
                    value={`${excursion.minReturnBufferMinutes} minutes`}
                  />
                  <Detail
                    icon={Users}
                    label="Maximum request"
                    value={`${excursion.maxGuests} guests`}
                  />
                  <Detail
                    icon={Route}
                    label="Port pickup"
                    value={excursion.pickupIncluded ? "Included" : "Meeting point"}
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
                    Meeting point
                  </p>
                  <p className="mt-2 text-sm font-black leading-6">
                    {excursion.meetingPoint}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
                    Supported cruise ports
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ports.map((port) => (
                      <span
                        key={port.id}
                        className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-[9px] font-black text-teal-800"
                      >
                        <MapPin className="h-3.5 w-3.5" /> {port.label}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {excursion.mobilityNotes || excursion.accessibilityNotes ? (
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-2xl font-black tracking-[-.04em]">
                    Before you book
                  </h2>
                  {excursion.mobilityNotes ? (
                    <TextDetail label="Pickup and transportation" value={excursion.mobilityNotes} />
                  ) : null}
                  {excursion.accessibilityNotes ? (
                    <TextDetail label="Accessibility" value={excursion.accessibilityNotes} />
                  ) : null}
                </section>
              ) : null}
            </div>

            <ShoreExcursionBookingForm
              offerId={excursion.offer.offerId}
              offerTitle={excursion.offer.offerTitle}
              durationMinutes={excursion.durationMinutes}
              minReturnBufferMinutes={excursion.minReturnBufferMinutes}
              maxGuests={excursion.maxGuests}
              ports={ports.map((port) => ({ id: port.id, label: port.label }))}
              defaults={defaults}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function cruiseDefaults(searchParams: SearchParams): ShoreExcursionCruiseDefaults | undefined {
  const startDate = firstValue(searchParams.date);
  const arrival = firstValue(searchParams.arrival);
  const allAboard = firstValue(searchParams.allAboard);
  const shipName = firstValue(searchParams.ship);
  const cruiseLine = firstValue(searchParams.cruiseLine);
  const portId = firstValue(searchParams.portId);
  if (!startDate && !shipName && !allAboard && !cruiseLine) return undefined;
  return {
    ...(validDate(startDate) ? { startDate } : {}),
    ...(validTime(arrival) ? { preferredTime: addMinutes(arrival, 60) } : {}),
    ...(shipName ? { shipName: shipName.slice(0, 160) } : {}),
    ...(cruiseLine ? { cruiseLine: cruiseLine.slice(0, 160) } : {}),
    ...(portId ? { portId: portId.slice(0, 80) } : {}),
    ...(validTime(allAboard) ? { allAboardTime: allAboard } : {}),
    allAboardEstimated: firstValue(searchParams.allAboardEstimated) === "1",
  };
}

function preserveCruiseQuery(searchParams: SearchParams) {
  const allowed = [
    "cruiseTrip",
    "sailing",
    "ship",
    "cruiseLine",
    "date",
    "portName",
    "island",
    "portId",
    "arrival",
    "allAboard",
    "allAboardEstimated",
  ] as const;
  const params = new URLSearchParams();
  for (const key of allowed) {
    const value = firstValue(searchParams[key]);
    if (value) params.set(key, value.slice(0, 220));
  }
  return params;
}

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function addMinutes(value: string, minutes: number) {
  const [hour, minute] = value.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, hour * 60 + minute + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function isShoreExcursionPort(
  value: ReturnType<typeof shoreExcursionPort>,
): value is NonNullable<ReturnType<typeof shoreExcursionPort>> {
  return value !== null;
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-3 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function TextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-5 first:border-0 first:pt-0">
      <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-slate-600">
        {value}
      </p>
    </div>
  );
}

function humanizeIsland(value: string) {
  return value === "stt"
    ? "St. Thomas"
    : value === "stj"
      ? "St. John"
      : "St. Croix";
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes} min`;
  if (!remainder) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr ${remainder} min`;
}

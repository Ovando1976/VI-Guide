import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  User,
} from "lucide-react";

import {
  createBusinessAppointment,
  createBusinessTimelineEvent,
  updateBusinessAppointmentStatus,
  type BusinessAppointment,
  type BusinessAppointmentStatus,
} from "../firestore";
import type { BusinessOSData } from "../types";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type Appointment = {
  id: string;
  title: string;
  businessId?: string;
  businessName: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  source: "firestore" | "lead" | "manual";
  status?: BusinessAppointmentStatus | "suggested";
};

export default function AppointmentCalendar({
  data,
  onRefresh,
}: {
  data: BusinessOSData;
  onRefresh?: () => void;
}) {
  const liveAppointments = useMemo(() => buildLiveAppointments(data), [data]);
  const leadAppointments = useMemo(() => buildLeadAppointments(data), [data]);

  const [manualAppointments, setManualAppointments] = useState<Appointment[]>([]);
  const [titleDraft, setTitleDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const appointments = [...manualAppointments, ...liveAppointments, ...leadAppointments];
  const scheduledCount = appointments.filter(
    (item) => item.status === "scheduled" || item.status === "confirmed",
  ).length;

  const defaultBusinessId = data.businesses[0]?.id ?? "";

  async function addAppointment() {
    const title = titleDraft.trim();
    const location = locationDraft.trim();

    if (!title) return;

    if (!defaultBusinessId) {
      setNotice("Create or claim a business listing before saving appointments.");
      return;
    }

    setSaving(true);
    setNotice(null);
    onRefresh?.();

    try {
      const startAt = Date.now() + 60 * 60 * 1000;
      const endAt = startAt + 60 * 60 * 1000;

      const appointmentId = await createBusinessAppointment({
        businessId: defaultBusinessId,
        title,
        location: location || "Customer Site",
        notes: "Created from Business OS calendar.",
        startAt,
        endAt,
      });

      await createBusinessTimelineEvent({
       businessId: defaultBusinessId,
       type: "appointment",
       title: "Appointment scheduled",
       description: `${title} at ${location || "Customer Site"}`,
       source: "Business OS Calendar",
      });

      const businessName =
        data.businessById.get(defaultBusinessId)?.name || "Saved Appointment";

      setManualAppointments((current) => [
        {
          id: appointmentId,
          title,
          businessId: defaultBusinessId,
          businessName,
          date: formatDate(startAt),
          time: formatTime(startAt),
          location: location || "Customer Site",
          notes: "Created from Business OS calendar.",
          source: "manual",
          status: "scheduled",
        },
        ...current,
      ]);

      setTitleDraft("");
      setLocationDraft("");
    } catch (error) {
      console.error("Failed to create business appointment:", error);
      setNotice("Appointment could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function cycleAppointmentStatus(appointment: Appointment) {
    if (appointment.source === "lead") return;

    const currentStatus =
      appointment.status === "confirmed" ||
      appointment.status === "completed" ||
      appointment.status === "cancelled"
        ? appointment.status
        : "scheduled";

    const nextStatus = nextAppointmentStatus(currentStatus);

    if (appointment.source === "manual") {
      setManualAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? { ...item, status: nextStatus } : item,
        ),
      );
    }

    setUpdatingAppointmentId(appointment.id);
    setNotice(null);

    try {
      await updateBusinessAppointmentStatus(appointment.id, nextStatus);

      if (appointment.businessId) {
      await createBusinessTimelineEvent({
       businessId: appointment.businessId,
       type: "appointment",
       title: `Appointment marked ${nextStatus}`,
       description: appointment.title,
       source: "Business OS Calendar",
      });
      onRefresh?.();
     }
    } catch (error) {
      console.error("Failed to update appointment:", error);
      setNotice("Appointment status could not be updated.");

      if (appointment.source === "manual") {
        setManualAppointments((current) =>
          current.map((item) =>
            item.id === appointment.id
              ? { ...item, status: appointment.status }
              : item,
          ),
        );
      }
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Appointment Calendar"
        text={`${scheduledCount} scheduled or confirmed appointment${scheduledCount === 1 ? "" : "s"}.`}
        icon={CalendarDays}
      />

      <div className="border-b border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_auto]">
          <input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addAppointment();
            }}
            placeholder="Appointment title..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
          />

          <input
            value={locationDraft}
            onChange={(event) => setLocationDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addAppointment();
            }}
            placeholder="Location..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
          />

          <button
            type="button"
            onClick={() => void addAppointment()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving" : "Add"}
          </button>
        </div>

        {notice ? (
          <p className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm font-bold text-yellow-100">
            {notice}
          </p>
        ) : null}
      </div>

      {appointments.length === 0 ? (
        <div className="p-8 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No appointments scheduled</h3>
          <p className="mt-2 text-sm text-white/60">
            Scheduled jobs and customer bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 p-5 lg:grid-cols-2">
          {appointments.map((appointment) => {
            const isUpdating = updatingAppointmentId === appointment.id;
            const canUpdate = appointment.source !== "lead";

            return (
              <div
                key={appointment.id}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{appointment.title}</p>
                    <p className="mt-1 text-sm font-bold text-cyan-200">
                      {appointment.businessName}
                    </p>
                  </div>

                  {canUpdate ? (
                    <button
                      type="button"
                      onClick={() => void cycleAppointmentStatus(appointment)}
                      disabled={isUpdating}
                      className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black uppercase text-slate-950 disabled:opacity-60"
                    >
                      {isUpdating ? "Saving" : appointment.status ?? "scheduled"}
                    </button>
                  ) : (
                    <StatusBadge status={appointment.status} />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge icon={<CalendarDays className="h-3.5 w-3.5" />}>
                    {appointment.date}
                  </Badge>

                  <Badge icon={<Clock className="h-3.5 w-3.5" />}>
                    {appointment.time}
                  </Badge>

                  <Badge icon={<MapPin className="h-3.5 w-3.5" />}>
                    {appointment.location}
                  </Badge>

                  <Badge icon={<User className="h-3.5 w-3.5" />}>
                    {appointment.source === "lead"
                      ? "Suggested"
                      : appointment.source === "manual"
                        ? "New"
                        : "Saved"}
                  </Badge>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/65">
                  {appointment.notes || "No notes yet."}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </BusinessOSCard>
  );
}

function buildLiveAppointments(data: BusinessOSData): Appointment[] {
  return data.appointments
    .slice()
    .sort((a, b) => (a.startAt || 0) - (b.startAt || 0))
    .map((appointment: BusinessAppointment) => ({
      id: appointment.id,
      title: appointment.title,
      businessId: appointment.businessId,
      businessName:
        data.businessById.get(appointment.businessId)?.name ?? "Unknown business",
      date: formatDate(appointment.startAt),
      time: formatTime(appointment.startAt),
      location: appointment.location || "Customer Site",
      notes: appointment.notes || "",
      source: "firestore",
      status: appointment.status,
    }));
}

function buildLeadAppointments(data: BusinessOSData): Appointment[] {
  const liveLeadAppointmentIds = new Set(
    data.appointments.map((appointment) => appointment.leadId).filter(Boolean),
  );

  return data.leads
    .filter((lead) => !liveLeadAppointmentIds.has(lead.id))
    .slice(0, 8)
    .map((lead, index) => ({
      id: `lead-${lead.id}`,
      title: lead.visitorName,
      businessId: lead.businessId,
      businessName:
        data.businessById.get(lead.businessId)?.name ?? "Unknown business",
      date: formatDate(lead.createdAt),
      time: suggestedTime(index),
      location: "Follow-up Visit",
      notes: lead.message,
      source: "lead",
      status: "suggested",
    }));
}

function suggestedTime(index: number) {
  const slots = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM"];
  return slots[index % slots.length];
}

function formatTime(value?: number) {
  if (!value) return "TBD";

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextAppointmentStatus(
  status: BusinessAppointmentStatus,
): BusinessAppointmentStatus {
  if (status === "scheduled") return "confirmed";
  if (status === "confirmed") return "completed";
  if (status === "completed") return "scheduled";
  if (status === "cancelled") return "scheduled";
  return "scheduled";
}

function Badge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/55">
      {icon}
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const tone =
    status === "completed"
      ? "bg-emerald-300 text-slate-950"
      : status === "cancelled"
        ? "bg-red-300 text-slate-950"
        : status === "suggested"
          ? "bg-yellow-300 text-slate-950"
          : "bg-cyan-300 text-slate-950";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${tone}`}>
      {status ?? "Scheduled"}
    </span>
  );
}
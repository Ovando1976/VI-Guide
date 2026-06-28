import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckSquare2,
  DollarSign,
  FileText,
  Hammer,
  Lightbulb,
  MapPin,
  ReceiptText,
  Search,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { createBusinessTimelineEvent } from "../firestore";
import {
  updateBusinessJobStatus,
  type BusinessJob,
} from "../jobs";
import type { BusinessOSData } from "../types";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type JobStatusFilter = "all" | BusinessJob["status"];

type JobBundle = {
  job: BusinessJob;
  customerName: string;
  estimateTotal: number;
  invoiceTotal: number;
  paid: number;
  balance: number;
  taskCount: number;
  appointmentLabel: string;
  nextAction: string;
};

export default function JobWorkspace({
  data,
  onRefresh,
}: {
  data: BusinessOSData;
  onRefresh?: () => void;
}) {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  const jobs = useMemo(
    () =>
      data.jobs
        .slice()
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 50),
    [data.jobs],
  );

  const bundles = useMemo(
    () => jobs.map((job) => buildJobBundle(job, data)),
    [jobs, data],
  );

  const filteredBundles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bundles.filter((bundle) => {
      const matchesStatus =
        statusFilter === "all" || bundle.job.status === statusFilter;

      const matchesSearch =
        !term ||
        [
          bundle.job.title,
          bundle.job.description,
          bundle.job.location,
          bundle.customerName,
          bundle.job.status,
          bundle.job.priority,
          bundle.nextAction,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [bundles, search, statusFilter]);

  const selectedBundle =
    filteredBundles.find((bundle) => bundle.job.id === selectedJobId) ||
    filteredBundles[0];
  async function changeJobStatus(
  job: BusinessJob,
  status: BusinessJob["status"],
) {
  if (job.status === status) return;

  setUpdatingJobId(job.id);

  try {
    await updateBusinessJobStatus(job.id, status);

    await createBusinessTimelineEvent({
      businessId: job.businessId,
      jobId: job.id,
      leadId: job.leadId,
      customerId: job.customerId,
      type: "job_status",
      source: "Job Workspace",
      title: `Job moved to ${status.replace(/_/g, " ")}`,
      description: `${job.title} is now ${status.replace(/_/g, " ")}.`,
    });

    onRefresh?.();
  } catch (error) {
    console.error("Failed to update job:", error);
  } finally {
    setUpdatingJobId(null);
  }
}  

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Job Workspace"
        text="Mission control for every job: customer, estimate, invoice, payments, schedule, tasks, and next action."
        icon={Hammer}
      />

      {jobs.length === 0 ? (
        <div className="p-8 text-center">
          <Hammer className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No jobs yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Convert leads into jobs to manage estimates, invoices, tasks, appointments, and payments from one place.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[44rem] border-t border-white/10 xl:grid-cols-[18rem_1fr_18rem]">
          <aside className="border-b border-white/10 p-4 xl:border-b-0 xl:border-r">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search jobs..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "lead", "estimating", "scheduled", "in_progress", "completed"] as JobStatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-2 text-[10px] font-black uppercase ${
                      statusFilter === status
                        ? "bg-cyan-300 text-slate-950"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ),
              )}
            </div>

            <div className="mt-4 space-y-2">
              {filteredBundles.map((bundle) => {
                const active = selectedBundle?.job.id === bundle.job.id;

                return (
                  <button
                    key={bundle.job.id}
                    type="button"
                    onClick={() => setSelectedJobId(bundle.job.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-300 bg-cyan-300/15"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-black text-white">
                        {bundle.job.title}
                      </p>
                      <StatusDot status={bundle.job.status} />
                    </div>

                    <p className="mt-2 line-clamp-1 text-xs font-bold text-cyan-200">
                      {bundle.customerName}
                    </p>

                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                      {bundle.nextAction}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 p-5">
            {selectedBundle ? (
              <SelectedJobPanel bundle={selectedBundle} data={data} />
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <Hammer className="mx-auto h-12 w-12 text-cyan-300" />
                  <h3 className="mt-4 text-2xl font-black">No matching jobs</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Adjust your search or filter.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="border-t border-white/10 p-5 xl:border-l xl:border-t-0">
            {selectedBundle ? <JobCoachPanel bundle={selectedBundle} /> : null}
          </aside>
        </div>
      )}
    </BusinessOSCard>
  );
}



function SelectedJobPanel({
  bundle,
  data,
}: {
  bundle: JobBundle;
  data: BusinessOSData;
}) {
  const { job } = bundle;

  const customer = job.customerId
    ? data.customers.find((item) => item.id === job.customerId)
    : data.customers.find((item) => item.leadId && item.leadId === job.leadId);

  const estimate = job.estimateId
    ? data.estimates.find((item) => item.id === job.estimateId)
    : data.estimates.find((item) => item.leadId && item.leadId === job.leadId);

  const invoice = job.invoiceId
    ? data.invoices.find((item) => item.id === job.invoiceId)
    : data.invoices.find((item) => item.leadId && item.leadId === job.leadId);

  const tasks = data.tasks.filter((task) => job.leadId && task.leadId === job.leadId);
  const appointments = data.appointments.filter(
    (appointment) => job.leadId && appointment.leadId === job.leadId,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-3xl font-black text-white">{job.title}</h3>
              <StatusBadge status={job.status} />
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/55">
                {job.priority}
              </span>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
              {job.description || "No job description yet."}
            </p>
          </div>

          <div className="rounded-2xl bg-cyan-300/15 px-5 py-4 text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              Balance Due
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              ${bundle.balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <InfoPill icon={UserRound} label={bundle.customerName} />
          <InfoPill icon={CalendarDays} label={bundle.appointmentLabel} />
          <InfoPill icon={MapPin} label={job.location || "No location"} />
          <InfoPill icon={CheckSquare2} label={`${bundle.taskCount} task${bundle.taskCount === 1 ? "" : "s"}`} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          icon={FileText}
          label="Estimate"
          value={estimate ? `$${estimate.total.toLocaleString()}` : "Missing"}
          detail={estimate?.status || "Create estimate"}
        />

        <MiniMetric
          icon={ReceiptText}
          label="Invoice"
          value={invoice ? `$${invoice.total.toLocaleString()}` : "Missing"}
          detail={invoice?.status || "Create invoice"}
        />

        <MiniMetric
          icon={DollarSign}
          label="Paid"
          value={`$${bundle.paid.toLocaleString()}`}
          detail={bundle.balance > 0 ? "Payment due" : "Current"}
        />

        <MiniMetric
          icon={CalendarDays}
          label="Schedule"
          value={bundle.appointmentLabel}
          detail={job.startAt ? formatDate(job.startAt) : "Not scheduled"}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <MiniList
          title="Tasks"
          empty="No tasks connected."
          items={tasks.map((task) => ({
            id: task.id,
            title: task.title,
            meta: `${task.status} · ${task.priority}`,
          }))}
        />

        <MiniList
          title="Appointments"
          empty="No appointments connected."
          items={appointments.map((appointment) => ({
            id: appointment.id,
            title: appointment.title,
            meta: `${appointment.status} · ${formatDate(appointment.startAt)}`,
          }))}
        />

        <MiniList
          title="Customer"
          empty="No customer profile connected."
          items={
            customer
              ? [
                  {
                    id: customer.id,
                    title: customer.name,
                    meta: `${customer.status} · LTV $${customer.lifetimeValue.toLocaleString()}`,
                  },
                ]
              : []
          }
        />

        <MiniList
          title="Money Records"
          empty="No money records connected."
          items={[
            ...(estimate
              ? [
                  {
                    id: estimate.id,
                    title: `Estimate: ${estimate.title}`,
                    meta: `$${estimate.total.toLocaleString()} · ${estimate.status}`,
                  },
                ]
              : []),
            ...(invoice
              ? [
                  {
                    id: invoice.id,
                    title: `Invoice: ${invoice.title}`,
                    meta: `$${invoice.total.toLocaleString()} · ${invoice.status}`,
                  },
                ]
              : []),
          ]}
        />
      </section>
    </div>
  );
}

function JobCoachPanel({ bundle }: { bundle: JobBundle }) {
  const recommendations = buildRecommendations(bundle);

  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-5 w-5 text-cyan-200" />
          <h3 className="font-black text-white">AI Job Coach</h3>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-white/65">
          Next best action:
        </p>

        <p className="mt-2 text-xl font-black text-cyan-100">
          {bundle.nextAction}
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-200" />
          <h3 className="font-black text-white">Recommendations</h3>
        </div>

        <div className="mt-4 space-y-3">
          {recommendations.map((item) => (
            <div key={item} className="rounded-2xl bg-white/[0.06] p-3 text-sm leading-relaxed text-white/65">
              {item}
            </div>
          ))}
        </div>
      </div>

      {bundle.balance > 0 ? (
        <div className="rounded-[1.5rem] border border-yellow-300/20 bg-yellow-300/10 p-5">
          <AlertTriangle className="h-5 w-5 text-yellow-200" />
          <p className="mt-3 text-sm font-bold text-yellow-100">
            ${bundle.balance.toLocaleString()} still needs to be collected.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function buildJobBundle(job: BusinessJob, data: BusinessOSData): JobBundle {
  const customer = job.customerId
    ? data.customers.find((item) => item.id === job.customerId)
    : data.customers.find((item) => item.leadId && item.leadId === job.leadId);

  const estimate = job.estimateId
    ? data.estimates.find((item) => item.id === job.estimateId)
    : data.estimates.find((item) => item.leadId && item.leadId === job.leadId);

  const invoice = job.invoiceId
    ? data.invoices.find((item) => item.id === job.invoiceId)
    : data.invoices.find((item) => item.leadId && item.leadId === job.leadId);

  const tasks = data.tasks.filter((task) => job.leadId && task.leadId === job.leadId);

  const appointment = data.appointments.find(
    (item) => job.leadId && item.leadId === job.leadId,
  );

  const payments = data.payments.filter((payment) => {
    if (invoice?.id && payment.invoiceId === invoice.id) return true;
    if (customer?.name && payment.customerName === customer.name) return true;
    return false;
  });

  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const invoiceTotal = invoice?.total || 0;
  const balance = Math.max(invoiceTotal - paid, 0);
  const nextAction = getNextAction(job, Boolean(estimate), Boolean(invoice), paid, balance);

  return {
    job,
    customerName: customer?.name || "No customer",
    estimateTotal: estimate?.total || 0,
    invoiceTotal,
    paid,
    balance,
    taskCount: tasks.length,
    appointmentLabel: appointment ? formatDate(appointment.startAt) : "Not scheduled",
    nextAction,
  };
}

function getNextAction(
  job: BusinessJob,
  hasEstimate: boolean,
  hasInvoice: boolean,
  paid: number,
  balance: number,
) {
  if (paid > 0) return "Mark job completed";
  if (!hasEstimate) return "Create estimate";
  if (!hasInvoice) return "Create invoice";
  if (balance > 0) return "Collect payment";
  if (paid > 0 && job.status !== "completed") return "Mark job completed";
  if (job.status === "scheduled") return "Prepare materials";
  return "Follow up";
}

function buildRecommendations(bundle: JobBundle) {
  const items: string[] = [];

  if (bundle.customerName === "No customer") {
    items.push("Connect this job to a customer profile so history and lifetime value can be tracked.");
  }

  if (bundle.estimateTotal === 0) {
    items.push("Create an estimate so the projected value is visible in reports.");
  }

  if (bundle.invoiceTotal === 0) {
    items.push("Create an invoice once the customer approves the estimate.");
  }

  if (bundle.balance > 0) {
    items.push("Follow up on the unpaid balance before scheduling more work.");
  }

  if (bundle.taskCount === 0) {
    items.push("Add at least one task so the job has a clear next step.");
  }

  if (bundle.appointmentLabel === "Not scheduled") {
    items.push("Schedule an appointment or site visit to move this job forward.");
  }

  if (items.length === 0) {
    items.push("This job looks healthy. Keep the customer updated and close it once the work is complete.");
  }

  return items;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "bg-emerald-300 text-slate-950"
      : status === "cancelled"
        ? "bg-red-300 text-slate-950"
        : status === "in_progress"
          ? "bg-yellow-300 text-slate-950"
          : "bg-cyan-300 text-slate-950";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "bg-emerald-300"
      : status === "cancelled"
        ? "bg-red-300"
        : status === "in_progress"
          ? "bg-yellow-300"
          : "bg-cyan-300";

  return <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />;
}

function InfoPill({
  icon: Icon,
  label,
}: {
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/65">
      <Icon className="h-3.5 w-3.5 text-cyan-300" />
      {label}
    </span>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-950/70 p-4">
      <Icon className="h-5 w-5 text-cyan-300" />
      <p className="mt-3 text-lg font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-xs text-white/45">{detail}</p>
    </div>
  );
}

function MiniList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; meta: string }>;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">{empty}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/[0.05] p-4">
              <p className="font-black text-white">{item.title}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                {item.meta}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
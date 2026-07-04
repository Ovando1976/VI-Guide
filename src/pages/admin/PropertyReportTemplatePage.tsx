import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardPaste,
  FileText,
  Landmark,
  MapPinned,
  Printer,
  Save,
  Sparkles,
} from "lucide-react";

type ReportState = {
  clientName: string;
  clientEmail: string;
  propertyName: string;
  island: string;
  parcelId: string;
  address: string;
  packageName: string;
  executiveSummary: string;
  historicalIdentity: string;
  mapNotes: string;
  archiveLeads: string;
  ownershipTimeline: string;
  findings: string;
  recommendedNextResearch: string;
  customerNotes: string;
};

const STORAGE_KEY = "viGuidePropertyReportDraft";

const DEFAULT_REPORT: ReportState = {
  clientName: "",
  clientEmail: "",
  propertyName: "",
  island: "",
  parcelId: "",
  address: "",
  packageName: "Full Property History Report",
  executiveSummary:
    "Summarize what is known about this property, its historic name, island context, estate or parcel relationship, and why it matters.",
  historicalIdentity:
    "- Historic estate / place names:\n- Alternate spellings:\n- Quarter / district:\n- Related nearby places:",
  mapNotes:
    "- Modern location:\n- Historic map references:\n- Parcel / boundary notes:\n- Neighboring estates or landmarks:",
  archiveLeads:
    "- Danish West Indies records:\n- Rigsarkivet references:\n- NARA / local archive references:\n- Deeds, tax, probate, church, census, or land list leads:",
  ownershipTimeline:
    "Period | Person / Entity | Evidence | Notes\nUnknown | Unknown | Needs research | Add findings here",
  findings: "1. \n2. \n3. ",
  recommendedNextResearch: "- \n- \n- ",
  customerNotes: "",
};

function loadDraft(): ReportState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_REPORT, ...JSON.parse(saved) } : DEFAULT_REPORT;
  } catch {
    return DEFAULT_REPORT;
  }
}

function section(source: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source.match(new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`, "i"))?.[1]?.trim() ||
    ""
  );
}

function field(source: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}:\\s*(.+)`, "i"))?.[1]?.trim() || "";
}

function clean(value: string) {
  return value.trim() || "Not provided";
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trimEnd()).filter(Boolean);
}

export default function PropertyReportTemplatePage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportState>(() => loadDraft());
  const [outline, setOutline] = useState("");
  const [message, setMessage] = useState("");

  const complete = useMemo(() => {
    const required = [
      report.clientName,
      report.propertyName,
      report.island,
      report.executiveSummary,
      report.findings,
    ];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [report]);

  function setValue<K extends keyof ReportState>(key: K, value: ReportState[K]) {
    setReport((current) => ({ ...current, [key]: value }));
  }

  function applyOutline(source = outline) {
    const property = section(source, "Property");
    const client = section(source, "Client Request");

    setReport((current) => ({
      ...current,
      propertyName: field(property, "Property / estate name") || current.propertyName,
      island: field(property, "Island") || current.island,
      parcelId: field(property, "Parcel ID") || current.parcelId,
      address: field(property, "Address / area") || current.address,
      clientName: field(client, "Client") || current.clientName,
      clientEmail: field(client, "Email") || current.clientEmail,
      packageName: field(client, "Package") || current.packageName,
      executiveSummary: section(source, "Executive Summary") || current.executiveSummary,
      historicalIdentity: section(source, "Historical Identity") || current.historicalIdentity,
      mapNotes: section(source, "Map and Geography Notes") || current.mapNotes,
      archiveLeads: section(source, "Archive Leads") || current.archiveLeads,
      ownershipTimeline: section(source, "Ownership / Use Timeline") || current.ownershipTimeline,
      findings: section(source, "Findings") || current.findings,
      recommendedNextResearch:
        section(source, "Recommended Next Research") || current.recommendedNextResearch,
      customerNotes: section(source, "Customer Notes") || current.customerNotes,
    }));
  }

  async function pasteAndFill() {
    const text = await navigator.clipboard.readText();
    setOutline(text);
    applyOutline(text);
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    setMessage("Draft saved.");
    window.setTimeout(() => setMessage(""), 2200);
  }

  function resetDraft() {
    setReport(DEFAULT_REPORT);
    setOutline("");
    localStorage.removeItem(STORAGE_KEY);
    setMessage("Draft reset.");
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { background: white !important; padding: 0 !important; }
          .paper { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: none !important; }
          .report-section { break-inside: avoid; }
        }
      `}</style>

      <header className="no-print border-b border-white/10 bg-[linear-gradient(135deg,#020617,#080811_55%,#1c1206)] px-5 py-7">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate("/admin/property-report-leads")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/75 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Leads
          </button>

          <h1 className="mt-6 font-serif text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            Property Report Template
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
            Paste the generated outline, polish the report, then print or save as PDF.
          </p>
        </div>
      </header>

      <section className="grid lg:grid-cols-[420px_1fr]">
        <aside className="no-print max-h-screen overflow-auto border-r border-white/10 bg-[#080910] p-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
              <Sparkles className="h-4 w-4" />
              Paste report outline
            </p>

            <textarea
              value={outline}
              onChange={(event) => setOutline(event.target.value)}
              rows={9}
              placeholder="Paste copied outline from lead inbox..."
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void pasteAndFill()}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-zinc-950"
              >
                <ClipboardPaste className="h-4 w-4" />
                Paste + fill
              </button>

              <button
                type="button"
                onClick={() => applyOutline()}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white"
              >
                Apply outline
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <Field label="Client name" value={report.clientName} onChange={(v) => setValue("clientName", v)} />
            <Field label="Client email" value={report.clientEmail} onChange={(v) => setValue("clientEmail", v)} />
            <Field label="Property / estate" value={report.propertyName} onChange={(v) => setValue("propertyName", v)} />
            <Field label="Island" value={report.island} onChange={(v) => setValue("island", v)} />
            <Field label="Parcel ID" value={report.parcelId} onChange={(v) => setValue("parcelId", v)} />
            <Field label="Address / area" value={report.address} onChange={(v) => setValue("address", v)} />
            <Field label="Package" value={report.packageName} onChange={(v) => setValue("packageName", v)} />

            <Box label="Executive summary" value={report.executiveSummary} onChange={(v) => setValue("executiveSummary", v)} />
            <Box label="Historical identity" value={report.historicalIdentity} onChange={(v) => setValue("historicalIdentity", v)} />
            <Box label="Map notes" value={report.mapNotes} onChange={(v) => setValue("mapNotes", v)} />
            <Box label="Archive leads" value={report.archiveLeads} onChange={(v) => setValue("archiveLeads", v)} />
            <Box label="Ownership timeline" value={report.ownershipTimeline} onChange={(v) => setValue("ownershipTimeline", v)} />
            <Box label="Findings" value={report.findings} onChange={(v) => setValue("findings", v)} />
            <Box label="Next research" value={report.recommendedNextResearch} onChange={(v) => setValue("recommendedNextResearch", v)} />
            <Box label="Customer notes" value={report.customerNotes} onChange={(v) => setValue("customerNotes", v)} />
          </div>
        </aside>

        <section className="print-area bg-zinc-200 px-4 py-6 lg:px-10">
          <div className="no-print mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600">
              Draft completeness: {complete}%
            </p>

            <div className="flex flex-wrap gap-2">
              {message ? (
                <span className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white">
                  {message}
                </span>
              ) : null}

              <button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white">
                <Save className="h-4 w-4" />
                Save draft
              </button>

              <button type="button" onClick={resetDraft} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-950">
                Reset
              </button>

              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-zinc-950">
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
            </div>
          </div>

          <article className="paper mx-auto min-h-[11in] max-w-4xl rounded-[2rem] border border-zinc-300 bg-[#fffaf0] p-8 text-zinc-950 shadow-2xl sm:p-12">
            <header className="border-b-4 border-zinc-950 pb-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
                VI Guide Property Intelligence
              </p>
              <h1 className="mt-3 font-serif text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                VI Guide Property History Report
              </h1>
              <p className="mt-4 text-sm leading-7 text-zinc-700">
                Prepared for {clean(report.clientName)} · {new Date().toLocaleDateString()}
              </p>
            </header>

            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <Meta label="Property / estate" value={clean(report.propertyName)} />
              <Meta label="Island" value={clean(report.island)} />
              <Meta label="Parcel ID" value={clean(report.parcelId)} />
              <Meta label="Address / area" value={clean(report.address)} />
              <Meta label="Package" value={clean(report.packageName)} />
              <Meta label="Client email" value={clean(report.clientEmail)} />
            </section>

            <ReportSection icon={<Sparkles className="h-5 w-5" />} title="Executive Summary" body={report.executiveSummary} />
            <ReportSection icon={<Landmark className="h-5 w-5" />} title="Historical Identity" body={report.historicalIdentity} />
            <ReportSection icon={<MapPinned className="h-5 w-5" />} title="Map and Geography Notes" body={report.mapNotes} />
            <ReportSection icon={<FileText className="h-5 w-5" />} title="Archive Leads" body={report.archiveLeads} />
            <ReportSection icon={<FileText className="h-5 w-5" />} title="Ownership / Use Timeline" body={report.ownershipTimeline} />
            <ReportSection icon={<Sparkles className="h-5 w-5" />} title="Findings" body={report.findings} />
            <ReportSection icon={<FileText className="h-5 w-5" />} title="Recommended Next Research" body={report.recommendedNextResearch} />

            {report.customerNotes.trim() ? (
              <ReportSection icon={<FileText className="h-5 w-5" />} title="Customer Notes" body={report.customerNotes} />
            ) : null}

            <footer className="mt-10 border-t-2 border-zinc-950 pt-5 text-xs leading-6 text-zinc-600">
              <p className="font-black uppercase tracking-[0.16em] text-zinc-950">
                Prepared by VI Guide
              </p>
              <p className="mt-2">
                This report is an informational history and research product. It is not a survey, appraisal, title opinion, or legal advice.
              </p>
            </footer>
          </article>
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border-0 bg-transparent text-sm text-white outline-none" />
    </label>
  );
}

function Box({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} className="mt-2 w-full resize-y border-0 bg-transparent text-sm leading-6 text-white outline-none" />
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-300 bg-white/55 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-black leading-6 text-zinc-950">{value}</p>
    </div>
  );
}

function ReportSection({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <section className="report-section mt-8">
      <div className="mb-3 flex items-center gap-2 border-b border-zinc-300 pb-2">
        {icon}
        <h2 className="font-serif text-2xl font-black tracking-[-0.035em]">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-7 text-zinc-800">
        {lines(body).map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}

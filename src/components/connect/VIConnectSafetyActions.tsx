import { useState } from "react";
import { Ban, Flag, ShieldCheck } from "lucide-react";

import {
  blockVIConnectProfile,
  reportVIConnectProfile,
  type VIConnectReportReason,
} from "../../services/connect/viConnectEngagementService";
import type { VIConnectProfile } from "../../types/viConnect";

type VIConnectSafetyActionsProps = {
  profile: VIConnectProfile;
  onBlocked?: () => void;
};

const reportReasons: Array<{ value: VIConnectReportReason; label: string }> = [
  { value: "fake_profile", label: "Fake profile" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment" },
  { value: "underage", label: "Underage concern" },
  { value: "spam", label: "Spam or scam" },
  { value: "other", label: "Other" },
];

export default function VIConnectSafetyActions({
  profile,
  onBlocked,
}: VIConnectSafetyActionsProps) {
  const [reason, setReason] = useState<VIConnectReportReason>("fake_profile");
  const [note, setNote] = useState("");
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);

  function submitReport() {
    reportVIConnectProfile(profile.id, reason, note.trim() || undefined);
    setReported(true);
  }

  function blockProfile() {
    blockVIConnectProfile(profile.id);
    setBlocked(true);
    onBlocked?.();
  }

  return (
    <section className="rounded-[2rem] border border-red-200/15 bg-red-400/10 p-5 shadow-2xl">
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-100">
        <ShieldCheck className="h-4 w-4" />
        Safety controls
      </p>

      <p className="mt-3 text-sm font-semibold leading-7 text-red-50/85">
        Before public launch, every profile needs block, report, hide, and moderation tools.
        This MVP stores reports locally.
      </p>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-red-100/80">
            Report reason
          </span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value as VIConnectReportReason)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-black text-white outline-none"
          >
            {reportReasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-semibold leading-6 text-white outline-none"
          placeholder="Optional note for moderators..."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={submitReport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-300 px-5 py-4 text-sm font-black text-slate-950 active:scale-95"
          >
            <Flag className="h-5 w-5" />
            {reported ? "Reported" : "Report profile"}
          </button>

          <button
            type="button"
            onClick={blockProfile}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/10 active:scale-95"
          >
            <Ban className="h-5 w-5" />
            {blocked ? "Blocked" : "Block profile"}
          </button>
        </div>
      </div>
    </section>
  );
}

import { AlertTriangle, CheckCircle2, MailCheck } from "lucide-react";

import type { NotificationConfigurationStatus } from "@/lib/notifications/notification-configuration";

export function NotificationConfigurationPanel({
  status,
}: {
  status: NotificationConfigurationStatus;
}) {
  return (
    <section className="bg-[#f7f2e7] px-4 pt-5 text-[#043331] sm:px-6">
      <div
        className={`mx-auto max-w-7xl rounded-[26px] border px-5 py-5 shadow-sm ${
          status.ready
            ? "border-emerald-200 bg-emerald-50"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ${
                status.ready ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {status.ready ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </span>
            <div>
              <p
                className={`text-[9px] font-black uppercase tracking-[.14em] ${
                  status.ready ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                Notification readiness
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-.03em]">
                {status.ready
                  ? "Transactional email is configured"
                  : "Transactional email needs configuration"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 opacity-70">
                {status.ready
                  ? `${status.operationsRecipientCount} operations recipient${status.operationsRecipientCount === 1 ? " is" : "s are"} configured, along with Resend, sender identity, Firebase Admin, and cron authentication.`
                  : `Missing: ${status.missing.join(", ") || "unknown configuration"}. Delivery records will remain durable and retryable until these settings are complete.`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReadinessPill
              label="Resend"
              ready={status.emailProviderConfigured}
            />
            <ReadinessPill label="Sender" ready={status.senderConfigured} />
            <ReadinessPill
              label="Recipients"
              ready={status.operationsRecipientsConfigured}
            />
            <ReadinessPill label="Cron" ready={status.cronSecretConfigured} />
            <ReadinessPill
              label="Firebase"
              ready={status.firebaseAdminConfigured}
            />
          </div>
        </div>

        {!status.appUrlConfigured ? (
          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs font-bold leading-5">
              `VI_GUIDE_APP_URL` is not a valid HTTPS origin. Emails will use the
              canonical production address until it is configured.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReadinessPill({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] ${
        ready
          ? "bg-emerald-100 text-emerald-800"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {label}: {ready ? "ready" : "missing"}
    </span>
  );
}

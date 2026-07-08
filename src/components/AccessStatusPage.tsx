import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getCloudAccessSnapshot,
  type CloudAccessSnapshot,
} from "../lib/accounts/cloudAccess";

const emptySnapshot: CloudAccessSnapshot = {
  loading: true,
  uid: "",
  email: "",
  displayName: "",
  localAccount: null,
  localVisitorPass: null,
  cloudVisitorPass: null,
  claims: {},
  admin: false,
  partner: false,
  visitorPaid: false,
  label: "Checking...",
};

export default function AccessStatusPage() {
  const [snapshot, setSnapshot] = useState<CloudAccessSnapshot>(emptySnapshot);

  const refresh = async () => {
    setSnapshot(await getCloudAccessSnapshot());
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
            <ShieldCheck className="h-4 w-4" />
            Access Status
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Verify claims, passes, and page gates.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
            This confirms the production access loop: admin claim, partner claim, and Stripe visitor pass.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatusCard label="Admin claim" active={snapshot.admin} icon={ShieldCheck} />
          <StatusCard label="Partner claim" active={snapshot.partner} icon={UserRound} />
          <StatusCard label="Visitor paid" active={snapshot.visitorPaid} icon={BadgeDollarSign} />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Current user
            </p>

            <div className="mt-4 rounded-[2rem] bg-stone-50 p-5">
              <p className="text-lg font-black">{snapshot.displayName || "No display name"}</p>
              <p className="mt-1 break-all text-sm font-bold text-stone-500">
                {snapshot.email || "No Firebase email"}
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
                {snapshot.uid || "No UID"}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={refresh}
                className="rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                <RefreshCw className="mr-2 inline h-4 w-4" />
                Refresh Access
              </button>

              <button
                type="button"
                onClick={() => window.location.assign("/admin-roles")}
                className="rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white active:scale-95"
              >
                Admin Rules / Roles
              </button>

              <button
                type="button"
                onClick={() => window.location.assign("/visitor-checkout")}
                className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                Visitor Checkout
              </button>
            </div>
          </aside>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Raw access data
            </p>

            <pre className="mt-4 max-h-[520px] overflow-auto rounded-[2rem] bg-stone-950 p-5 text-xs font-bold leading-6 text-green-200">
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </section>
        </section>
      </section>
    </main>
  );
}

function StatusCard({
  label,
  active,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  icon: typeof ShieldCheck;
}) {
  return (
    <article className="rounded-[2.25rem] bg-white p-5 shadow-xl">
      <Icon className={active ? "h-8 w-8 text-emerald-700" : "h-8 w-8 text-stone-300"} />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">
        {active ? "Active" : "Blocked"}
      </p>
      <p className="mt-2 text-sm font-bold text-stone-500">
        {active ? (
          <>
            <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-700" />
            Access should unlock.
          </>
        ) : (
          <>
            <LockKeyhole className="mr-1 inline h-4 w-4 text-stone-400" />
            Access is restricted.
          </>
        )}
      </p>
    </article>
  );
}

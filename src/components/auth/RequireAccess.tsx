import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { AccessLevel } from "../../lib/accounts/userAccount";
import {
  canAccessSnapshot,
  getCloudAccessSnapshot,
  type CloudAccessSnapshot,
} from "../../lib/accounts/cloudAccess";
import { watchFirebaseUser } from "../../lib/firebase/firebaseClient";

type RequireAccessProps = {
  access: AccessLevel;
  children: ReactNode;
};

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
  label: "Checking access...",
};

const accessCopy: Record<
  AccessLevel,
  { title: string; text: string; action: string; path: string }
> = {
  public: {
    title: "Public access",
    text: "This page is public.",
    action: "Continue",
    path: "/",
  },
  visitor_paid: {
    title: "Visitor pass required",
    text: "This area unlocks after a Stripe visitor pass payment or paid visitor claim.",
    action: "Get Visitor Pass",
    path: "/visitor-checkout",
  },
  partner: {
    title: "Partner access required",
    text: "This area is for businesses with a Firebase partner claim.",
    action: "Open Account",
    path: "/account",
  },
  admin: {
    title: "Admin access required",
    text: "This area is for users with a Firebase admin claim.",
    action: "Admin Rules / Roles",
    path: "/admin-roles",
  },
};

export default function RequireAccess({ access, children }: RequireAccessProps) {
  const [snapshot, setSnapshot] = useState<CloudAccessSnapshot>(emptySnapshot);

  const refresh = async () => {
    const next = await getCloudAccessSnapshot();
    setSnapshot(next);
  };

  useEffect(() => {
    let cancelled = false;

    const safeRefresh = async () => {
      const next = await getCloudAccessSnapshot();

      if (!cancelled) {
        setSnapshot(next);
      }
    };

    const unsubscribe = watchFirebaseUser(() => {
      void safeRefresh();
    });

    window.addEventListener("viNavigatorAccountChanged", safeRefresh);
    window.addEventListener("storage", safeRefresh);

    void safeRefresh();

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("viNavigatorAccountChanged", safeRefresh);
      window.removeEventListener("storage", safeRefresh);
    };
  }, []);

  if (canAccessSnapshot(access, snapshot)) {
    return <>{children}</>;
  }

  const copy = accessCopy[access];

  return (
    <main className="min-h-screen bg-[#f8f0da] px-4 py-8 text-ink">
      <section className="mx-auto max-w-3xl rounded-[2.75rem] bg-white p-6 text-center shadow-2xl md:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-950 text-turquoise">
          <LockKeyhole className="h-8 w-8" />
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
          Restricted area
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-5xl">
          {snapshot.loading ? "Checking access..." : copy.title}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-7 text-stone-500">
          {copy.text}
        </p>

        <div className="mt-6 grid gap-3 rounded-[2rem] bg-stone-50 p-4 text-left md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <UserRound className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Firebase user
            </p>
            <p className="mt-1 break-words text-lg font-black">
              {snapshot.email || snapshot.displayName || "Not signed in"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Access claim
            </p>
            <p className="mt-1 text-lg font-black">{snapshot.label}</p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <BadgeDollarSign className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Visitor pass
            </p>
            <p className="mt-1 text-lg font-black">
              {snapshot.cloudVisitorPass?.planName ||
                snapshot.localVisitorPass?.planName ||
                "No active pass"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => window.location.assign(copy.path)}
            className="rounded-2xl bg-[#ffcf32] px-6 py-4 text-sm font-black text-ink active:scale-95"
          >
            {copy.action}
          </button>

          <button
            type="button"
            onClick={() => window.location.assign("/account")}
            className="rounded-2xl bg-stone-100 px-6 py-4 text-sm font-black text-ink active:scale-95"
          >
            Account / Sign In
          </button>

          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-2xl bg-emerald-950 px-6 py-4 text-sm font-black text-white active:scale-95"
          >
            <RefreshCw className="mr-2 inline h-4 w-4" />
            Refresh Access
          </button>
        </div>
      </section>
    </main>
  );
}

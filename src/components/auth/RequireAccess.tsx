import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  canAccess,
  getCurrentAccount,
  getVisitorPass,
  roleLabel,
  type AccessLevel,
  type UserAccount,
  type VisitorPass,
} from "../../lib/accounts/userAccount";

type RequireAccessProps = {
  access: AccessLevel;
  children: ReactNode;
};

const accessCopy: Record<AccessLevel, { title: string; text: string; action: string; path: string }> = {
  public: {
    title: "Public access",
    text: "This page is public.",
    action: "Continue",
    path: "/",
  },
  visitor_paid: {
    title: "Visitor pass required",
    text: "This area is for visitors with an active trip pass.",
    action: "Get Visitor Pass",
    path: "/visitor-checkout",
  },
  partner: {
    title: "Partner access required",
    text: "This area is for hotel, villa, charter, tour, and business partners.",
    action: "Open Account",
    path: "/account",
  },
  admin: {
    title: "Admin access required",
    text: "This area is for the owner/admin command center.",
    action: "Open Account",
    path: "/account",
  },
};

export default function RequireAccess({ access, children }: RequireAccessProps) {
  const [account, setAccount] = useState<UserAccount | null>(() => getCurrentAccount());
  const [pass, setPass] = useState<VisitorPass | null>(() => getVisitorPass());

  useEffect(() => {
    const refresh = () => {
      setAccount(getCurrentAccount());
      setPass(getVisitorPass());
    };

    window.addEventListener("viNavigatorAccountChanged", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("viNavigatorAccountChanged", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (canAccess(access, account)) {
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

        <h1 className="mt-3 text-4xl font-black md:text-5xl">{copy.title}</h1>

        <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-7 text-stone-500">
          {copy.text}
        </p>

        <div className="mt-6 grid gap-3 rounded-[2rem] bg-stone-50 p-4 text-left md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4">
            <UserRound className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Current account
            </p>
            <p className="mt-1 text-lg font-black">
              {account ? `${account.name} · ${roleLabel(account.role)}` : "Signed out"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <BadgeDollarSign className="h-5 w-5 text-emerald-700" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Visitor pass
            </p>
            <p className="mt-1 text-lg font-black">
              {pass ? `${pass.planName}` : "No active pass"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
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
            className="rounded-2xl bg-emerald-950 px-6 py-4 text-sm font-black text-white active:scale-95"
          >
            <ShieldCheck className="mr-2 inline h-4 w-4" />
            Switch Account
          </button>
        </div>
      </section>
    </main>
  );
}

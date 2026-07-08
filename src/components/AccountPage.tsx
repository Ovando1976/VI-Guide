import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Building2,
  CreditCard,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  clearVisitorPass,
  getCurrentAccount,
  getVisitorPass,
  roleLabel,
  signInDemoAccount,
  signOutAccount,
  type AccountRole,
  type UserAccount,
  type VisitorPass,
} from "../lib/accounts/userAccount";

const loginCards: {
  role: AccountRole;
  title: string;
  text: string;
  path: string;
}[] = [
  {
    role: "visitor",
    title: "Visitor",
    text: "Public visitor account without premium trip access.",
    path: "/visitor-desk",
  },
  {
    role: "visitor_paid",
    title: "Paid Visitor",
    text: "Visitor with a trip pass.",
    path: "/visitor-desk",
  },
  {
    role: "partner",
    title: "Partner",
    text: "Hotel, villa, charter, tour, or mobility partner.",
    path: "/partner-desk",
  },
  {
    role: "admin",
    title: "Admin",
    text: "Owner/admin command center access.",
    path: "/admin-desk",
  },
];

export default function AccountPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<UserAccount | null>(() => getCurrentAccount());
  const [pass, setPass] = useState<VisitorPass | null>(() => getVisitorPass());

  const refresh = () => {
    setAccount(getCurrentAccount());
    setPass(getVisitorPass());
  };

  useEffect(() => {
    window.addEventListener("viNavigatorAccountChanged", refresh);
    return () => window.removeEventListener("viNavigatorAccountChanged", refresh);
  }, []);

  const signIn = (role: AccountRole, path: string) => {
    signInDemoAccount(role);
    refresh();
    navigate(path);
  };

  const signOut = () => {
    signOutAccount();
    clearVisitorPass();
    refresh();
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
            <UserRound className="h-4 w-4" />
            Account Access
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Choose who is using the app.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
            This demo account system controls visitor, partner, and admin access.
          </p>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Current session
            </p>

            <div className="mt-4 rounded-[2rem] bg-stone-50 p-5">
              <ShieldCheck className="h-8 w-8 text-emerald-700" />
              <p className="mt-4 text-2xl font-black">
                {account ? account.name : "Signed out"}
              </p>
              <p className="mt-1 text-sm font-bold text-stone-500">
                {account ? `${account.email} · ${roleLabel(account.role)}` : "No account selected"}
              </p>
            </div>

            <div className="mt-4 rounded-[2rem] bg-stone-50 p-5">
              <BadgeDollarSign className="h-8 w-8 text-emerald-700" />
              <p className="mt-4 text-2xl font-black">
                {pass ? pass.planName : "No visitor pass"}
              </p>
              <p className="mt-1 text-sm font-bold text-stone-500">
                {pass ? `Expires ${new Date(pass.expiresAt).toLocaleDateString()}` : "Use checkout to activate premium visitor access."}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => navigate("/visitor-checkout")}
                className="rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                <CreditCard className="mr-2 inline h-4 w-4" />
                Visitor Checkout
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin-roles")}
                className="rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white active:scale-95"
              >
                <ShieldCheck className="mr-2 inline h-4 w-4" />
                Admin Rules / Roles
              </button>

              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                <LogOut className="mr-2 inline h-4 w-4" />
                Sign Out / Clear Demo
              </button>
            </div>
          </aside>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Demo roles
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {loginCards.map((card) => (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => signIn(card.role, card.path)}
                  className="rounded-[2rem] bg-stone-50 p-5 text-left shadow-sm active:scale-95"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                    {card.role === "partner" ? <Building2 className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
                  </div>

                  <h2 className="mt-4 text-2xl font-black">{card.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                    {card.text}
                  </p>

                  <span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Sign in as {card.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

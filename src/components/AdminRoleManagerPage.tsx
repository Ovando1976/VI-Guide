import { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { User } from "firebase/auth";

import {
  getCurrentClaims,
  signInWithGoogle,
  signOutFirebaseUser,
  watchFirebaseUser,
} from "../lib/firebase/firebaseClient";
import {
  assignUserRole,
  type AssignableRole,
} from "../lib/accounts/roleApi";

const roleOptions: { value: AssignableRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Can access admin desk, revenue, billing, outreach, review, and claims.",
  },
  {
    value: "partner",
    label: "Partner",
    description: "Can access partner desk, partner manager, and booking inbox.",
  },
  {
    value: "visitor_paid",
    label: "Paid Visitor",
    description: "Can access premium visitor planning.",
  },
  {
    value: "visitor",
    label: "Visitor",
    description: "Public visitor role.",
  },
];

export default function AdminRoleManagerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("partner");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const refreshClaims = async () => {
    const next = await getCurrentClaims(true);
    setClaims((next || {}) as Record<string, unknown>);
  };

  useEffect(() => {
    return watchFirebaseUser((nextUser) => {
      setUser(nextUser);
      setClaims(null);

      if (nextUser) {
        void refreshClaims();
      }
    });
  }, []);

  const signIn = async () => {
    setError("");
    setMessage("");

    try {
      await signInWithGoogle();
      await refreshClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  };

  const assign = async () => {
    setError("");
    setMessage("");
    setWorking(true);

    try {
      const result = await assignUserRole(email, role);
      setMessage(`Assigned ${result.role} role to ${result.email}. The user should sign out/in or refresh token.`);
      await refreshClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign role.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
            <KeyRound className="h-4 w-4" />
            Admin Role Manager
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Assign real Firebase roles.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
            This sets Firebase custom claims. Firestore rules can trust these claims for admin and partner access.
          </p>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Firebase session
            </p>

            <div className="mt-4 rounded-[2rem] bg-stone-50 p-5">
              <ShieldCheck className="h-8 w-8 text-emerald-700" />
              <p className="mt-4 text-xl font-black">
                {user ? user.displayName || user.email || user.uid : "Not signed in"}
              </p>
              <p className="mt-1 break-all text-sm font-bold text-stone-500">
                {user ? user.email || user.uid : "Sign in with Google first."}
              </p>
            </div>

            <div className="mt-4 rounded-[2rem] bg-stone-50 p-5">
              <LockKeyhole className="h-8 w-8 text-emerald-700" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
                Current claims
              </p>
              <pre className="mt-2 max-h-48 overflow-auto rounded-2xl bg-white p-3 text-xs font-bold text-stone-700">
                {JSON.stringify(claims || {}, null, 2)}
              </pre>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={signIn}
                className="rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                Sign in with Google
              </button>

              <button
                type="button"
                onClick={refreshClaims}
                className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                <RefreshCw className="mr-2 inline h-4 w-4" />
                Refresh Claims
              </button>

              <button
                type="button"
                onClick={signOutFirebaseUser}
                className="rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white active:scale-95"
              >
                Sign Out Firebase
              </button>
            </div>
          </aside>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Assign role
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Give a user access
            </h2>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
                  User email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="partner@example.com"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-bold outline-none focus:border-emerald-700"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={`rounded-[1.5rem] p-4 text-left active:scale-95 ${
                      role === option.value
                        ? "bg-[#ffcf32] text-ink"
                        : "bg-stone-50 text-ink"
                    }`}
                  >
                    <UserCog className="h-6 w-6 text-emerald-700" />
                    <p className="mt-3 text-lg font-black">{option.label}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-stone-600">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={assign}
                disabled={working || !email.trim()}
                className="rounded-2xl bg-emerald-950 px-6 py-4 text-sm font-black text-white active:scale-95 disabled:opacity-60"
              >
                {working ? "Assigning..." : `Assign ${role} role`}
              </button>

              {message ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

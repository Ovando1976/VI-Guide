"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, hasFirebaseClientConfiguration } from "@/lib/firebase";
import { safeInternalDestination } from "@/lib/safe-internal-destination";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [create, setCreate] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authReady = Boolean(auth && hasFirebaseClientConfiguration);

  async function finish(user: import("firebase/auth").User) {
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      throw new Error((await response.json()).error ?? "Unable to start session.");
    }
    router.replace(
      safeInternalDestination(params.get("next"), window.location.origin),
    );
    router.refresh();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!auth) {
      setError("Firebase sign-in is not configured for this deployment.");
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const result = create
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      await finish(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setWorking(false);
    }
  }

  async function google() {
    if (!auth) {
      setError("Firebase sign-in is not configured for this deployment.");
      return;
    }

    setWorking(true);
    setError(null);
    try {
      await finish((await signInWithPopup(auth, new GoogleAuthProvider())).user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setWorking(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f4ea] p-5 text-[#043331]">
      <section className="w-full max-w-md rounded-[32px] border border-white/80 bg-white p-8 shadow-xl">
        <div className="text-[11px] font-black uppercase tracking-[.28em] text-amber-600">
          VI Guide account
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {create ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Securely save trips, bookings, and island plans.
        </p>

        {!authReady ? (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Sign-in is temporarily unavailable because this deployment is missing its Firebase client configuration.
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-7 space-y-4">
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-amber-500"
          />
          <input
            required
            minLength={6}
            type="password"
            autoComplete={create ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-amber-500"
          />
          {error ? (
            <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
          <button
            disabled={working || !authReady}
            className="w-full rounded-2xl bg-[#043331] px-4 py-3.5 text-xs font-black uppercase tracking-[.18em] text-white disabled:opacity-60"
          >
            {working ? "Please wait…" : create ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          disabled={working || !authReady}
          onClick={google}
          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-xs font-black uppercase tracking-[.15em] disabled:opacity-50"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => {
            setCreate(!create);
            setError(null);
          }}
          className="mt-5 w-full text-sm font-bold text-amber-700"
        >
          {create ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}

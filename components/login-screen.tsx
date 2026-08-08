"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  Cloud,
  LockKeyhole,
  MapPinned,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";
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
    <main className="min-h-screen bg-[#f8f4ea] p-4 text-[#043331] sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[36px] border border-[#d8e5e1] bg-[#fffdf8] shadow-[0_32px_100px_rgba(4,51,49,.17)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_.95fr] lg:rounded-[44px]">
        <section className="relative isolate hidden min-h-[720px] overflow-hidden bg-[#043331] p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
          <Image
            src="/images/usvi-harbor-hero.jpg"
            alt="Charlotte Amalie harbor and the hills of St. Thomas"
            fill
            priority
            sizes="52vw"
            className="-z-30 object-cover"
          />
          <span className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,38,37,.94)_0%,rgba(2,38,37,.7)_62%,rgba(2,38,37,.34)_100%)]" />
          <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,38,37,.96)_0%,rgba(2,38,37,.18)_65%,transparent_100%)]" />

          <Link
            href="/"
            className="flex w-fit items-center gap-3 rounded-full border border-white/15 bg-[#032f2d]/55 px-3 py-2 pr-5 backdrop-blur-md transition hover:bg-[#032f2d]/72"
            aria-label="VI Guide home"
          >
            <ViBrandMark className="h-11 w-11" priority />
            <span>
              <span className="block text-lg font-black tracking-[-.035em]">VI Guide</span>
              <span className="mt-0.5 block text-[8px] font-black uppercase tracking-[.19em] text-[#9fe7df]">
                Virgin Islands travel OS
              </span>
            </span>
          </Link>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#032f2d]/55 px-4 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f8d77c] backdrop-blur-md">
              <ShieldCheck size={14} /> One account · one connected trip
            </div>
            <h1 className="vi-display mt-5 text-5xl font-black leading-[.92] tracking-[-.06em] xl:text-7xl">
              Carry your island plans with you.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-white/72">
              Sign in to keep trips, bookings, traveler preferences, proactive alerts,
              and Concierge context connected across the VI Guide experience.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <TrustCard
                icon={Route}
                title="Trips stay connected"
                text="Saved journeys, bookings, and planning context remain available when you return."
              />
              <TrustCard
                icon={Cloud}
                title="Profile can follow you"
                text="Signed-in traveler memory can synchronize across supported devices."
              />
              <TrustCard
                icon={BellRing}
                title="Private trip alerts"
                text="Account-bound booking and proactive protection updates stay in your private inbox."
              />
              <TrustCard
                icon={Sparkles}
                title="Concierge remembers context"
                text="Your chosen profile can ground future recommendations and island-day plans."
              />
            </div>
          </div>
        </section>

        <section className="flex min-h-[680px] flex-col bg-[#fffdf8] p-5 sm:p-8 lg:min-h-[720px] lg:p-10 xl:p-12">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="VI Guide home">
              <ViBrandMark className="h-10 w-10" priority />
              <span className="text-lg font-black tracking-[-.035em]">VI Guide</span>
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d6e3df] bg-white px-4 text-[8px] font-black uppercase tracking-[.14em] text-[#4e6863] transition hover:border-[#a5d0c8]"
            >
              <MapPinned className="h-4 w-4 text-[#0f766e]" /> Back to VI Guide
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-md py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f5f1] px-3 py-2 text-[8px] font-black uppercase tracking-[.17em] text-[#0f766e]">
              <LockKeyhole className="h-4 w-4" /> Secure account entry
            </div>
            <h2 className="vi-display mt-5 text-4xl font-black leading-[.96] tracking-[-.05em] sm:text-5xl">
              {create ? "Create your VI Guide account." : "Welcome back to VI Guide."}
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#677c78]">
              {create
                ? "Create one account for your trips, bookings, traveler profile, alerts, and Concierge context."
                : "Sign in to continue with your connected trips, bookings, profile, alerts, and island plans."}
            </p>

            {!authReady ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <p className="text-sm font-semibold leading-6 text-amber-900">
                    Sign-in is temporarily unavailable because this deployment is missing its Firebase client configuration.
                  </p>
                </div>
              </div>
            ) : null}

            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block">
                <span className="text-[9px] font-black uppercase tracking-[.15em] text-[#78908c]">Email address</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 min-h-13 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-[#a7b4b1] focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                />
              </label>
              <label className="block">
                <span className="text-[9px] font-black uppercase tracking-[.15em] text-[#78908c]">Password</span>
                <input
                  required
                  minLength={6}
                  type="password"
                  autoComplete={create ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={create ? "Create a password" : "Enter your password"}
                  className="mt-2 min-h-13 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-[#a7b4b1] focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={working || !authReady}
                className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] text-white shadow-[0_12px_30px_rgba(4,51,49,.16)] transition hover:bg-[#075e58] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <ShieldCheck className="h-4 w-4 text-[#8ef0e7]" />
                {working ? "Please wait…" : create ? "Create account" : "Sign in securely"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[8px] font-black uppercase tracking-[.16em] text-[#9aaaa7]">
              <span className="h-px flex-1 bg-[#dce6e3]" /> or <span className="h-px flex-1 bg-[#dce6e3]" />
            </div>

            <button
              type="button"
              disabled={working || !authReady}
              onClick={google}
              className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-[#d6e2df] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-[#324f4a] transition hover:border-[#a5d0c8] hover:bg-[#fbfdfc] disabled:opacity-50"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => {
                setCreate(!create);
                setError(null);
              }}
              className="mt-6 w-full rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-black text-[#91610f] transition hover:bg-[#fff0bd]"
            >
              {create ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#dbe7e4] bg-[#f7fbfa] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />
              <p className="text-xs font-semibold leading-5 text-[#687c78]">
                After authentication, VI Guide creates a secure server session and returns you only to a validated internal destination.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Route;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/12 bg-[#032f2d]/56 p-4 backdrop-blur-md">
      <Icon className="h-5 w-5 text-[#8ef0e7]" />
      <div className="mt-3 text-sm font-black text-white">{title}</div>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/56">{text}</p>
    </div>
  );
}

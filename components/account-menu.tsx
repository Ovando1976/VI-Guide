"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  LogOut,
  Map,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";

type Role = "rider" | "driver" | "merchant" | "dispatcher" | "admin";

export function AccountMenu({ embedded = false }: { embedded?: boolean }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("rider");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) {
      setRole("rider");
      return;
    }
    user
      .getIdTokenResult()
      .then((result) => {
        const claim = result.claims.role;
        setRole(
          claim === "admin" ||
            claim === "dispatcher" ||
            claim === "driver" ||
            claim === "merchant"
            ? claim
            : "rider",
        );
      })
      .catch(() => setRole("rider"));
  }, [user]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  if (loading || pathname === "/login") return null;

  async function logout() {
    setWorking(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      if (auth) await signOut(auth);
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={
          embedded
            ? "app-nav__item shrink-0"
            : "fixed right-4 top-4 z-[1900] rounded-full border border-white/20 bg-[#043331] px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white shadow-xl"
        }
      >
        <UserRound size={18} />
        <span>Sign in</span>
      </Link>
    );
  }

  const operationsHref =
    role === "driver"
      ? "/driver"
      : role === "merchant"
        ? "/merchant"
        : role === "admin" || role === "dispatcher"
          ? "/admin/dispatch"
          : null;
  const initial = (user.displayName || user.email || "V")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      ref={root}
      className={
        embedded ? "relative shrink-0" : "fixed right-4 top-4 z-[1900]"
      }
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((value) => !value)}
        className={
          embedded
            ? "grid h-[42px] w-[42px] place-items-center rounded-2xl border border-white/15 bg-white/10 text-xs font-black text-white transition hover:bg-white/15"
            : "grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-[#043331] text-sm font-black text-white shadow-xl"
        }
      >
        {initial}
      </button>
      {open ? (
        <section
          className={
            embedded
              ? "absolute bottom-full right-0 z-[2100] mb-3 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl"
              : "absolute right-0 mt-3 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl"
          }
        >
          <div className="bg-[#043331] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
                <UserRound size={20} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black">
                  {user.displayName || "VI Guide member"}
                </div>
                <div className="truncate text-xs text-teal-100">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-amber-400 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-[#043331]">
              {role}
            </div>
          </div>
          <nav className="space-y-1 p-3">
            <MenuLink
              href="/today"
              label="My AI trip brief"
              icon={Sparkles}
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/profile"
              label="Traveler profile"
              icon={UserRound}
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/map"
              label="Territory map"
              icon={Map}
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/planner"
              label="Saved itinerary"
              icon={Route}
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/trips"
              label="Bookings & ride history"
              icon={CalendarDays}
              onSelect={() => setOpen(false)}
            />
            {operationsHref ? (
              <MenuLink
                href={operationsHref}
                label={
                  role === "driver"
                    ? "Driver workspace"
                    : role === "merchant"
                      ? "Business console"
                      : "Operations dashboard"
                }
                icon={ShieldCheck}
                onSelect={() => setOpen(false)}
              />
            ) : null}
            <button
              type="button"
              disabled={working}
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              <LogOut size={18} />
              {working ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        </section>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon: Icon,
  onSelect,
}: {
  href: string;
  label: string;
  icon: typeof Map;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[#043331] hover:bg-[#f8f4ea]"
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

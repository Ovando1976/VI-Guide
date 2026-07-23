"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export type PaymentStatus =
  | "unpaid"
  | "requires_payment_method"
  | "processing"
  | "paid"
  | "refunded"
  | "failed"
  | "canceled";

export function OpsSection({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(4,51,49,.055)]">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-500">
              {eyebrow}
            </div>
            <h2 className="mt-1.5 text-2xl font-black tracking-[-.035em] text-[#043331]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

export function OpsMetric({
  label,
  value,
  tone = "default",
  footnote,
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
  footnote?: string;
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 border-emerald-100"
      : tone === "warning"
      ? "bg-amber-50 border-amber-100"
      : tone === "danger"
      ? "bg-rose-50 border-rose-100"
      : "bg-slate-50 border-slate-200";

  return (
    <div className={clsx("rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]", toneClasses)}>
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black tracking-[-.035em] text-[#043331]">
        {value}
      </div>
      {footnote ? (
        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {footnote}
        </div>
      ) : null}
    </div>
  );
}

export function OpsPanel({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
          {title}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function OpsPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "teal" | "amber" | "emerald" | "rose";
}) {
  const toneClasses =
    tone === "teal"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em]",
        toneClasses
      )}
    >
      {label}
    </span>
  );
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const tone =
    status === "paid" || status === "refunded"
      ? "emerald"
      : status === "processing"
      ? "amber"
      : status === "failed"
      ? "rose"
      : "neutral";

  return <OpsPill label={status.replaceAll("_", " ")} tone={tone} />;
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.replaceAll("_", " ");
  const tone =
    status === "completed"
      ? "emerald"
      : status === "cancelled"
      ? "rose"
      : status === "in_progress" || status === "driver_en_route"
      ? "teal"
      : "neutral";

  return <OpsPill label={normalized} tone={tone} />;
}

export function OpsKeyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-[#043331]">{value}</div>
    </div>
  );
}

export function OpsCard({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={clsx(
        "rounded-[24px] border p-4 transition",
        active
          ? "border-amber-300 bg-amber-50 shadow-sm"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      )}
    >
      {children}
    </div>
  );

  if (!onClick) return content;

  return (
    <button onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

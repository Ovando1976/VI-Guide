import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  subscribeToPartnerClaims,
  updatePartnerClaimStatus,
} from "../lib/firestore/partnerClaims";
import { subscribeToMerchantLeads } from "../lib/firestore/merchantLeads";
import {
  subscribeToFirestoreMobilityRequests,
  updateFirestoreMobilityRequestStatus,
} from "../lib/firestore/mobilityRequests";
import {
  islandLabels,
  serviceLabels,
  statusLabels,
  type DemoMobilityRequestStatus,
} from "../lib/mobility/demoMobilityStore";
import type {
  MerchantLeadDoc,
  MobilityRequestDoc,
  PartnerClaimDoc,
  PartnerClaimStatus,
} from "../types/businessDemo";

const claimStatuses: PartnerClaimStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "approved",
  "rejected",
];

const mobilityStatuses: DemoMobilityRequestStatus[] = [
  "new",
  "quoted",
  "accepted",
  "driver_en_route",
  "arrived",
  "completed",
  "cancelled",
];

function formatDate(value: number | string | undefined) {
  if (!value) return "Unknown time";

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function AdminLeadsDashboard() {
  const navigate = useNavigate();

  const [claims, setClaims] = useState<PartnerClaimDoc[]>([]);
  const [merchantLeads, setMerchantLeads] = useState<MerchantLeadDoc[]>([]);
  const [mobilityRequests, setMobilityRequests] = useState<MobilityRequestDoc[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    try {
      unsubscribers.push(
        subscribeToPartnerClaims(
          setClaims,
          (error) =>
            setErrors((existing) => ({
              ...existing,
              partnerClaims: errorMessage(error),
            }))
        )
      );
    } catch (error) {
      setErrors((existing) => ({
        ...existing,
        partnerClaims: errorMessage(error),
      }));
    }

    try {
      unsubscribers.push(
        subscribeToMerchantLeads(
          setMerchantLeads,
          (error) =>
            setErrors((existing) => ({
              ...existing,
              merchantLeads: errorMessage(error),
            }))
        )
      );
    } catch (error) {
      setErrors((existing) => ({
        ...existing,
        merchantLeads: errorMessage(error),
      }));
    }

    try {
      unsubscribers.push(
        subscribeToFirestoreMobilityRequests(
          setMobilityRequests,
          (error) =>
            setErrors((existing) => ({
              ...existing,
              mobilityRequests: errorMessage(error),
            }))
        )
      );
    } catch (error) {
      setErrors((existing) => ({
        ...existing,
        mobilityRequests: errorMessage(error),
      }));
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const stats = useMemo(() => {
    const newClaims = claims.filter((claim) => claim.status === "new").length;
    const newMobility = mobilityRequests.filter(
      (request) => request.status === "new"
    ).length;

    return {
      claims: claims.length,
      newClaims,
      merchantLeads: merchantLeads.length,
      mobilityRequests: mobilityRequests.length,
      newMobility,
    };
  }, [claims, merchantLeads, mobilityRequests]);

  async function moveClaim(claim: PartnerClaimDoc, status: PartnerClaimStatus) {
    try {
      await updatePartnerClaimStatus(claim.id, status);
    } catch (error) {
      setErrors((existing) => ({
        ...existing,
        updateClaim: errorMessage(error),
      }));
    }
  }

  async function moveMobilityRequest(
    request: MobilityRequestDoc,
    status: DemoMobilityRequestStatus
  ) {
    try {
      await updateFirestoreMobilityRequestStatus(
        request.id,
        status,
        request.status
      );
    } catch (error) {
      setErrors((existing) => ({
        ...existing,
        updateMobility: errorMessage(error),
      }));
    }
  }

  return (
    <div className="min-h-screen pb-32 pt-8 md:pt-10">
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <ClipboardList className="h-4 w-4" />
                Admin Lead Inbox
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Real partner and mobility leads.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                This page reads from Firestore and gives you a simple operating
                inbox for business claims, merchant lead activity, and mobility
                transportation requests.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/demo")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Demo Hub
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate("/mobility/dispatch")}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Dispatch
                <Car className="h-4 w-4" />
              </button>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="mt-6 rounded-[2rem] bg-amber-100 p-4 text-amber-950">
              <p className="font-black">Firestore notice</p>
              <div className="mt-2 space-y-1 text-sm font-bold leading-6">
                {Object.entries(errors).map(([key, message]) => (
                  <p key={key}>
                    {key}: {message}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-xs font-bold text-amber-900/70">
                If this says permission denied, sign in or deploy the updated
                Firestore rules.
              </p>
            </div>
          )}

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "Claims", value: stats.claims, icon: Building2 },
              { label: "New Claims", value: stats.newClaims, icon: BadgeCheck },
              { label: "Merchant Leads", value: stats.merchantLeads, icon: BarChart3 },
              { label: "Mobility", value: stats.mobilityRequests, icon: Car },
              { label: "New Rides", value: stats.newMobility, icon: RefreshCw },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-[2rem] bg-white p-4 text-ink"
                >
                  <Icon className="h-6 w-6 text-emerald-700" />
                  <p className="mt-4 text-4xl font-black">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-7 grid gap-6">
            <section className="rounded-[2.25rem] bg-white p-5 text-ink shadow-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                    Partner claims
                  </p>
                  <h2 className="mt-1 text-3xl font-black">Business owners</h2>
                </div>

                <button
                  onClick={() => navigate("/partners")}
                  className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                >
                  Open Partner Portal
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {claims.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="No partner claims yet"
                    text="Submit a Claim Business form from the Partner Portal."
                  />
                ) : (
                  claims.map((claim) => (
                    <article key={claim.id} className="rounded-[2rem] bg-stone-50 p-4">
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge label={claim.status} />
                            {claim.partnerTier && <Badge label={claim.partnerTier} muted />}
                            {claim.area && <Badge label={claim.area} muted />}
                          </div>

                          <h3 className="mt-3 text-2xl font-black">
                            {claim.businessName || claim.partnerName}
                          </h3>

                          <div className="mt-3 grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-3">
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4 text-emerald-700" />
                              {claim.ownerName || "Unknown owner"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-emerald-700" />
                              {claim.email || "No email"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-emerald-700" />
                              {claim.phone || "No phone"}
                            </p>
                          </div>

                          {claim.message && (
                            <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-stone-600">
                              {claim.message}
                            </p>
                          )}

                          <p className="mt-3 text-xs font-bold text-stone-400">
                            Created {formatDate(claim.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col">
                          {claimStatuses.map((status) => (
                            <button
                              key={status}
                              onClick={() => moveClaim(claim, status)}
                              className={[
                                "rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] active:scale-95",
                                claim.status === status
                                  ? "bg-emerald-700 text-white"
                                  : "bg-white text-stone-600 ring-1 ring-stone-200",
                              ].join(" ")}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 text-ink shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                Merchant leads
              </p>
              <h2 className="mt-1 text-3xl font-black">Visitor activity</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {merchantLeads.length === 0 ? (
                  <EmptyState
                    icon={BarChart3}
                    title="No merchant leads yet"
                    text="Tap Call, Directions, Demo Lead, or Claim on partner cards."
                  />
                ) : (
                  merchantLeads.slice(0, 12).map((lead) => (
                    <article key={lead.id} className="rounded-[2rem] bg-stone-50 p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge label={lead.action} />
                        <Badge label={lead.source} muted />
                      </div>

                      <h3 className="mt-3 text-xl font-black">{lead.partnerName}</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {lead.message}
                      </p>
                      <p className="mt-3 text-xs font-bold text-stone-400">
                        Created {formatDate(lead.createdAt)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 text-ink shadow-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                    Mobility requests
                  </p>
                  <h2 className="mt-1 text-3xl font-black">Transportation leads</h2>
                </div>

                <button
                  onClick={() => navigate("/mobility")}
                  className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                >
                  Create Request
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {mobilityRequests.length === 0 ? (
                  <EmptyState
                    icon={Car}
                    title="No mobility requests yet"
                    text="Submit a transportation request from the Mobility page."
                  />
                ) : (
                  mobilityRequests.map((request) => (
                    <article key={request.id} className="rounded-[2rem] bg-stone-50 p-4">
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge label={statusLabels[request.status]} />
                            <Badge label={serviceLabels[request.serviceType]} muted />
                            <Badge label={islandLabels[request.island]} muted />
                          </div>

                          <h3 className="mt-3 text-2xl font-black">
                            {request.pickup} → {request.dropoff}
                          </h3>

                          <div className="mt-3 grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-3">
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4 text-emerald-700" />
                              {request.visitorName}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-emerald-700" />
                              {request.visitorPhone}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-emerald-700" />
                              ${request.estimatedFare}
                            </p>
                          </div>

                          {request.notes && (
                            <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-stone-600">
                              {request.notes}
                            </p>
                          )}

                          <p className="mt-3 text-xs font-bold text-stone-400">
                            Created {formatDate(request.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col">
                          {mobilityStatuses.map((status) => (
                            <button
                              key={status}
                              onClick={() => moveMobilityRequest(request, status)}
                              className={[
                                "rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] active:scale-95",
                                request.status === status
                                  ? "bg-emerald-700 text-white"
                                  : "bg-white text-stone-600 ring-1 ring-stone-200",
                              ].join(" ")}
                            >
                              {statusLabels[status]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
        muted
          ? "bg-stone-100 text-stone-600"
          : "bg-emerald-100 text-emerald-800",
      ].join(" ")}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] bg-stone-50 p-6 text-center md:col-span-2">
      <Icon className="mx-auto h-8 w-8 text-emerald-700" />
      <p className="mt-3 text-lg font-black">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{text}</p>
    </div>
  );
}

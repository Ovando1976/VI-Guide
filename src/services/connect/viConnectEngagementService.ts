import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseAuth, firestore } from "../../lib/firebaseClient";
import { ensureVIConnectAuth } from "./viConnectAuthService";

export type VIConnectReportReason =
  | "fake_profile"
  | "inappropriate"
  | "harassment"
  | "underage"
  | "spam"
  | "other";

export type VIConnectReport = {
  profileId: string;
  reason: VIConnectReportReason;
  note?: string;
  createdAt: string;
};

export type VIConnectEngagementState = {
  likedProfileIds: string[];
  passedProfileIds: string[];
  blockedProfileIds: string[];
  reportedProfiles: VIConnectReport[];
  matchProfileIds: string[];
  updatedAt: string;
};

const STORAGE_KEY = "vi-connect-engagement-v1";

const emptyState: VIConnectEngagementState = {
  likedProfileIds: [],
  passedProfileIds: [],
  blockedProfileIds: [],
  reportedProfiles: [],
  matchProfileIds: [],
  updatedAt: new Date(0).toISOString(),
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function currentUid() {
  return firebaseAuth?.currentUser?.uid || "";
}

async function syncStateToCloud(state: VIConnectEngagementState) {
  const user = await ensureVIConnectAuth();
  const uid = user?.uid || currentUid();
  if (!firestore || !uid) return;

  void setDoc(
    doc(firestore, "connectEngagement", uid),
    {
      ...state,
      uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch((error) => {
    console.warn("Could not sync VI Connect engagement state.", error);
  });
}

async function writeCloudLike(profileId: string) {
  const user = await ensureVIConnectAuth();
  const uid = user?.uid || currentUid();
  if (!firestore || !uid) return;

  void setDoc(
    doc(firestore, "connectLikes", `${uid}_${profileId}`),
    {
      fromUid: uid,
      toProfileId: profileId,
      status: "liked",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch((error) => {
    console.warn("Could not write VI Connect like.", error);
  });
}

async function writeCloudPass(profileId: string) {
  const user = await ensureVIConnectAuth();
  const uid = user?.uid || currentUid();
  if (!firestore || !uid) return;

  void setDoc(
    doc(firestore, "connectPasses", `${uid}_${profileId}`),
    {
      fromUid: uid,
      toProfileId: profileId,
      status: "passed",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch((error) => {
    console.warn("Could not write VI Connect pass.", error);
  });
}

async function writeCloudBlock(profileId: string) {
  const user = await ensureVIConnectAuth();
  const uid = user?.uid || currentUid();
  if (!firestore || !uid) return;

  void setDoc(
    doc(firestore, "connectBlocks", `${uid}_${profileId}`),
    {
      fromUid: uid,
      toProfileId: profileId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch((error) => {
    console.warn("Could not write VI Connect block.", error);
  });
}

async function writeCloudReport(
  profileId: string,
  reason: VIConnectReportReason,
  note?: string
) {
  const user = await ensureVIConnectAuth();
  const uid = user?.uid || currentUid();
  if (!firestore || !uid) return;

  const reportId = `${uid}_${profileId}_${Date.now()}`;

  void setDoc(
    doc(firestore, "connectReports", reportId),
    {
      reportId,
      fromUid: uid,
      profileId,
      reason,
      note: note || "",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch((error) => {
    console.warn("Could not write VI Connect report.", error);
  });
}

export function getVIConnectEngagementState(): VIConnectEngagementState {
  if (typeof window === "undefined") return emptyState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;

    const parsed = JSON.parse(raw) as Partial<VIConnectEngagementState>;

    return {
      likedProfileIds: unique(parsed.likedProfileIds || []),
      passedProfileIds: unique(parsed.passedProfileIds || []),
      blockedProfileIds: unique(parsed.blockedProfileIds || []),
      reportedProfiles: parsed.reportedProfiles || [],
      matchProfileIds: unique(parsed.matchProfileIds || []),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return emptyState;
  }
}

export function saveVIConnectEngagementState(
  state: VIConnectEngagementState
): VIConnectEngagementState {
  const next: VIConnectEngagementState = {
    ...state,
    likedProfileIds: unique(state.likedProfileIds),
    passedProfileIds: unique(state.passedProfileIds),
    blockedProfileIds: unique(state.blockedProfileIds),
    matchProfileIds: unique(state.matchProfileIds),
    reportedProfiles: state.reportedProfiles,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("vi-connect-engagement-changed"));
  }

  syncStateToCloud(next);

  return next;
}

export function likeVIConnectProfile(profileId: string) {
  const current = getVIConnectEngagementState();

  const next = saveVIConnectEngagementState({
    ...current,
    likedProfileIds: unique([...current.likedProfileIds, profileId]),
    passedProfileIds: current.passedProfileIds.filter((id) => id !== profileId),
  });

  writeCloudLike(profileId);

  return next;
}

export function passVIConnectProfile(profileId: string) {
  const current = getVIConnectEngagementState();

  const next = saveVIConnectEngagementState({
    ...current,
    passedProfileIds: unique([...current.passedProfileIds, profileId]),
  });

  writeCloudPass(profileId);

  return next;
}

export function blockVIConnectProfile(profileId: string) {
  const current = getVIConnectEngagementState();

  const next = saveVIConnectEngagementState({
    ...current,
    blockedProfileIds: unique([...current.blockedProfileIds, profileId]),
    likedProfileIds: current.likedProfileIds.filter((id) => id !== profileId),
    passedProfileIds: current.passedProfileIds.filter((id) => id !== profileId),
    matchProfileIds: current.matchProfileIds.filter((id) => id !== profileId),
  });

  writeCloudBlock(profileId);

  return next;
}

export function reportVIConnectProfile(
  profileId: string,
  reason: VIConnectReportReason,
  note?: string
) {
  const current = getVIConnectEngagementState();

  const report: VIConnectReport = {
    profileId,
    reason,
    note,
    createdAt: new Date().toISOString(),
  };

  const next = saveVIConnectEngagementState({
    ...current,
    reportedProfiles: [...current.reportedProfiles, report],
  });

  writeCloudReport(profileId, reason, note);

  return next;
}

export function isVIConnectProfileBlocked(profileId: string) {
  return getVIConnectEngagementState().blockedProfileIds.includes(profileId);
}

export function clearVIConnectEngagementState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("vi-connect-engagement-changed"));
}

import { getAdminDb } from "@/lib/firebase-admin";
import type { VerifiedSocialIdentity } from "@/lib/social/server-auth";
import {
  cleanOptionalSocialText,
  cleanSocialText,
  normalizeHandle,
  normalizeSearch,
  searchPrefixes,
  socialHash,
  socialNow,
  uniqueStrings,
} from "@/lib/social/utils";
import type {
  PublicSocialProfile,
  SocialAccountType,
  SocialIsland,
  SocialPrivacyMode,
  SocialProfile,
} from "@/types/social";

const PROFILES = "socialProfiles";
const HANDLES = "socialHandles";

function defaultHandle(identity: VerifiedSocialIdentity) {
  const emailName = identity.email?.split("@")[0] ?? "";
  const candidate = normalizeHandle(identity.displayName || emailName || "islander");
  const base = candidate.length >= 3 ? candidate : "islander";
  return `${base.slice(0, 20)}_${socialHash(identity.uid).slice(0, 6)}`;
}

function profileFromData(data: FirebaseFirestore.DocumentData): SocialProfile {
  return data as SocialProfile;
}

export function publicSocialProfile(profile: SocialProfile): PublicSocialProfile {
  const { searchPrefixes: _searchPrefixes, ...publicProfile } = profile;
  return Object.freeze(publicProfile);
}

export async function getSocialProfile(userId: string) {
  const snapshot = await getAdminDb().collection(PROFILES).doc(userId).get();
  return snapshot.exists ? profileFromData(snapshot.data() ?? {}) : null;
}

export async function getSocialProfileByHandle(handle: string) {
  const normalized = normalizeHandle(handle);
  if (!normalized) return null;
  const handleSnapshot = await getAdminDb().collection(HANDLES).doc(normalized).get();
  const userId = handleSnapshot.data()?.userId;
  return typeof userId === "string" ? getSocialProfile(userId) : null;
}

export async function ensureSocialProfile(identity: VerifiedSocialIdentity) {
  const db = getAdminDb();
  const profileRef = db.collection(PROFILES).doc(identity.uid);
  const existing = await profileRef.get();
  if (existing.exists) return profileFromData(existing.data() ?? {});

  const handle = defaultHandle(identity);
  const handleRef = db.collection(HANDLES).doc(handle);
  const now = socialNow();
  const displayName = cleanSocialText(
    identity.displayName || identity.email?.split("@")[0] || "Island member",
    80,
  );

  const profile: SocialProfile = Object.freeze({
    version: 1,
    userId: identity.uid,
    handle,
    handleLower: handle,
    displayName,
    avatarUrl: identity.avatarUrl,
    coverImageUrl: null,
    bio: "",
    primaryIsland: "visitor",
    neighborhood: null,
    hometown: null,
    interests: Object.freeze([]),
    profession: null,
    website: null,
    accountType: "personal",
    privacyMode: "public",
    state: "active",
    verification: Object.freeze([]),
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    searchPrefixes: Object.freeze(searchPrefixes(handle, displayName)),
    createdAt: now,
    updatedAt: now,
  });

  await db.runTransaction(async (transaction) => {
    const [profileSnap, handleSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(handleRef),
    ]);
    if (profileSnap.exists) return;
    if (handleSnap.exists && handleSnap.data()?.userId !== identity.uid) {
      throw new Error("Unable to allocate a unique social handle.");
    }
    transaction.set(handleRef, { userId: identity.uid, createdAt: now });
    transaction.set(profileRef, profile);
  });

  return (await getSocialProfile(identity.uid)) ?? profile;
}

export type SocialProfileUpdate = Readonly<{
  handle?: unknown;
  displayName?: unknown;
  avatarUrl?: unknown;
  coverImageUrl?: unknown;
  bio?: unknown;
  primaryIsland?: unknown;
  neighborhood?: unknown;
  hometown?: unknown;
  interests?: unknown;
  profession?: unknown;
  website?: unknown;
  accountType?: unknown;
  privacyMode?: unknown;
}>;

const ISLANDS = new Set<SocialIsland>([
  "stt",
  "stj",
  "stx",
  "water_island",
  "diaspora",
  "visitor",
]);
const ACCOUNT_TYPES = new Set<SocialAccountType>([
  "personal",
  "creator",
  "business",
  "organization",
  "government",
]);
const PRIVACY = new Set<SocialPrivacyMode>(["public", "private"]);

export async function updateSocialProfile(userId: string, input: SocialProfileUpdate) {
  const db = getAdminDb();
  const profileRef = db.collection(PROFILES).doc(userId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (!snapshot.exists) throw new Error("Social profile was not found.");
    const current = profileFromData(snapshot.data() ?? {});

    const requestedHandle = input.handle === undefined ? current.handle : normalizeHandle(input.handle);
    if (requestedHandle.length < 3) throw new Error("Handle must contain at least 3 characters.");

    const nextHandleRef = db.collection(HANDLES).doc(requestedHandle);
    const oldHandleRef = db.collection(HANDLES).doc(current.handleLower);
    const nextHandleSnapshot =
      requestedHandle === current.handleLower
        ? null
        : await transaction.get(nextHandleRef);
    if (nextHandleSnapshot?.exists && nextHandleSnapshot.data()?.userId !== userId) {
      throw new Error("That handle is already in use.");
    }

    const displayName =
      input.displayName === undefined
        ? current.displayName
        : cleanSocialText(input.displayName, 80);
    if (!displayName) throw new Error("Display name is required.");

    const island = ISLANDS.has(input.primaryIsland as SocialIsland)
      ? (input.primaryIsland as SocialIsland)
      : current.primaryIsland;
    const accountType = ACCOUNT_TYPES.has(input.accountType as SocialAccountType)
      ? (input.accountType as SocialAccountType)
      : current.accountType;
    const privacyMode = PRIVACY.has(input.privacyMode as SocialPrivacyMode)
      ? (input.privacyMode as SocialPrivacyMode)
      : current.privacyMode;

    const next: SocialProfile = Object.freeze({
      ...current,
      handle: requestedHandle,
      handleLower: requestedHandle,
      displayName,
      avatarUrl:
        input.avatarUrl === undefined
          ? current.avatarUrl
          : cleanOptionalSocialText(input.avatarUrl, 500),
      coverImageUrl:
        input.coverImageUrl === undefined
          ? current.coverImageUrl
          : cleanOptionalSocialText(input.coverImageUrl, 500),
      bio: input.bio === undefined ? current.bio : cleanSocialText(input.bio, 500),
      primaryIsland: island,
      neighborhood:
        input.neighborhood === undefined
          ? current.neighborhood
          : cleanOptionalSocialText(input.neighborhood, 80),
      hometown:
        input.hometown === undefined
          ? current.hometown
          : cleanOptionalSocialText(input.hometown, 100),
      interests:
        input.interests === undefined
          ? current.interests
          : Object.freeze(uniqueStrings(input.interests, 20, 40)),
      profession:
        input.profession === undefined
          ? current.profession
          : cleanOptionalSocialText(input.profession, 100),
      website:
        input.website === undefined
          ? current.website
          : cleanOptionalSocialText(input.website, 300),
      accountType,
      privacyMode,
      searchPrefixes: Object.freeze(searchPrefixes(requestedHandle, displayName, island)),
      updatedAt: socialNow(),
    });

    if (requestedHandle !== current.handleLower) {
      transaction.set(nextHandleRef, { userId, createdAt: next.updatedAt });
      transaction.delete(oldHandleRef);
    }
    transaction.set(profileRef, next);
  });

  const updated = await getSocialProfile(userId);
  if (!updated) throw new Error("Social profile update failed.");
  return updated;
}

export async function searchSocialProfiles(query: string, limit = 24) {
  const db = getAdminDb();
  const normalized = normalizeSearch(query);
  let snapshot: FirebaseFirestore.QuerySnapshot;

  if (normalized) {
    snapshot = await db
      .collection(PROFILES)
      .where("searchPrefixes", "array-contains", normalized.slice(0, 24))
      .limit(Math.max(1, Math.min(limit, 50)))
      .get();
  } else {
    snapshot = await db
      .collection(PROFILES)
      .orderBy("updatedAt", "desc")
      .limit(Math.max(1, Math.min(limit, 50)))
      .get();
  }

  return snapshot.docs
    .map((doc) => profileFromData(doc.data()))
    .filter((profile) => profile.state === "active")
    .map(publicSocialProfile);
}

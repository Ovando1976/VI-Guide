import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

import { firebaseAuth, firebaseStorage, firestore } from "../lib/firebaseClient";
import { ensureVIConnectAuth } from "./connect/viConnectAuthService";
import type { VIConnectUserProfile } from "../types/viConnect";

const VI_CONNECT_PROFILE_STORAGE_KEY = "vi-connect-user-profile-v1";

export function createVIConnectProfileId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `vi-connect-${crypto.randomUUID()}`;
  }

  return `vi-connect-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cacheProfile(profile: VIConnectUserProfile) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    VI_CONNECT_PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );

  window.dispatchEvent(new CustomEvent("vi-connect-profile-changed"));
}

function isDataUrl(value?: string) {
  return Boolean(value?.startsWith("data:image/"));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getCloudProfileId(profile?: VIConnectUserProfile | null) {
  return firebaseAuth?.currentUser?.uid || profile?.id || createVIConnectProfileId();
}

async function uploadPhotoIfNeeded(
  userId: string,
  photoUrl: string,
  index: number
) {
  if (!isDataUrl(photoUrl) || !firebaseStorage) return photoUrl;

  try {
    const storageRef = ref(
      firebaseStorage,
      `connectProfiles/${userId}/photos/photo-${Date.now()}-${index}.jpg`
    );

    await uploadString(storageRef, photoUrl, "data_url", {
      contentType: "image/jpeg",
    });

    return await getDownloadURL(storageRef);
  } catch (error) {
    console.warn("VI Connect photo upload failed. Keeping local photo.", error);
    return photoUrl;
  }
}

async function prepareProfilePhotosForCloud(profile: VIConnectUserProfile) {
  const userId = getCloudProfileId(profile);

  const rawPhotos = unique([
    profile.primaryPhotoUrl || "",
    profile.imageUrl || "",
    ...(profile.photoUrls || []),
  ]);

  const photoUrls = await Promise.all(
    rawPhotos.map((photoUrl, index) => uploadPhotoIfNeeded(userId, photoUrl, index))
  );

  const primaryPhotoUrl = profile.primaryPhotoUrl
    ? photoUrls[rawPhotos.indexOf(profile.primaryPhotoUrl)] || photoUrls[0] || ""
    : photoUrls[0] || "";

  return {
    ...profile,
    id: userId,
    imageUrl: primaryPhotoUrl || profile.imageUrl,
    primaryPhotoUrl: primaryPhotoUrl || profile.primaryPhotoUrl,
    photoUrls,
  };
}

function normalizeProfileFromCloud(
  value: Partial<VIConnectUserProfile> | null
): VIConnectUserProfile | null {
  if (!value?.id || !value.displayName) return null;

  const now = new Date().toISOString();

  return {
    id: value.id,
    displayName: value.displayName,
    age: Number(value.age || 18),
    island: value.island || "st_thomas",
    status: value.status || "local",
    headline: value.headline || "",
    bio: value.bio || "",
    favoriteSpot: value.favoriteSpot || "",
    intent: value.intent || ["dating"],
    interests: value.interests || [],
    lookingFor: value.lookingFor || [],
    imageUrl: value.imageUrl,
    primaryPhotoUrl: value.primaryPhotoUrl,
    photoUrls: value.photoUrls || [],
    isVisible: value.isVisible ?? true,
    verificationStatus: value.verificationStatus || "pending",
    verified: value.verified ?? false,
    visibility: (value.visibility || "visible") as VIConnectUserProfile["visibility"],
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

export function getVIConnectUserProfile(): VIConnectUserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(VI_CONNECT_PROFILE_STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as VIConnectUserProfile;
  } catch {
    return null;
  }
}

export async function getVIConnectUserProfileFromCloud() {
  const user = await ensureVIConnectAuth();
  const uid = user?.uid || "";

  if (!firestore || !uid) {
    return getVIConnectUserProfile();
  }

  try {
    const snapshot = await getDoc(doc(firestore, "connectProfiles", uid));

    if (!snapshot.exists()) {
      return getVIConnectUserProfile();
    }

    const profile = normalizeProfileFromCloud({
      ...(snapshot.data() as Partial<VIConnectUserProfile>),
      id: uid,
    });

    if (profile) cacheProfile(profile);

    return profile;
  } catch (error) {
    console.warn("Could not load VI Connect profile from Firebase.", error);
    return getVIConnectUserProfile();
  }
}

export async function saveVIConnectUserProfile(
  profile: VIConnectUserProfile
): Promise<VIConnectUserProfile> {
  const now = new Date().toISOString();

  const localProfile: VIConnectUserProfile = {
    ...profile,
    id: profile.id || getCloudProfileId(profile),
    updatedAt: now,
    createdAt: profile.createdAt || now,
  };

  cacheProfile(localProfile);

  const user = await ensureVIConnectAuth();
  const uid = user?.uid || "";

  if (!firestore || !uid) {
    return localProfile;
  }

  try {
    const cloudProfile = await prepareProfilePhotosForCloud({
      ...localProfile,
      id: uid,
    });

    await setDoc(
      doc(firestore, "connectProfiles", uid),
      {
        ...cloudProfile,
        uid,
        updatedAt: serverTimestamp(),
        createdAt: cloudProfile.createdAt || serverTimestamp(),
      },
      { merge: true }
    );

    cacheProfile(cloudProfile);

    return cloudProfile;
  } catch (error) {
    console.warn("Could not save VI Connect profile to Firebase.", error);
    return localProfile;
  }
}

export function clearVIConnectUserProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VI_CONNECT_PROFILE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("vi-connect-profile-changed"));
}

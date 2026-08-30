import { getAdminDb } from "@/lib/firebase-admin";
import { socialHash, socialNow } from "@/lib/social/utils";

export async function enforceSocialRateLimit(
  userId: string,
  action: string,
  options: Readonly<{ max: number; windowSeconds: number }>,
) {
  const nowMs = Date.now();
  const windowMs = Math.max(1, options.windowSeconds) * 1000;
  const windowStart = Math.floor(nowMs / windowMs) * windowMs;
  const id = `rate_${socialHash(userId, action, String(windowStart)).slice(0, 36)}`;
  const ref = getAdminDb().collection("socialRateLimits").doc(id);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Number(snapshot.data()?.count ?? 0) : 0;
    if (count >= options.max) throw new Error("Too many requests. Try again shortly.");
    transaction.set(ref, {
      userId,
      action,
      count: count + 1,
      windowStart: new Date(windowStart).toISOString(),
      expiresAt: new Date(windowStart + windowMs * 2).toISOString(),
      updatedAt: socialNow(),
    });
  });
}

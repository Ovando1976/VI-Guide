import type { IntelligenceContext } from "@/types/intelligence";

export type IntelligenceAuthBinding = {
  userId: string;
  getToken: () => Promise<string>;
};

let activeBinding: IntelligenceAuthBinding | null = null;

export function setIntelligenceAuthBinding(
  binding: IntelligenceAuthBinding | null,
) {
  activeBinding = binding;
}

export function getIntelligenceAuthBinding() {
  return activeBinding;
}

export function bearerTokenFromAuthorization(value: string | null) {
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice(7).trim();
  return token || null;
}

export function bindVerifiedIntelligenceIdentity(
  context: IntelligenceContext,
  verifiedUserId?: string,
): IntelligenceContext {
  const { userId: _untrustedUserId, ...safeContext } = context;
  return verifiedUserId
    ? { ...safeContext, userId: verifiedUserId.slice(0, 160) }
    : safeContext;
}

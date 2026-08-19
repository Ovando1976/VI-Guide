export type CruiseReturnBufferEvidence = {
  returnBufferMet: boolean;
  verifiedReturnBufferMinutes: number;
  requiredReturnBufferMinutes: number;
  allAboardTime: string;
  safeReturnDeadline: string;
  shipName: string;
  portId: string;
};

export function cruiseReturnBufferEvidence(
  booking: Record<string, unknown>,
): CruiseReturnBufferEvidence | null {
  const shore =
    booking.shoreExcursion && typeof booking.shoreExcursion === "object"
      ? (booking.shoreExcursion as Record<string, unknown>)
      : null;
  if (!shore) return null;

  const verifiedReturnBufferMinutes = Number(
    shore.verifiedReturnBufferMinutes ?? 0,
  );
  const requiredReturnBufferMinutes = Number(
    shore.minReturnBufferMinutes ?? 0,
  );
  const timingVerified = String(shore.timingStatus ?? "") === "buffer_verified";
  const returnBufferMet = Boolean(
    timingVerified &&
      Number.isFinite(verifiedReturnBufferMinutes) &&
      Number.isFinite(requiredReturnBufferMinutes) &&
      requiredReturnBufferMinutes > 0 &&
      verifiedReturnBufferMinutes >= requiredReturnBufferMinutes,
  );

  return {
    returnBufferMet,
    verifiedReturnBufferMinutes: Number.isFinite(verifiedReturnBufferMinutes)
      ? verifiedReturnBufferMinutes
      : 0,
    requiredReturnBufferMinutes: Number.isFinite(requiredReturnBufferMinutes)
      ? requiredReturnBufferMinutes
      : 0,
    allAboardTime: clean(shore.allAboardTime, 40),
    safeReturnDeadline: clean(shore.safeReturnDeadline, 40),
    shipName: clean(shore.shipName, 160),
    portId: clean(shore.portId, 80),
  };
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

import {
  listOfficialCruisePortCalls,
  type OfficialCruisePortCall,
  type OfficialCruisePortId,
} from "@/lib/cruise-port-calls";

export function resolveOfficialPortCallContext(input: {
  callId?: string;
  date?: string;
  portId?: string;
  shipName?: string;
}): OfficialCruisePortCall | null {
  const callId = input.callId?.trim();
  if (callId) {
    const byId = listOfficialCruisePortCalls({ includeCancelled: true }).find(
      (call) => call.id === callId,
    );
    if (byId) return byId;
  }

  const date = validDate(input.date) ? input.date! : "";
  const portId = officialPortId(input.portId);
  const shipName = normalizeShip(input.shipName);
  if (!date || !shipName) return null;

  const candidates = listOfficialCruisePortCalls({
    from: date,
    through: date,
    ...(portId ? { portId } : {}),
    includeCancelled: true,
  });
  const exact = candidates.filter(
    (call) => normalizeShip(call.shipName) === shipName,
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  const fuzzy = candidates.filter((call) => {
    const candidate = normalizeShip(call.shipName);
    return candidate.includes(shipName) || shipName.includes(candidate);
  });
  return fuzzy.length === 1 ? fuzzy[0] : null;
}

function officialPortId(value: unknown): OfficialCruisePortId | undefined {
  return value === "havensight" ||
    value === "crown_bay" ||
    value === "cruz_bay" ||
    value === "frederiksted"
    ? value
    : undefined;
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeShip(value: unknown) {
  return typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/\([^)]*\)/g, " ")
        .replace(/\b(mv|ms)\b/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    : "";
}

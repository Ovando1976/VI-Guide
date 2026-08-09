import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const driverConsole = fs.readFileSync(
  path.join(root, "components/driver-console.tsx"),
  "utf8",
);

function expectSource(value: string, label: string) {
  if (!driverConsole.includes(value)) {
    throw new Error(`Driver console visual contract failed: ${label}`);
  }
}

expectSource(
  "bg-[linear-gradient(135deg,rgba(3,47,45,.98),rgba(7,80,76,.96))]",
  "duty strip uses the VI Guide operations foundation",
);
expectSource("Driver control", "duty state has an explicit operating identity");
expectSource(
  'aria-label="Driver operations views"',
  "Driver task navigation has an accessible identity",
);
expectSource(
  "overflow-x-auto",
  "Driver task navigation remains usable on narrow screens",
);
expectSource(
  "aria-pressed={active}",
  "Driver task buttons expose their selected state",
);
expectSource(
  "bg-[#f5c451] text-[#032f2d]",
  "Driver task navigation uses the gold active state",
);
expectSource(
  "this panel does not represent real-time demand",
  "static positioning signals are not presented as live telemetry",
);
expectSource(
  "not a real-time demand feed",
  "Hotspots map explicitly identifies its static reference status",
);
expectSource(
  "Official taxi tariff remains in effect.",
  "Airport positioning guidance preserves official tariff semantics",
);

for (const forbidden of [
  "premium uplift active",
  "A live demand surface",
  "Critical demand",
]) {
  if (driverConsole.includes(forbidden)) {
    throw new Error(
      `Driver console visual contract failed: stale or misleading demand language returned: ${forbidden}`,
    );
  }
}

expectSource(
  'collection(db, "bookings")',
  "Driver console keeps its Firestore booking listeners",
);
expectSource(
  'where("paymentStatus", "==", "paid")',
  "marketplace remains restricted to paid ride requests",
);
expectSource(
  "`/api/drivers/${driver.id}/availability`",
  "availability updates keep the existing driver API",
);
expectSource(
  "`/api/bookings/${bookingId}/accept`",
  "ride acceptance keeps the existing booking API",
);
expectSource(
  "`/api/bookings/${bookingId}/status`",
  "trip progression keeps the existing booking status API",
);
expectSource(
  'actorType: "driver"',
  "trip progression keeps driver actor attribution",
);
expectSource(
  "Expected driver settlement",
  "ride offers show driver payout before acceptance",
);
expectSource(
  "Paid online · dispatch cleared",
  "ride offers make payment clearance explicit",
);
expectSource(
  "Shared · stops possible",
  "shared ride operational expectations are visible",
);
expectSource(
  "Protected connection",
  "active trips protect ferry, flight, cruise, and appointment deadlines",
);
expectSource(
  "ConnectionCountdown",
  "active trip cockpit keeps a live connection countdown",
);

console.log("VI Guide Driver console visual and tariff contracts passed.");

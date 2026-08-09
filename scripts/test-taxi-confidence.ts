import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, "components/booking-panel.tsx"), "utf8");
const bookingRoute = fs.readFileSync(path.join(root, "app/api/bookings/route.ts"), "utf8");
const serverBookings = fs.readFileSync(path.join(root, "lib/server-bookings.ts"), "utf8");

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) throw new Error(`Taxi confidence contract failed: ${label}`);
}

expectSource(panel, "shared · possible wait + stops", "shared rides disclose waiting and stops");
expectSource(panel, "direct ride requested", "non-shared rides state the service request");
expectSource(panel, "secure online card", "payment expectations are explicit before checkout");
expectSource(panel, "Connection to protect", "travelers can record a critical connection");
expectSource(panel, "entering a time alone is not a guarantee", "schedule semantics remain honest");
expectSource(bookingRoute, "optionalFutureDate", "schedule fields are validated server-side");
expectSource(bookingRoute, 'paymentMethod: "online_card"', "server controls the payment method record");
expectSource(serverBookings, "serviceExpectation", "trip records preserve shared/direct expectations");

console.log("VI Guide taxi confidence contracts passed.");

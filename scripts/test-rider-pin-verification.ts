import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const createRoute = read("app/api/bookings/route.ts");
const bookingRoute = read("app/api/bookings/[bookingId]/route.ts");
const verifyRoute = read("app/api/bookings/[bookingId]/verify-rider/route.ts");
const serverBookings = read("lib/server-bookings.ts");
const driverConsole = read("components/driver-console.tsx");
const riderWorkspace = read("components/journey/journey-mobility-bookings.tsx");
const firestoreRules = read("firestore.rules");

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Rider PIN contract failed: ${label}`);
  }
}

expectSource(createRoute, "randomInt(0, 10_000)", "PINs use cryptographic randomness");
expectSource(createRoute, 'collection("bookingRiderSecrets")', "PINs live outside booking documents");
expectSource(bookingRoute, "booking.riderId === session.uid", "only the rider receives the PIN");
expectSource(verifyRoute, 'requireSession(["driver", "admin", "dispatcher"])', "verification requires an operations role");
expectSource(verifyRoute, "booking.driverId === (session.driverId ?? session.uid)", "drivers must be assigned to the ride");
expectSource(verifyRoute, 'booking.status !== "arrived"', "verification waits for driver arrival");
expectSource(verifyRoute, "timingSafeEqual", "PIN comparison avoids timing leaks");
expectSource(verifyRoute, 'type: "rider_verified"', "verification creates an audit event");
expectSource(serverBookings, 'booking.riderVerification?.status === "required"', "new bookings cannot start before verification");
expectSource(driverConsole, "RiderPinControl", "drivers receive a PIN entry control");
expectSource(riderWorkspace, "Share only with your assigned driver after arrival.", "riders receive safe PIN guidance");
expectSource(firestoreRules, "match /bookingRiderSecrets/{bookingId}", "Firestore explicitly protects PIN secrets");
expectSource(firestoreRules, "allow read, write: if false;", "PIN secrets reject direct client access");

console.log("USVI Explorer rider PIN verification contracts passed.");

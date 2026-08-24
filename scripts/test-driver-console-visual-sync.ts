import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const driverConsole = fs.readFileSync(
  path.join(root, "components/driver-console.tsx"),
  "utf8",
);
const driverPage = fs.readFileSync(
  path.join(root, "app/driver/page.tsx"),
  "utf8",
);
const drivePage = fs.readFileSync(
  path.join(root, "app/drive/page.tsx"),
  "utf8",
);
const driverApplyPage = fs.readFileSync(
  path.join(root, "app/driver/apply/page.tsx"),
  "utf8",
);
const driverApplicationForm = fs.readFileSync(
  path.join(root, "components/driver-application-form.tsx"),
  "utf8",
);
const driverApplicationRoute = fs.readFileSync(
  path.join(root, "app/api/driver-applications/route.ts"),
  "utf8",
);

function expectSource(value: string, label: string) {
  if (!driverConsole.includes(value)) {
    throw new Error(`Driver console visual contract failed: ${label}`);
  }
}

function expectDriverPageSource(value: string, label: string) {
  if (!driverPage.includes(value)) {
    throw new Error(`Driver economics contract failed: ${label}`);
  }
}

function expectOnboardingSource(
  source: string,
  value: string,
  label: string,
) {
  if (!source.includes(value)) {
    throw new Error(`Driver onboarding contract failed: ${label}`);
  }
}

function forbidOnboardingSource(
  source: string,
  value: string,
  label: string,
) {
  if (source.includes(value)) {
    throw new Error(`Driver onboarding contract failed: ${label}`);
  }
}

expectSource(
  "bg-[linear-gradient(135deg,rgba(3,47,45,.98),rgba(7,80,76,.96))]",
  "duty strip uses the USVI Explorer operations foundation",
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
expectSource(
  "RiderPinControl",
  "arrived trips require rider PIN verification",
);
expectSource(
  "`/api/bookings/${bookingId}/verify-rider`",
  "rider verification uses the protected booking API",
);
expectSource(
  "coordinateHref(booking.origin)",
  "drivers can navigate to exact pickup coordinates",
);
expectSource(
  "No additional location instructions.",
  "pickup and drop-off instructions have an explicit empty state",
);
expectSource(
  "Official fare record",
  "trip cards preserve the official tariff breakdown",
);
expectSource(
  "Current stage since",
  "drivers can see when the current lifecycle stage began",
);
expectSource(
  "View tariff",
  "drivers can inspect the source tariff",
);
expectSource(
  'doc(db, "vehicles", driver.vehicleId)',
  "console loads the assigned fleet vehicle",
);
expectSource(
  'doc(db, "taxiAssociations", driver.associationId)',
  "console loads the driver's dispatch association",
);
expectSource(
  "Association dispatch",
  "association name and dispatch phone remain visible",
);

expectDriverPageSource(
  "Free to join. Keep 85% of each eligible ride.",
  "driver signup is explicitly free and the 85% ride share is visible",
);
expectDriverPageSource(
  "Simple 15% commission",
  "the fixed platform commission is visible",
);
expectDriverPageSource(
  "No driver signup or activation fee.",
  "no signup fee is promised explicitly",
);
expectDriverPageSource(
  "Before separately disclosed processing fees or adjustments.",
  "driver share does not hide processing fees or adjustments",
);
expectDriverPageSource(
  "not an immediately withdrawable balance",
  "wallet totals do not over-promise payout availability",
);
expectDriverPageSource(
  "Settlement review, payment verification, refunds, disputes, and payout-account readiness",
  "driver economics copy preserves settlement safety gates",
);

expectOnboardingSource(
  drivePage,
  '"/login?next=/driver/apply"',
  "public driver recruitment returns authenticated applicants to the protected application",
);
expectOnboardingSource(
  drivePage,
  "Drive the islands. Join for $0.",
  "driver recruitment makes free signup explicit",
);
expectOnboardingSource(
  drivePage,
  "Submitting does not grant dispatch access.",
  "public recruitment preserves the approval boundary",
);
expectOnboardingSource(
  driverApplyPage,
  'redirect("/login?next=/driver/apply")',
  "driver application requires an authenticated account",
);
expectOnboardingSource(
  driverApplyPage,
  'redirect("/driver")',
  "already-authorized drivers return to Driver OS",
);
expectOnboardingSource(
  driverApplyPage,
  "Submitting does not grant Driver OS access.",
  "application page preserves the trusted provisioning boundary",
);
expectOnboardingSource(
  driverApplicationForm,
  "Submit free driver application",
  "driver application has an explicit free-submit action",
);
expectOnboardingSource(
  driverApplicationForm,
  "driver signup costs $0",
  "applicant acknowledges the zero-dollar signup fee",
);
expectOnboardingSource(
  driverApplicationForm,
  "fixed 15% commission",
  "applicant acknowledges the platform commission",
);
expectOnboardingSource(
  driverApplicationForm,
  "driver ride share is 85%",
  "applicant acknowledges the driver share",
);
expectOnboardingSource(
  driverApplicationForm,
  "this form does not activate dispatch access",
  "application UI does not imply self-activation",
);
expectOnboardingSource(
  driverApplicationRoute,
  "await requireSession()",
  "driver application intake is authenticated server-side",
);
expectOnboardingSource(
  driverApplicationRoute,
  '.collection(DRIVER_APPLICATIONS).doc(session.uid)',
  "driver application is bound to the authenticated UID",
);
expectOnboardingSource(
  driverApplicationRoute,
  'const DRIVER_APPLICATIONS = "driverApplications"',
  "driver application uses a dedicated collection",
);
expectOnboardingSource(
  driverApplicationRoute,
  "TAXI_DRIVER_SIGNUP_FEE_CENTS",
  "driver application uses the shared signup-fee policy",
);
expectOnboardingSource(
  driverApplicationRoute,
  "TAXI_PLATFORM_COMMISSION_BPS",
  "driver application uses the shared 15% commission policy",
);
expectOnboardingSource(
  driverApplicationRoute,
  "TAXI_DRIVER_SHARE_BPS",
  "driver application uses the shared 85% driver-share policy",
);
expectOnboardingSource(
  driverApplicationRoute,
  "body.acceptedEconomics !== true",
  "driver economics require explicit applicant consent",
);
expectOnboardingSource(
  driverApplicationRoute,
  "body.acceptedCompliance !== true",
  "compliance review requires explicit applicant consent",
);
forbidOnboardingSource(
  driverApplicationRoute,
  "setCustomUserClaims",
  "driver application intake must never grant Firebase roles",
);
forbidOnboardingSource(
  driverApplicationRoute,
  'role: "driver"',
  "driver application intake must never assign the driver role",
);
forbidOnboardingSource(
  driverApplicationRoute,
  '.collection("drivers")',
  "driver application intake must not create dispatch-ready driver records",
);

console.log(
  "USVI Explorer Driver console, economics, and onboarding contracts passed.",
);

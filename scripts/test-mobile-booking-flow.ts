import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, "components/booking-panel.tsx"), "utf8");

function expectSource(value: string, label: string) {
  if (!panel.includes(value)) throw new Error(`Mobile booking flow contract failed: ${label}`);
}

expectSource('title="Where are you going?"', "route starts the guided flow");
expectSource('continueLabel="Choose ride type"', "route advances to ride selection");
expectSource('continueLabel="Add passengers"', "ride selection advances to passenger details");
expectSource('continueLabel="Review official fare"', "passenger details advance to fare review");
expectSource('Step 04 · Official fare & confirmation', "final step clearly presents official fare confirmation");
expectSource('Confirm ride & continue to payment', "confirmation leads explicitly to payment");
expectSource('Official fare · no surge', "mobile sticky action keeps official fare visible");
expectSource('id="trip-review"', "mobile review has a stable scroll target");
expectSource('pickupInstructions', "pickup guidance is preserved");
expectSource('destinationInstructions', "destination guidance is preserved");
expectSource('Connection to protect (optional)', "critical connection timing is supported");
expectSource('entering a time alone is not a guarantee', "schedule semantics remain honest");
expectSource('secure online card', "payment method is disclosed before checkout");
expectSource('acceptedOperatorDisclosure', "operator disclosure gates booking");
expectSource('acceptedLegal', "legal consent gates booking");
expectSource('router.push(`/checkout/${payload.bookingId}`)', "successful request enters checkout");

console.log("USVI Explorer mobile booking flow contracts passed.");

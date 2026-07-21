import { DriverConsole } from "@/components/driver-console";
import { DriverLifecycleBanner } from "@/components/mobility/driver-lifecycle-banner";
import { DriverLocationPublisher } from "@/components/mobility/driver-location-publisher";
import { requireSession } from "@/lib/auth-server";

export default async function DriverPage() {
  const session = await requireSession(["driver", "admin"]);
  const driverId = session.driverId ?? session.uid;

  return (
    <main className="min-h-screen px-3 py-4 text-[#043331] sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <DriverLifecycleBanner />
        <DriverLocationPublisher driverId={driverId} />
        <DriverConsole driverId={driverId} />
      </div>
    </main>
  );
}

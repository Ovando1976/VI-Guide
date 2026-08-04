import { ProviderOperationsBoard } from "@/components/provider/provider-operations-board";

export const metadata = {
  title: "Provider Operations | VI Guide",
  description:
    "Manage business availability, operating hours, capacity, and blackout periods in VI Guide.",
};

export default function ProviderOperationsPage() {
  return <ProviderOperationsBoard />;
}

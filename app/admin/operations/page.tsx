import { OperationsCommandCenter } from "@/components/admin/operations-command-center";

export const metadata = {
  title: "Operations Command Center | USVI Explorer",
  description: "Monitor live USVI Explorer booking demand, traveler volume, merchant responses, and operational alerts.",
};

export default function OperationsPage() {
  return <OperationsCommandCenter />;
}

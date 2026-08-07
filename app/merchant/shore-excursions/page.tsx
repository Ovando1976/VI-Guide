import { ShoreExcursionBoard } from "@/components/merchant/shore-excursion-board";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shore Excursions | VI Guide Business Console",
  description:
    "Configure cruise-port pickup, excursion duration, capacity, accessibility, and return-to-ship operating buffers for VI Guide offers.",
};

export default function MerchantShoreExcursionsPage() {
  return <ShoreExcursionBoard />;
}

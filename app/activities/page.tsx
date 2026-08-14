import type { Metadata } from "next";

export { default } from "../experiences/page";

export const metadata: Metadata = {
  title: "Activities, Tours & Experiences | USVI Explorer",
  description:
    "Find and request memorable activities, tours, and local experiences across St. Thomas, St. John, and St. Croix.",
  alternates: { canonical: "/activities" },
};

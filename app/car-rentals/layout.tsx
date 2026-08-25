import type { ReactNode } from "react";

import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageMetadata({
  title: "Car Rentals",
  description:
    "Compare verified car and Jeep rental operators across St. Thomas, St. John, and St. Croix, then connect the rental to your USVI Explorer trip.",
  path: "/car-rentals",
});

export default function CarRentalsLayout({ children }: { children: ReactNode }) {
  return children;
}

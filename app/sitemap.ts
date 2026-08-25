import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://usvi-explorer.com";

const publicRoutes = [
  "",
  "/explore",
  "/places",
  "/dining",
  "/map",
  "/beaches",
  "/accommodations",
  "/activities",
  "/events",
  "/offers",
  "/mobility",
  "/concierge",
  "/cruises",
  "/cruises/port-calls",
  "/shore-excursions",
  "/ferry",
  "/car-rentals",
  "/fishing",
  "/historic",
  "/heritage",
  "/community",
  "/history",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicRoutes.map((path, index) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: now,
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : path === "/offers" || path === "/mobility" || path === "/cruises" ? 0.9 : 0.7,
  }));
}

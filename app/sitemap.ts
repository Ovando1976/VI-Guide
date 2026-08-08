import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://usviguide.com";

const publicRoutes = [
  "",
  "/explore",
  "/map",
  "/beaches",
  "/accommodations",
  "/eat",
  "/events",
  "/experiences",
  "/offers",
  "/mobility",
  "/concierge",
  "/cruises",
  "/cruises/port-calls",
  "/shore-excursions",
  "/history",
  "/dictionary",
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

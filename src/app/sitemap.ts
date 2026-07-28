import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Marketing pages only. /app and /coach are product surfaces (per-device
// state, thin for crawlers) and are excluded here and disallowed in
// robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/become-a-coach`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "monthly", priority: 0.3 },
  ];
}

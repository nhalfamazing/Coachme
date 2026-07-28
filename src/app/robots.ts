import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Product surfaces: per-device state, nothing useful to index.
        // /admin is the moderation console.
        disallow: ["/app", "/coach", "/api/", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

/* Open Graph metadata, built in one place.
 *
 * WHY THIS EXISTS: Next merges `metadata` field by field, and `openGraph`
 * is one field. A page that sets its own `openGraph` REPLACES the parent's
 * entire object rather than merging into it — so every page that wanted a
 * custom OG title was silently dropping the inherited `images`, `type` and
 * `siteName`. That is exactly what happened to the landing page: it carried
 * `twitter:image` (inherited, because it never overrode `twitter`) but no
 * `og:image` at all, so every share of koachme.ai rendered as a bare link.
 *
 * Call `openGraph()` instead of writing the object by hand and the defaults
 * cannot be lost again.
 */

import type { Metadata } from "next";
import { SITE_URL } from "./site";

/** 1200x630 brand card. Absolute, because scrapers do not resolve
 *  relative URLs. */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/brand/og-image.png`,
  width: 1200,
  height: 630,
  alt: "KoachMe — the performance graph for emerging athletes",
};

/* Facebook truncates around 130 characters on mobile and X shows even
   less, so OG descriptions get a tighter budget than meta descriptions. */
export const MAX_OG_DESCRIPTION_LEN = 125;

export interface OgInput {
  title: string;
  description: string;
  /** Page path, e.g. "/drills". Made absolute here. */
  path: string;
  type?: "website" | "article" | "video.other" | "profile";
  /** Page-specific image; falls back to the brand card. */
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
}

export function openGraph(input: OgInput): Metadata["openGraph"] {
  const image = input.image
    ? {
        url: input.image.url,
        width: input.image.width ?? 1200,
        height: input.image.height ?? 630,
        alt: input.image.alt ?? input.title,
      }
    : DEFAULT_OG_IMAGE;

  return {
    type: input.type ?? "website",
    siteName: "KoachMe",
    title: input.title,
    description: input.description,
    url: input.path === "/" ? SITE_URL : `${SITE_URL}${input.path}`,
    locale: "en_US",
    images: [image],
  };
}

/** Twitter card mirroring the OG values, so the two never drift. */
export function twitter(input: OgInput): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    title: input.title,
    description: input.description,
    images: [input.image?.url ?? DEFAULT_OG_IMAGE.url],
  };
}

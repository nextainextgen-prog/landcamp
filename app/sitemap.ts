import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.seo.siteUrl;
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          th: base,
          en: `${base}/en`,
        },
      },
    },
    // Anchor sections — included so search engines understand the in-page
    // structure (Google crawls hash routes for AnchorList rich results).
    ...siteConfig.nav.map((item) => ({
      url: `${base}/#${item.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

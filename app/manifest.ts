import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/siteConfig";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.brand.nameFull,
    short_name: siteConfig.brand.name,
    description: siteConfig.brand.description.th,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f1ea",
    theme_color: "#4d584b",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    categories: ["travel", "lifestyle", "hospitality"],
    lang: "th-TH",
  };
}

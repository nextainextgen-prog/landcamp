import { getSiteContent } from "@/lib/content/server";
import { ContentProvider } from "@/lib/content/provider";
import { LandingSections } from "@/components/sections/LandingSections";
import { FloatingLineButton } from "@/components/ui/FloatingLineButton";
import { RichMenuEntry } from "@/components/navigation/RichMenuEntry";
import { SiteAnnouncement } from "@/components/ui/SiteAnnouncement";

/**
 * LandCamp Villa Khao Yai — single-page landing.
 * Content (text/images) comes from the CMS override merged over code defaults.
 */

// ISR: regenerate at most once a minute so a room an admin closes drops off the
// public listing on its own, without waiting for a CMS publish to revalidate "/".
export const revalidate = 60;

export default async function Home() {
  const content = await getSiteContent();

  return (
    <ContentProvider content={content}>
      <RichMenuEntry />
      <LandingSections />
      <FloatingLineButton />
      <SiteAnnouncement />
    </ContentProvider>
  );
}

import { getSiteContent } from "@/lib/content/server";
import { ContentProvider } from "@/lib/content/provider";
import { LandingSections } from "@/components/sections/LandingSections";
import { FloatingLineButton } from "@/components/ui/FloatingLineButton";

/**
 * LandCamp Villa Khao Yai — single-page landing.
 * Content (text/images) comes from the CMS override merged over code defaults.
 */
export default async function Home() {
  const content = await getSiteContent();

  return (
    <ContentProvider content={content}>
      <LandingSections />
      <FloatingLineButton />
    </ContentProvider>
  );
}

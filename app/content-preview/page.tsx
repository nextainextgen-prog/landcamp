import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { readContentRow } from "@/lib/content/store";
import { CONTENT_DEFAULTS } from "@/lib/content/defaults";
import { mergeContent } from "@/lib/content/merge";
import { ContentProvider } from "@/lib/content/provider";
import { LandingSections } from "@/components/sections/LandingSections";
import { PreviewBridge } from "./PreviewBridge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ตัวอย่างเนื้อหา",
  robots: { index: false, follow: false },
};

/**
 * Live preview of the landing page rendered with the CURRENT DRAFT content.
 * Admin-gated, embedded in an iframe by the CMS editor so the owner sees their
 * edits on the real page before publishing.
 */
export default async function ContentPreviewPage() {
  if (!(await requireSection("content")).ok) redirect("/admin");

  const row = await readContentRow();
  const content = mergeContent(CONTENT_DEFAULTS, row?.draft);

  return (
    <ContentProvider content={content}>
      <PreviewBridge />
      <LandingSections />
    </ContentProvider>
  );
}

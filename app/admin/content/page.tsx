import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { readContentRow } from "@/lib/content/store";
import { CONTENT_DEFAULTS } from "@/lib/content/defaults";
import { mergeContent } from "@/lib/content/merge";
import { PageHeader } from "@/components/admin/ui";
import { ContentEditor } from "./ContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  if (!(await requireSection("content")).ok) redirect("/admin");

  const row = await readContentRow();
  // The form always edits a complete doc (defaults + saved draft merged).
  const draftDoc = mergeContent(CONTENT_DEFAULTS, row?.draft);
  const hasUnpublished =
    row !== null && JSON.stringify(row.draft ?? {}) !== JSON.stringify(row.published ?? {});

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/settings"
        className="text-xs text-[color:var(--color-forest-deep)]/60 transition-colors hover:text-[color:var(--color-warm-clay)]"
      >
        ‹ ตั้งค่าระบบ
      </Link>
      <PageHeader
        title="เนื้อหาเว็บ"
        description="แก้ข้อความบนหน้าเว็บ (2 ภาษา) — บันทึกร่างไว้ก่อน แล้วกดเผยแพร่เมื่อพร้อม การเผยแพร่จะอัปเดตเว็บจริงทันทีโดยไม่ต้อง deploy"
      />
      <ContentEditor
        initialDoc={draftDoc}
        tableMissing={row === null}
        initiallyUnpublished={hasUnpublished}
      />
    </div>
  );
}

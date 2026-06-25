import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";

/** Shared breadcrumb + title for settings sub-pages. */
export function SubHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/admin/settings"
        className="text-xs text-[color:var(--color-forest-deep)]/60 hover:text-[color:var(--color-warm-clay)]"
      >
        ‹ ตั้งค่าระบบ
      </Link>
      <PageHeader title={title} description={description} />
    </div>
  );
}

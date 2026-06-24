"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { SECTIONS, type AdminRole, type SectionKey } from "@/lib/admin/sections";

const SECTION_HREF: Record<SectionKey, string> = {
  bookings: "/admin/bookings",
  rooms: "/admin/rooms",
  revenue: "/admin/revenue",
  customers: "/admin/customers",
  "payment-settings": "/admin/payment-settings",
  users: "/admin/users",
};

export function AdminNav({
  role,
  permissions,
}: {
  role: AdminRole;
  permissions: SectionKey[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items = SECTIONS.filter(
    (s) => role === "super_admin" || permissions.includes(s.key),
  );

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1 p-3">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Admin
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const href = SECTION_HREF[item.key];
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={item.key}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={logout}
        className="mt-2 rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
      >
        ออกจากระบบ
      </button>
    </nav>
  );
}

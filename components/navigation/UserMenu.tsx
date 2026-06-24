"use client";

import { Avatar, Dropdown } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function initials(name?: string | null): string {
  const src = (name ?? "?").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({
  displayName,
  pictureUrl,
}: {
  displayName: string | null;
  pictureUrl: string | null;
}) {
  const router = useRouter();
  const label = initials(displayName);

  async function handleSignOut() {
    try {
      // Clear our LINE cookie and the Supabase (Google) session — whichever applies.
      await fetch("/api/auth/logout", { method: "POST" });
      try {
        await createSupabaseBrowserClient().auth.signOut();
      } catch {
        // ignore — Google session may not exist
      }
      router.refresh();
    } catch {
      window.location.assign("/");
    }
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={displayName ? `บัญชี ${displayName}` : "บัญชีของฉัน"}
        className="rounded-full outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]"
      >
        <Avatar size="sm" className="h-9 w-9 cursor-pointer">
          {pictureUrl ? (
            <Avatar.Image src={pictureUrl} alt={displayName ?? "User"} />
          ) : null}
          <Avatar.Fallback className="bg-[color:var(--color-warm-clay)] text-[color:var(--color-bone)] text-xs uppercase tracking-wider">
            {label}
          </Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="min-w-[200px]">
        <Dropdown.Menu aria-label="เมนูบัญชี">
          <Dropdown.Item id="account" href="/account">
            บัญชีของฉัน
          </Dropdown.Item>
          <Dropdown.Item id="bookings" href="/account/bookings">
            การจอง
          </Dropdown.Item>
          <Dropdown.Item id="signout" onAction={handleSignOut}>
            ออกจากระบบ
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

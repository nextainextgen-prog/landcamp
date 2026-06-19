"use client";

import { Avatar, Dropdown } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function initials(name?: string | null, email?: string | null): string {
  const src = (name ?? email ?? "?").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const meta = user.user_metadata ?? {};
  const fullName: string | undefined =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    undefined;
  const avatarUrl: string | undefined =
    typeof meta.avatar_url === "string" ? meta.avatar_url : undefined;
  const label = initials(fullName, user.email);

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.refresh();
    } catch (err) {
      console.error("sign-out failed:", err);
      window.location.assign("/");
    }
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={fullName ? `บัญชี ${fullName}` : "บัญชีของฉัน"}
        className="rounded-full outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[color:var(--color-warm-clay)]"
      >
        <Avatar size="sm" className="h-9 w-9 cursor-pointer">
          {avatarUrl ? (
            <Avatar.Image src={avatarUrl} alt={fullName ?? "User"} />
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

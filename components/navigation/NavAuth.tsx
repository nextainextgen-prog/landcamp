"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

type Variant = "desktop" | "mobile";

const envConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function NavAuth({ variant = "desktop" }: { variant?: Variant }) {
  const [user, setUser] = useState<User | null>(null);
  // When env isn't configured we can never hydrate auth — render the
  // signed-out state immediately. Otherwise wait for getSession to resolve
  // so the navbar doesn't flash sign-in then swap to avatar.
  const [ready, setReady] = useState(!envConfigured);

  useEffect(() => {
    if (!envConfigured) return;

    let active = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    // Reserve space so the navbar layout doesn't jump on first paint.
    return (
      <div
        aria-hidden
        className={variant === "mobile" ? "h-[52px] w-full" : "h-9 w-[112px]"}
      />
    );
  }

  if (user) {
    if (variant === "mobile") {
      // Avoid duplicate avatar in the mobile drawer — keep the menu compact.
      return null;
    }
    return <UserMenu user={user} />;
  }

  return <SignInButton variant={variant} />;
}

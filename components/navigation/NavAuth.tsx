"use client";

import { useEffect, useState } from "react";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

type Variant = "desktop" | "mobile";

type Me = {
  id: string;
  displayName: string | null;
  pictureUrl: string | null;
  provider: "line" | "google";
} | null;

/**
 * Reads the unified customer session via /api/auth/me (covers both LINE and
 * Google) and renders the avatar menu or the sign-in entry point.
 */
export function NavAuth({ variant = "desktop" }: { variant?: Variant }) {
  const [user, setUser] = useState<Me>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: Me }) => {
        if (!active) return;
        setUser(d.user);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
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
    return <UserMenu displayName={user.displayName} pictureUrl={user.pictureUrl} />;
  }

  return <SignInButton variant={variant} />;
}

// Seed the super-admin account. Run AFTER migration 009 is applied:
//   ADMIN_SEED_USERNAME=LandCamp ADMIN_SEED_PASSWORD=yourpass npx tsx supabase/seed-admin.ts
// (or put ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD in .env.local)
// Idempotent: skips if the username already exists (won't overwrite a changed
// password). Hash format must match lib/admin/auth.ts verifyPassword.
// No credentials are hardcoded here — they come from the environment.

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "node:crypto";

function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars in .env.local");

  const USERNAME = process.env.ADMIN_SEED_USERNAME ?? "LandCamp";
  const PASSWORD = process.env.ADMIN_SEED_PASSWORD;
  if (!PASSWORD) {
    throw new Error(
      "Set ADMIN_SEED_PASSWORD (env or .env.local) before seeding the super admin.",
    );
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing } = await supabase
    .from("admin_accounts")
    .select("id")
    .eq("username", USERNAME)
    .maybeSingle();

  if (existing) {
    console.log(`[seed-admin] '${USERNAME}' already exists — skipped (password unchanged).`);
    return;
  }

  const { error } = await supabase.from("admin_accounts").insert({
    username: USERNAME,
    password_hash: hashPassword(PASSWORD),
    role: "super_admin",
    permissions: [],
    is_active: true,
  });
  if (error) throw error;
  console.log(`[seed-admin] created super admin '${USERNAME}'.`);
}

main().catch((e) => {
  console.error("[seed-admin] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});

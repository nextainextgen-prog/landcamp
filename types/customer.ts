/**
 * Customer row (mirrors supabase/migrations/004_booking_system.sql).
 * Field names are snake_case to match the DB columns.
 */

export interface Customer {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  google_sub: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // CRM (migration 012)
  is_vip: boolean;
  tags: string[];
  source: "online" | "walk_in" | "manual";
  // LINE auth (migration 013)
  line_user_id: string | null;
  line_friend: boolean;
  auth_provider: "line" | "google" | null;
  // Profile completion + tax (migration 014)
  profile_completed_at: string | null;
  phone_verified: boolean;
  // Customer-entered contact/billing address (migration 024) — team-only
  address: string | null;
  tax_id: string | null;
  tax_name: string | null;
  tax_address: string | null;
  tax_branch: string | null;
  is_vat: boolean;
}

export type AdminRole = "super_admin" | "reception" | "housekeeping";

export interface AdminUser {
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

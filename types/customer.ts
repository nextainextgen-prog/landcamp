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
}

export type AdminRole = "super_admin" | "reception" | "housekeeping";

export interface AdminUser {
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

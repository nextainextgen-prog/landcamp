/**
 * Payment + notification rows (mirrors supabase/migrations/004_booking_system.sql).
 * Field names are snake_case to match the DB columns.
 */

export type PaymentKind = "deposit" | "remainder" | "full";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  kind: PaymentKind;
  method: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  slip_url: string | null;
  trans_ref: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  sent_at: string | null;
  status: string | null;
  created_at: string;
}

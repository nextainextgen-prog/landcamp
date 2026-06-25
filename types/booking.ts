/**
 * Booking row (mirrors supabase/migrations/004_booking_system.sql).
 * Field names are snake_case to match the DB columns.
 */

export type BookingStatus =
  | "pending_payment"
  | "payment_review"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Booking {
  id: string;
  booking_code: string;
  customer_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  extra_bed: boolean;
  nights: number;
  base_amount: number;
  extra_bed_amount: number;
  total_amount: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomAvailability {
  id: string;
  room_id: string;
  date: string;
  available: boolean;
  reason: string | null;
  created_at: string;
}

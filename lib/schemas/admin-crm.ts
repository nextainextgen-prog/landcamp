import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

// ── Customer notes ──
export const CreateNoteSchema = z.object({
  body: z.string().trim().min(1, "note is empty").max(2000),
});
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

// ── Customer contact log ──
export const CreateContactSchema = z.object({
  channel: z.enum(["phone", "email", "line", "chat", "other"]),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  summary: z.string().trim().min(1, "summary is empty").max(2000),
});
export type CreateContactInput = z.infer<typeof CreateContactSchema>;

// ── Customer profile patch (VIP flag / tags) ──
export const PatchCustomerSchema = z
  .object({
    isVip: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  })
  .refine((v) => v.isVip !== undefined || v.tags !== undefined, {
    message: "nothing to update",
  });
export type PatchCustomerInput = z.infer<typeof PatchCustomerSchema>;

// ── Walk-in booking (front desk) ──
export const WalkInSchema = z
  .object({
    // Customer (no auth account; matched/created by phone or email when given).
    fullName: z.string().trim().min(1, "name is required").max(120),
    phone: z.string().trim().max(40).optional().default(""),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    // Reservation
    roomId: z.string().uuid(),
    checkIn: isoDate,
    checkOut: isoDate,
    adults: z.number().int().min(1),
    children: z.number().int().min(0),
    extraBed: z.boolean().default(false),
    // Payment
    method: z.enum(["cash", "transfer", "card"]),
    paid: z.boolean().default(true),
    notes: z.string().trim().max(1000).optional().default(""),
  })
  .refine((v) => v.checkOut > v.checkIn, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });
export type WalkInInput = z.infer<typeof WalkInSchema>;

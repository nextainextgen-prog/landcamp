import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const AvailabilityQuerySchema = z
  .object({
    roomId: z.string().uuid(),
    checkIn: isoDate,
    checkOut: isoDate,
  })
  .refine((v) => v.checkOut > v.checkIn, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;

export const CreateBookingSchema = z
  .object({
    roomId: z.string().uuid(),
    customerId: z.string().uuid(),
    checkIn: isoDate,
    checkOut: isoDate,
    adults: z.number().int().min(1),
    children: z.number().int().min(0),
    extraBed: z.boolean(),
    notes: z.string().optional(),
  })
  .refine((v) => v.checkOut > v.checkIn, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

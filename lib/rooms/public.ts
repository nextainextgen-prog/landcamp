/**
 * Public room data for the website — DB-backed, merged over the static
 * data/rooms.ts defaults per slug so nothing regresses if a DB field is empty.
 * Admin edits in /admin/rooms (the DB) win; missing pieces fall back to the
 * original file. If the DB is unreachable/empty, the static rooms are returned.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rooms as staticRooms } from "@/data/rooms";
import type { Bilingual, Room, RoomType } from "@/types";

type DbRoom = {
  slug: string;
  room_type: RoomType;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  price_weekday: number;
  price_weekend: number;
  max_guests: number;
  is_available: boolean;
  display_order: number;
  amenities: unknown;
  images: unknown;
  details: Record<string, unknown> | null;
};

function bi(v: unknown, fb: Bilingual): Bilingual {
  if (v && typeof v === "object" && "th" in v && "en" in v) {
    return { th: String((v as Bilingual).th ?? ""), en: String((v as Bilingual).en ?? "") };
  }
  return fb;
}
function biList(v: unknown): Bilingual[] | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter((x) => x && typeof x === "object")
    .map((x) => ({ th: String((x as Bilingual).th ?? ""), en: String((x as Bilingual).en ?? "") }));
}
function imageList(v: unknown): { src: string; alt: Bilingual }[] | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter((x) => x && typeof x === "object" && typeof (x as { src?: unknown }).src === "string")
    .map((x) => {
      const o = x as { src: string; alt?: unknown };
      return { src: o.src, alt: bi(o.alt, { th: "", en: "" }) };
    });
}

/** Merge a DB room over its static counterpart (same slug). */
function mergeRoom(db: DbRoom, base: Room | undefined): Room {
  const d = db.details ?? {};
  const fb: Room =
    base ?? ({
      id: db.slug,
      type: db.room_type,
      name: { th: db.name_th, en: db.name_en },
      description: { th: db.description_th, en: db.description_en },
      priceWeekday: db.price_weekday,
      priceWeekend: db.price_weekend,
      startingPrice: db.price_weekday,
      maxGuests: db.max_guests,
      bedSize: { th: "", en: "" },
      roomSize: { th: "", en: "" },
      breakfastIncluded: { th: "", en: "" },
      extraBed: { th: "", en: "" },
      services: [],
      checkIn: "14:00",
      checkOut: "12:00",
      amenities: [],
      images: [],
      available: db.is_available,
    } as Room);

  const images = imageList(db.images);
  const amenities = biList(db.amenities);

  return {
    ...fb,
    id: db.slug,
    type: db.room_type,
    name: { th: db.name_th, en: db.name_en },
    description: { th: db.description_th, en: db.description_en },
    priceWeekday: db.price_weekday,
    priceWeekend: db.price_weekend,
    maxGuests: db.max_guests,
    available: db.is_available,
    startingPrice: typeof d.startingPrice === "number" ? d.startingPrice : fb.startingPrice,
    bedSize: bi(d.bedSize, fb.bedSize),
    roomSize: bi(d.roomSize, fb.roomSize),
    layout: d.layout ? bi(d.layout, fb.layout ?? { th: "", en: "" }) : fb.layout,
    breakfastIncluded: bi(d.breakfast, fb.breakfastIncluded),
    extraBed: bi(d.extraBed, fb.extraBed),
    services: biList(d.services) ?? fb.services,
    checkIn: typeof d.checkIn === "string" && d.checkIn ? d.checkIn : fb.checkIn,
    checkOut: typeof d.checkOut === "string" && d.checkOut ? d.checkOut : fb.checkOut,
    amenities: amenities && amenities.length ? amenities : fb.amenities,
    images: images && images.length ? images : fb.images,
    badge: d.badge ? bi(d.badge, { th: "", en: "" }) : undefined,
  };
}

export async function getPublicRooms(): Promise<Room[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("rooms")
      .select(
        "slug, room_type, name_th, name_en, description_th, description_en, price_weekday, price_weekend, max_guests, is_available, display_order, amenities, images, details",
      )
      .order("display_order");
    if (error || !data || data.length === 0) return staticRooms;

    const bySlug = new Map(staticRooms.map((r) => [r.id, r]));
    // Hide rooms an admin has closed (is_available = false) from the public
    // listing. Filtering after the empty-check above keeps the static fallback
    // tied to "DB unreachable/empty", not "every room happens to be closed".
    return (data as DbRoom[])
      .filter((db) => db.is_available)
      .map((db) => mergeRoom(db, bySlug.get(db.slug)));
  } catch {
    return staticRooms;
  }
}

// run: npx tsx supabase/seed-rooms.ts [--dry-run]
// requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { rooms } from "../data/rooms";

type RoomRow = {
  slug: string;
  room_type: "villa-1bed" | "villa-2bed" | "train" | "camper";
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  price_weekday: number;
  price_weekend: number;
  max_guests: number;
  amenities: Array<{ th: string; en: string }>;
  images: Array<{ src: string; alt: { th: string; en: string } }>;
  is_available: boolean;
  display_order: number;
};

function mapRoomToRow(
  room: (typeof rooms)[number],
  displayOrder: number,
): RoomRow {
  return {
    slug: room.id,
    room_type: room.type,
    name_th: room.name.th,
    name_en: room.name.en,
    description_th: room.description.th,
    description_en: room.description.en,
    price_weekday: room.priceWeekday,
    price_weekend: room.priceWeekend,
    max_guests: room.maxGuests,
    amenities: room.amenities.map((a) => ({ th: a.th, en: a.en })),
    images: room.images.map((img) => ({
      src: img.src,
      alt: { th: img.alt.th, en: img.alt.en },
    })),
    is_available: room.available,
    display_order: displayOrder,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const mode = dryRun ? "DRY-RUN" : "LIVE";
  console.log(`[seed-rooms] mode=${mode} · ${rooms.length} room(s) to upsert`);

  const rows = rooms.map((room, i) => mapRoomToRow(room, i + 1));

  if (dryRun) {
    rows.forEach((row, i) => {
      console.log(
        `[seed-rooms] (${i + 1}/${rows.length}) would upsert slug=${row.slug} type=${row.room_type} weekday=${row.price_weekday} weekend=${row.price_weekend} images=${row.images.length}`,
      );
    });
    console.log("[seed-rooms] dry-run complete — no DB writes performed");
    return;
  }

  loadEnvConfig(process.cwd());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { error } = await supabase
      .from("rooms")
      .upsert(row, { onConflict: "slug" });
    if (error) {
      console.error(
        `[seed-rooms] (${i + 1}/${rows.length}) FAILED slug=${row.slug}: ${error.message}`,
      );
      throw error;
    }
    console.log(
      `[seed-rooms] (${i + 1}/${rows.length}) upserted slug=${row.slug} type=${row.room_type}`,
    );
  }

  console.log(`[seed-rooms] done · ${rows.length} room(s) upserted`);
}

main().catch((err) => {
  console.error("[seed-rooms] fatal:", err);
  process.exit(1);
});

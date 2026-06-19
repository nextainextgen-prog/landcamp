"use client";

// Dev-only harness for visually verifying <BookingModal />. Not linked from
// anywhere — codex-2 will wire the real trigger into the Rooms section in
// Wave 4. Safe to leave under app/_dev/ because nothing routes here.

import { useState } from "react";
import { Button } from "@heroui/react";
import { BookingModal } from "@/components/booking";
import { rooms } from "@/data/rooms";

export default function BookingModalDevPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl text-[color:var(--color-forest-deep)]">
        BookingModal dev harness
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Click a room to open the booking modal.
      </p>
      <ul className="mt-6 space-y-2">
        {rooms.map((room) => (
          <li key={room.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div>
              <div className="font-medium">{room.name.th}</div>
              <div className="text-xs text-neutral-500">
                {room.priceWeekday.toLocaleString("th-TH")} ฿ / คืน · รับ {room.maxGuests} ท่าน
              </div>
            </div>
            <Button variant="primary" onPress={() => setOpenId(room.id)}>
              เปิด
            </Button>
            {openId === room.id ? (
              <BookingModal
                room={room}
                open
                onOpenChange={(b) => setOpenId(b ? room.id : null)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

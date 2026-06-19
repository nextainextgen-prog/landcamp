"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import type { Room } from "@/types";
import {
  BookingDateRangePicker,
  type IsoDateRange,
} from "./DateRangePicker";
import { GuestCounter } from "./GuestCounter";
import { BookingPricingSummary } from "./BookingPricingSummary";

type Props = {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_RANGE: IsoDateRange = { startDate: null, endDate: null };

function diffNights(range: IsoDateRange): number {
  if (!range.startDate || !range.endDate) return 0;
  const a = new Date(range.startDate);
  const b = new Date(range.endDate);
  const ms = b.getTime() - a.getTime();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.round(ms / 86_400_000);
}

export function BookingModal({ room, open, onOpenChange }: Props) {
  const [range, setRange] = useState<IsoDateRange>(EMPTY_RANGE);
  const [adults, setAdults] = useState(() => Math.min(2, room.maxGuests));
  const [children, setChildren] = useState(0);
  const [extraBed, setExtraBed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Reset form on every open transition by intercepting onOpenChange — keeps
  // state out of useEffect (react-hooks/set-state-in-effect).
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setRange(EMPTY_RANGE);
        setAdults(Math.min(2, room.maxGuests));
        setChildren(0);
        setExtraBed(false);
        setToast(null);
      }
      onOpenChange(next);
    },
    [onOpenChange, room.maxGuests],
  );

  const nights = useMemo(() => diffNights(range), [range]);
  const canSubmit = nights > 0 && adults > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const draft = {
      roomId: room.id,
      checkIn: range.startDate,
      checkOut: range.endDate,
      nights,
      adults,
      children,
      extraBed,
      basePrice: room.priceWeekday,
    };
    console.log("[BookingModal] draft booking", draft);
    setToast("จองสำเร็จ (placeholder)");
    window.setTimeout(() => setToast(null), 2400);
  }

  return (
    <Modal isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <div>
                <div
                  className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/65"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  จองห้องพัก
                </div>
                <Modal.Heading className="mt-1 font-display text-2xl text-[color:var(--color-forest-deep)] sm:text-3xl">
                  {room.name.th}
                </Modal.Heading>
                <p className="mt-1 text-xs text-neutral-500">
                  รับสูงสุด {room.maxGuests} ท่าน · {room.roomSize.th}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              <form
                id="booking-modal-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
              >
                <BookingDateRangePicker
                  value={range}
                  onChange={setRange}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <GuestCounter
                    label="ผู้ใหญ่"
                    value={adults}
                    onChange={setAdults}
                    min={1}
                    max={room.maxGuests}
                  />
                  <GuestCounter
                    label="เด็ก"
                    value={children}
                    onChange={setChildren}
                    min={0}
                    max={Math.max(0, room.maxGuests - adults)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-[color:var(--color-ink)]">
                      เตียงเสริม
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      เพิ่ม 1,500 บาท / คืน
                    </div>
                  </div>
                  <Switch
                    isSelected={extraBed}
                    onChange={setExtraBed}
                    aria-label="เตียงเสริม"
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>

                <BookingPricingSummary
                  basePrice={room.priceWeekday}
                  nights={nights}
                  extraBed={extraBed}
                />

                {toast ? (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                  >
                    {toast}
                  </div>
                ) : null}
              </form>
            </Modal.Body>

            <Modal.Footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onPress={() => handleOpenChange(false)}
              >
                ปิด
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="booking-modal-form"
                isDisabled={!canSubmit}
              >
                จองเลย
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

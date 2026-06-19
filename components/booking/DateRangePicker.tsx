"use client";

import { useMemo } from "react";
import {
  DateRangePicker as HeroUIDateRangePicker,
  Label,
  RangeCalendar,
} from "@heroui/react";
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
  today,
} from "@internationalized/date";

export type IsoDateRange = {
  startDate: string | null;
  endDate: string | null;
};

type Props = {
  value: IsoDateRange;
  onChange: (next: IsoDateRange) => void;
  /** ISO yyyy-MM-dd; defaults to today */
  minDate?: string;
  label?: string;
};

function toCalendar(iso: string | null): CalendarDate | null {
  if (!iso) return null;
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
}

function formatThaiDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BookingDateRangePicker({
  value,
  onChange,
  minDate,
  label = "วันเข้า–ออก",
}: Props) {
  const min = useMemo(
    () => (minDate ? parseDate(minDate) : today(getLocalTimeZone())),
    [minDate],
  );

  const ariaValue = useMemo(() => {
    const start = toCalendar(value.startDate);
    const end = toCalendar(value.endDate);
    return start && end ? { start, end } : null;
  }, [value.startDate, value.endDate]);

  const startLabel = formatThaiDate(value.startDate);
  const endLabel = formatThaiDate(value.endDate);

  return (
    <HeroUIDateRangePicker
      value={ariaValue}
      minValue={min}
      onChange={(next) => {
        if (!next) {
          onChange({ startDate: null, endDate: null });
          return;
        }
        onChange({
          startDate: next.start.toString(),
          endDate: next.end.toString(),
        });
      }}
      className="flex flex-col gap-2"
    >
      <Label className="text-sm font-medium text-neutral-700">{label}</Label>
      <HeroUIDateRangePicker.Trigger className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-left text-sm transition-colors hover:border-[color:var(--color-forest-deep)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-warm-clay)]/40">
        <span className="flex-1 truncate">
          {startLabel && endLabel ? (
            <span className="text-[color:var(--color-ink)]">
              {startLabel} – {endLabel}
            </span>
          ) : (
            <span className="text-neutral-400">เลือกวันเข้า–ออก</span>
          )}
        </span>
        <HeroUIDateRangePicker.TriggerIndicator className="text-neutral-500">
          📅
        </HeroUIDateRangePicker.TriggerIndicator>
      </HeroUIDateRangePicker.Trigger>
      <HeroUIDateRangePicker.Popover className="z-50 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
        <RangeCalendar>
          <RangeCalendar.Header className="flex items-center justify-between px-1 pb-2">
            <RangeCalendar.NavButton
              slot="previous"
              className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100"
            >
              ‹
            </RangeCalendar.NavButton>
            <RangeCalendar.Heading className="text-sm font-medium" />
            <RangeCalendar.NavButton
              slot="next"
              className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100"
            >
              ›
            </RangeCalendar.NavButton>
          </RangeCalendar.Header>
          <RangeCalendar.Grid className="text-sm">
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell className="px-2 py-1 text-xs font-medium text-neutral-500">
                  {day}
                </RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </HeroUIDateRangePicker.Popover>
    </HeroUIDateRangePicker>
  );
}

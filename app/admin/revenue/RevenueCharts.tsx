"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SeriesPoint, Slice } from "@/lib/revenue/metrics";

const CLAY = "#9a795b";
const SAGE = "#a2aaa1";
const FOREST = "#4d584b";

const baht = (v: number) => `฿${Number(v).toLocaleString("en-US")}`;
const compactBaht = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(45,55,40,0.12)",
  fontSize: 12,
  boxShadow: "0 12px 32px -16px rgba(45,55,40,0.5)",
};

/** Main revenue trend: filled current period + dashed previous-period overlay. */
export function RevenueTrendChart({ data, showCompare }: { data: SeriesPoint[]; showCompare: boolean }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CLAY} stopOpacity={0.4} />
              <stop offset="100%" stopColor={CLAY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,40,0.07)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis
            tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={compactBaht}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={((value: number | string, name: string) => [baht(Number(value)), name === "value" ? "ช่วงนี้" : "ช่วงก่อน"]) as never}
          />
          {showCompare && (
            <Line type="monotone" dataKey="compare" stroke={SAGE} strokeWidth={2} strokeDasharray="5 4" dot={false} />
          )}
          <Area type="monotone" dataKey="value" stroke={CLAY} strokeWidth={2.5} fill="url(#revArea)" dot={{ r: 2.5, fill: CLAY }} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with center total + legend showing ฿ amounts and share. */
export function BreakdownDonut({ data, centerLabel }: { data: Slice[]; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-[color:var(--color-ink)]/45">ยังไม่มีข้อมูล</div>;
  }
  const top = data.slice(0, 6);
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={top} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2} stroke="none">
              {top.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={((value: number | string) => [baht(Number(value)), "รายได้"]) as never} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-semibold text-[color:var(--color-forest-deep)]">{compactBaht(total)}</span>
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink)]/45">{centerLabel ?? "รวม"}</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2.5">
        {top.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-[color:var(--color-ink)]/70">{d.name}</span>
            <span className="shrink-0 font-medium tabular-nums text-[color:var(--color-forest-deep)]">{baht(d.value)}</span>
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-[color:var(--color-ink)]/40">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars for a small categorical breakdown (e.g. payment method). */
export function BreakdownBars({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-[color:var(--color-ink)]/45">ยังไม่มีข้อมูล</div>;
  }
  const top = data.slice(0, 6);
  return (
    <div style={{ height: Math.max(140, top.length * 44) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,40,0.07)" horizontal={false} />
          <XAxis type="number" tickFormatter={compactBaht} tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "rgba(26,24,20,0.65)" }} axisLine={false} tickLine={false} width={72} />
          <Tooltip cursor={{ fill: "rgba(154,121,91,0.06)" }} contentStyle={tooltipStyle} formatter={((value: number | string) => [baht(Number(value)), "รายได้"]) as never} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
            {top.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Weekday-aligned calendar heatmap of daily revenue, with discrete shades. */
const HEAT_SCALE = [
  "rgba(45,55,40,0.06)",   // ไม่มีรายได้
  "rgba(154,121,91,0.28)",
  "rgba(154,121,91,0.50)",
  "rgba(154,121,91,0.74)",
  "rgba(154,121,91,1)",    // สูงสุด
];
const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function CalendarHeatmap({ data }: { data: SeriesPoint[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  if (max === 0 || data.length === 0) {
    return <div className="flex h-32 items-center justify-center text-sm text-[color:var(--color-ink)]/45">ยังไม่มีข้อมูลรายวัน</div>;
  }
  const level = (v: number) =>
    v <= 0 ? 0 : v >= max ? 4 : Math.min(4, 1 + Math.floor((v / max) * 4));

  // Pad the start so the first cell lands on its real weekday row.
  const firstDow = new Date(`${data[0].key}T00:00:00Z`).getUTCDay();
  const cells: (SeriesPoint | null)[] = [...Array(firstDow).fill(null), ...data];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 pr-0.5 text-[10px] text-[color:var(--color-ink)]/40">
          {WEEKDAY_TH.map((w, i) => (
            <span key={w} className="h-4 leading-4">{i % 2 === 1 ? w : ""}</span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
          {cells.map((c, i) =>
            c ? (
              <div
                key={c.key}
                title={`${c.label}: ฿${c.value.toLocaleString("en-US")}`}
                className="h-4 w-4 shrink-0 rounded-[4px] ring-1 ring-inset ring-black/[0.03]"
                style={{ background: HEAT_SCALE[level(c.value)] }}
              />
            ) : (
              <div key={`pad-${i}`} className="h-4 w-4 shrink-0" />
            ),
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-[color:var(--color-ink)]/45">
        <span>น้อย</span>
        {HEAT_SCALE.map((c, i) => (
          <span key={i} className="h-3.5 w-3.5 rounded-[4px]" style={{ background: c }} />
        ))}
        <span>มาก</span>
      </div>
    </div>
  );
}

export { FOREST };

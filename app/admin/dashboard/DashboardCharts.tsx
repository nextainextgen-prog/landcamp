"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CLAY = "#9a795b";

export function RevenueAreaChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CLAY} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CLAY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,40,0.08)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "rgba(26,24,20,0.5)" }} axisLine={false} tickLine={false} width={56}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
          <Tooltip
            formatter={(value) => [`฿${Number(value).toLocaleString("en-US")}`, "รายได้"] as [string, string]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(45,55,40,0.12)", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="revenue" stroke={CLAY} strokeWidth={2.5} fill="url(#rev)" dot={{ r: 3, fill: CLAY }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-[color:var(--color-ink)]/45">ยังไม่มีข้อมูล</div>;
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(45,55,40,0.12)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold text-[color:var(--color-forest-deep)]">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink)]/45">ทั้งหมด</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-[color:var(--color-ink)]/70">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-medium text-[color:var(--color-forest-deep)]">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

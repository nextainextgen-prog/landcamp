# LandCamp — Handoff

> อ่านไฟล์นี้ก่อนทำงานต่อ แล้วดู `docs/ROADMAP.md` (เช็คลิสต์งานที่มีชีวิต) คู่กัน
> อัปเดต: 2026-06-24 · branch ที่ทำงาน: **`alpha`** (ห้าม push `main`)

---

## 1. โปรเจกต์คืออะไร
ระบบจองที่พัก **LandCamp Villa (เขาใหญ่)** — เว็บลูกค้า (จองออนไลน์) + หลังบ้านแอดมิน
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres) · TypeScript
- ⚠️ Next.js 16 มี breaking changes — อ่าน `node_modules/next/dist/docs/` ก่อนแตะ Next API. จุดสำคัญที่เจอแล้ว: **Middleware ถูกเปลี่ยนชื่อเป็น `proxy.ts`** (ไฟล์ `proxy.ts` ที่ root ทำหน้าที่ refresh Supabase session)
- Package manager: **npm**

## 2. Done-criteria (ต้องผ่านก่อน commit เสมอ)
```
npx tsc --noEmit     # ต้องเขียว
npm run lint         # ต้องเขียว (eslint.config.mjs ignore .worktrees/** + **/.next/**)
npm run build        # ต้องเขียว (สำคัญสุด — build รีเจน .next/types ด้วย)
```
> ทุกครั้งที่ `npm run build` จะลบ/เขียน `.next` ใหม่ ถ้า dev server รันอยู่ให้ restart: `pkill -f "next dev"` แล้ว `npm run dev`

## 3. สภาพแวดล้อม / ของจริงที่ต้องรู้
- **Supabase = PRODUCTION branch จริง** (`dbfufvddvqsdzwmcygkn`). การ seed/insert/migration กระทบข้อมูลจริง — ยืนยันกับ owner ก่อนเขียน
- **Migrations อยู่ที่ `supabase/migrations/`** owner รันเองผ่าน Supabase SQL Editor (ไม่มี `supabase db push` ในโฟลว์นี้)
  - รันแล้วถึง **009** · **010 ยังไม่ได้รัน** (owner ต้องรัน — ดูข้อ 7)
- **`.env.local`** มี: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EASYSLIP_API_KEY`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`
  - บน Vercel มี `EASYSLIP_API_KEY` แล้ว · **ยังขาด `ADMIN_SESSION_SECRET` + `CRON_SECRET`** (owner ต้องเพิ่ม — ข้อ 7)
- **เข้าหลังบ้าน:** `/admin` → login **username `LandCamp` / password `LandCamp196`** (super admin). ถ้าเปลี่ยน `ADMIN_SESSION_SECRET` ต้อง login ใหม่
- Supabase Storage: bucket **`slips`** (private) เก็บรูปสลิป
- รัน script: `npx tsx supabase/seed-rooms.ts` (seed ห้อง), `ADMIN_SEED_PASSWORD=xxx npx tsx supabase/seed-admin.ts` (seed super admin — ไม่มีรหัส hardcode แล้ว)

## 4. สถาปัตยกรรมที่ต้องเข้าใจก่อนแก้

### Auth มี 2 ระบบแยกกัน
- **ลูกค้า** = Supabase Google OAuth (`lib/supabase/*`, `proxy.ts` refresh session, หน้า `/account`)
- **แอดมิน** = username/password ของเราเอง (`lib/admin/auth.ts`) → cookie `lc_admin` (HMAC). ตาราง `admin_accounts` (ไม่ใช่ `admin_users` เก่าที่กำลังจะลบใน 010)
  - `lib/admin/guard.ts`: `requireAdmin()` / `requireSection(section)` ใช้กันทุก `/api/admin/*` และทุกหน้า `/admin/*`
  - สิทธิ์รายเมนูเก็บใน `admin_accounts.permissions` (jsonb). super_admin เข้าได้ทุกเมนู
  - `lib/admin/sections.ts` = ค่าคงที่ sections (client-safe, **อย่า import `lib/admin/auth` เข้า client component** เพราะมี `next/headers`)

### Flow การจอง + ชำระเงิน (สำคัญ — เปลี่ยนจากแผนเดิม)
1. ลูกค้าจองผ่าน `components/booking/BookingModal.tsx` → `POST /api/bookings` → สถานะ `pending_payment` ล็อกห้อง 15 นาที (cron `/api/cron/clear-expired-bookings` เคลียร์)
2. หน้าแสดงเงิน: `POST /api/payments/info` คืนบัญชี/QR ที่แอดมินตั้ง (จาก `payment_accounts`) — **ไม่ generate QR เองแล้ว**
3. ลูกค้าแนบสลิป → `POST /api/payments/slip`: อัปขึ้น Storage `slips`, ตรวจกับ EasySlip **เบื้องหลัง**, เก็บผล (`verify_status`/`verify_note`) → booking เป็น `payment_review`. **ลูกค้าไม่เห็นผลตรวจ** (กันเห็น error เวลาระบบพลาด)
4. แอดมินดูที่ `/admin/bookings` → เห็นสลิป (signed URL) + ผลตรวจ → กดยืนยัน/ปฏิเสธ (`PATCH /api/admin/bookings/[id]`)
- สถานะ booking: `pending_payment` → `payment_review` → `confirmed` (หรือ `cancelled`/`completed`/`no_show`). ทั้ง 3 สถานะแรกถูกกันจองซ้ำด้วย EXCLUDE constraint
- ราคา/เช็คห้องว่าง: `lib/booking/*` (pricing 2 เรท weekday/weekend, เตียงเสริม 750/คืน), EasySlip client: `lib/easyslip.ts`

### หลังบ้าน UI
- Shell: `components/admin/AdminShell.tsx` (sidebar เขียวเข้ม forest-night + topbar, responsive). Login: `components/admin/AdminLogin.tsx`
- UI kit: `components/admin/ui.tsx` (`PageHeader`, `Panel`, `StatCard`, `Badge`, `DataTable`, `EmptyState`) — ใช้สี CI ผ่าน `var(--color-*)` (forest/sage/warm-clay/bone/ink ใน `app/globals.css`)
- กราฟ: **recharts** (`app/admin/dashboard/DashboardCharts.tsx`)
- หน้าแอดมิน: `dashboard`, `bookings`, `calendar`, `occupancy`, `walk-in`, `rooms`, `revenue`, `customers` (+`[id]`), `payment-settings`, `users`
- หน้าฟอร์มยังใช้ HeroUI (rooms/users/payment-settings) — re-skin ระดับ PageHeader แล้ว, ตัว modal/table ภายในยังเป็น HeroUI (เข้ากันได้)

## 5. งานที่ทำในเซสชันนี้ (commit บน `alpha`)
```
ee4d002 fix(security): slips→Storage, room names, scrub seed pwd, retire admin_users (ROADMAP step 1)
b9f3000 docs: master roadmap
bbcf78e feat(admin-ui): CRM customer detail, walk-in scaffold, nav work badge
257dad8 feat(admin-ui): re-skin pages + booking calendar + occupancy grid
85e3580 feat(admin-ui): CI-themed shell, dashboard + charts (foundation)
1cf85b8 feat(admin): username/password auth + user management + per-section permissions
e0db6f4 feat(admin): rooms, bookings mgmt, revenue, customers
9652ecb feat(admin): real admin auth gate
b493373 feat(payment): manual-transfer flow with admin slip review (Sprint 3 redesign)
21dd36b feat(booking): online booking creation, hold-expiry cron, session proxy (Sprint 2)
```
สรุป: Sprint 1–3 + Sprint 5 (หลังบ้าน) + ยกเครื่อง UX/UI หลังบ้าน (สี CI) + ระบบ login/จัดการผู้ใช้แอดมิน + ROADMAP step 1 (ความปลอดภัย) ฝั่งโค้ด

## 6. ค้างอยู่ — owner ต้องทำเอง (ผมทำแทนไม่ได้)
1. **รัน migration 010** ใน SQL Editor (ลบตาราง `admin_users` เก่า + policy ที่อ้างถึง) — ไฟล์ `supabase/migrations/010_retire_admin_users.sql`
2. **เพิ่ม env บน Vercel** (Production + Preview): `ADMIN_SESSION_SECRET`, `CRON_SECRET` (ค่าอยู่ใน `.env.local` แล้ว) — ต้อง redeploy หลังเพิ่ม
3. **เปลี่ยนรหัส super admin** ผ่าน `/admin/users` (ไม่บังคับ แต่ควร)
4. ตอน deploy โดเมนจริง `landcampkhaoyai.com`: เพิ่ม domain ใน Google OAuth (Authorized JS origins) + เปลี่ยน Site URL ใน Supabase Auth

## 7. ขั้นตอนต่อไป (ตาม `docs/ROADMAP.md`)
**ROADMAP คือ source of truth** — แต่ละข้อมี ✅/☐ อัปเดตทุกครั้งที่ทำเสร็จ แล้วรายงาน owner

- **ลำดับ 1 (ความปลอดภัย):** โค้ดเสร็จหมดแล้ว เหลือ owner ทำข้อ 6 ข้างบน
- **ลำดับ 2 (ถัดไป) — แจ้งเตือน:** อีเมลยืนยัน (Resend), แจ้ง LINE กลุ่มทีมงาน, ใบเสร็จ PDF, หน้า `/verify` เช็คอิน — *ต้องมี Resend API key + LINE token/Group ID จาก owner*
- ลำดับ 3 CMS แก้เว็บเอง · 4 CRM+Walk-in backend · 5 เพิ่มรายได้ · 6 บริหารจัดการ · 7 ประสบการณ์ลูกค้า · 8 Channel Manager · 9 launch hardening

### งานที่ owner บอกว่าจะทำ UI เอง แล้วให้เราต่อ backend (อย่าไปทำ UI ทับ)
- ปรับ UI **ปฏิทินการจอง** (`/admin/calendar`) ใหม่
- ปรับ UI **หน้า login แอดมิน** (`components/admin/AdminLogin.tsx`)
- **แจ้งเตือน** + เพิ่ม **หน้าตั้งค่าแจ้งเตือนเอง** ในหลังบ้าน (ใส่ LINE token/Resend key/เปิด-ปิด event ได้เอง) — เป็นส่วนหนึ่งของลำดับ 2
- โครง UI ที่ขึ้นไว้รอ backend: `/admin/customers/[id]` (โน้ต/ประวัติติดต่อ) และ `/admin/walk-in` (ปุ่มยังเป็น stub)

## 8. กฎการทำงาน
- ทำงานบน `alpha` เท่านั้น · commit แบบ conventional (`feat(scope):`) · ลงท้าย `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- commit เมื่อ done-criteria เขียวครบ · ห้าม `--no-verify`
- ไฟล์ owner-guarded: `package.json`, config ต่างๆ, `supabase/migrations/`, `app/layout.tsx` — แก้เมื่อได้รับมอบหมายชัดเจน
- มีไฟล์ที่ owner แก้เองค้างอยู่ (uncommitted): `components/navigation/Navbar.tsx`, `components/sections/HeroSection.tsx`, `lib/scrollToSection.ts` — อย่า commit ทับ

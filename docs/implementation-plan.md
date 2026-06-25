# LandCamp Booking System — Implementation Plan

> แผนการพัฒนาทีละ Sprint สำหรับ Booking System ของ LandCamp Villa
> อ้างอิงเอกสารหลัก: [`booking-system-design.md`](./booking-system-design.md)
> วันที่: 2026-06-19

---

## โครงสร้างภาพรวม

```
Phase 0  Pre-flight       ─ 1–2 วัน  ─ เตรียมบัญชี / ตอบคำถาม / ตั้งค่า
Sprint 1 Foundation       ─ 1 สัปดาห์ ─ DB · Auth · API skeleton
Sprint 2 Booking Flow     ─ 1 สัปดาห์ ─ ลูกค้าเลือก-จอง-ล็อคห้องได้
Sprint 3 Payment +        ─ 1 สัปดาห์ ─ QR · ตรวจสลิป · Real-time room start
Sprint 4 Notifications +  ─ 1 สัปดาห์ ─ LINE · Email · ใบเสร็จ · CRM/CMS start
Sprint 5 Admin Dashboard  ─ 1 สัปดาห์ ─ หลังบ้านครบ · CMS Live Preview · Maintenance
Sprint 6 Hardening        ─ 1 สัปดาห์ ─ Security · UX polish · Launch
```

---

# 🛬 Phase 0 — Pre-flight (เริ่มที่นี่)

> ทำให้เสร็จ **ก่อนแตะโค้ด** เพื่อให้ Sprint 1 เริ่มได้ราบรื่น

## ขั้นที่ 1 — ตอบ 4 คำถามหลัก (Owner)

```
□  1.1 บัญชีรับเงิน
       ─ ใช้ PromptPay เบอร์โทร / เลขบัญชี / นิติบุคคล?
       ─ ชื่อบัญชี: _______________
       ─ ธนาคาร: _______________
       ─ เลขที่: _______________

□  1.2 มัดจำหรือชำระเต็ม
       ─ [ ] ชำระเต็ม 100% ทุกครั้ง
       ─ [ ] มีตัวเลือกมัดจำ ___% ก่อน + ที่เหลือเก็บวันเข้าพัก

□  1.3 นโยบายยกเลิก
       ─ ยกเลิก > ___ วัน  คืน ___%
       ─ ยกเลิก > ___ วัน  คืน ___%
       ─ ยกเลิก < ___ วัน  คืน ___%

□  1.4 กลุ่ม LINE ทีมงาน
       ─ [ ] ใช้กลุ่มเดิม (ชื่อ: _______________)
       ─ [ ] สร้างกลุ่มใหม่สำหรับแจ้งเตือนระบบโดยเฉพาะ
```

## ขั้นที่ 2 — สมัครและตั้งค่าบริการภายนอก

```
□  2.1 EasySlip
       https://document.easyslip.com/en/guide/getting-started
       ─ สมัครบัญชี
       ─ ผูกบัญชีรับเงินตามข้อ 1.1
       ─ เก็บ API key ใส่ใน 1Password / Notion ส่วนกลาง

□  2.2 LINE OA Channel
       https://developers.line.biz/console/
       ─ สร้าง Messaging API channel (หรือใช้ของ @landcamp เดิม)
       ─ เปิด "Allow bot to join group chats"
       ─ เพิ่มบอทเข้ากลุ่ม LINE ทีมงาน
       ─ เก็บ Channel Access Token + Channel Secret
       ─ ดึง Group ID (ส่งข้อความใดข้อความหนึ่งในกลุ่ม → webhook log)

□  2.3 Google Cloud — OAuth 2.0
       https://console.cloud.google.com/apis/credentials
       ─ สร้าง OAuth Client ID (Web application)
       ─ Authorized redirect URI:
           https://dbfufvddvqsdzwmcygkn.supabase.co/auth/v1/callback
           http://localhost:3000/auth/callback   (สำหรับ dev)
       ─ เก็บ Client ID + Client Secret

□  2.4 Resend (Email)
       https://resend.com/
       ─ สมัครบัญชี
       ─ Verify domain landcamp.com (หรือใช้ subdomain mail.landcamp.com)
       ─ ตั้งค่า DKIM, SPF records ที่ผู้ดูแล DNS
       ─ เก็บ API key

□  2.5 Vercel — Environment Variables
       ─ vercel env add SUPABASE_SERVICE_ROLE_KEY     production preview development
       ─ vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID  production preview development
       ─ vercel env add EASYSLIP_API_KEY              production preview
       ─ vercel env add EASYSLIP_BANK_ACCOUNT         production preview
       ─ vercel env add LINE_CHANNEL_ACCESS_TOKEN     production preview
       ─ vercel env add LINE_CHANNEL_SECRET           production preview
       ─ vercel env add LINE_NOTIFY_GROUP_ID          production preview
       ─ vercel env add RESEND_API_KEY                production preview
       ─ vercel env add EMAIL_FROM                    production preview development
       ─ vercel env add BOOKING_CODE_PREFIX           production preview development
```

## ขั้นที่ 3 — ตั้งค่า Local Development

```
□  3.1 ดึง env vars มาเครื่อง
       vercel env pull .env.local

□  3.2 เปิด feature branch
       git checkout -b feat/booking-system

□  3.3 ติดตั้ง dependencies ที่จะใช้ใน sprint 1
       npm install @supabase/ssr zod
       npm install -D @types/node

□  3.4 ทดสอบว่า dev server รันได้
       npm run dev
       เปิด http://localhost:3000
```

---

# 🚀 Sprint 1 — Foundation (สัปดาห์ที่ 1)

> **เป้าหมาย:** มี database schema ครบ + ระบบล็อกอินทำงาน + base API พร้อมรับ
> **Deliverable:** ลูกค้า login ด้วย Google ได้ + ดู `/account` ตัวเองได้ + endpoint สาธารณะ `/api/bookings/availability` ตอบกลับได้

## Day 1–2 · Database Schema

```
□  1.1 สร้างไฟล์ migration ใหม่
       supabase/migrations/003_booking_system.sql

□  1.2 SQL ที่ต้องเขียน (ลำดับ):
       ─ ตาราง customers
       ─ ตาราง bookings (พร้อม CHECK constraint สำหรับ status)
       ─ ตาราง payments
       ─ ตาราง notifications
       ─ ตาราง room_availability
       ─ ตาราง room_status (เฟส parallel)
       ─ ตาราง site_content (เฟส parallel)
       ─ ตาราง maintenance_requests (เฟส parallel)
       ─ ตาราง admin_audit_log
       ─ EXCLUDE constraint ป้องกัน double-booking
       ─ Indexes สำคัญ:
           bookings(customer_id, created_at desc)
           bookings(check_in, check_out)
           bookings(status, check_in)
           payments(booking_id)

□  1.3 RLS Policies ทุกตาราง:
       ─ customers: select where auth.uid() = auth_user_id
       ─ bookings:  select where customer_id = (select id from customers where auth_user_id = auth.uid())
       ─ payments:  select ผ่าน bookings policy
       ─ admin tables: ต้องอ่านได้เฉพาะมี role ใน admin_users

□  1.4 ตาราง admin_users (เพิ่มใหม่)
       admin_users (
         user_id    uuid PK FK to auth.users,
         role       text check (role in ('super_admin','reception','housekeeping')),
         is_active  boolean default true,
         created_at timestamptz
       )

□  1.5 Seed ตัวเอง 1 คนเป็น super_admin (ทำใน Supabase SQL editor)

□  1.6 Apply migration
       supabase db push    (หรือใช้ SQL editor ใน dashboard)

□  1.7 ทดสอบ:
       ─ insert test booking ผ่าน service role
       ─ ลอง insert booking ที่ overlap → ต้อง fail
       ─ ลอง insert payment ผูกกับ booking ที่ไม่มี → ต้อง fail (FK)
```

## Day 3 · Supabase Auth + Google OAuth

```
□  2.1 ใน Supabase Dashboard → Authentication → Providers
       ─ เปิด Google provider
       ─ ใส่ Client ID + Client Secret จาก Phase 0 ข้อ 2.3
       ─ Redirect URLs:
           https://landcamp-eta.vercel.app/auth/callback
           http://localhost:3000/auth/callback

□  2.2 อัปเดต lib/supabase.ts
       ─ แยกเป็น 2 client:
           lib/supabase/client.ts     ─ browser (anon key)
           lib/supabase/server.ts     ─ RSC / Route Handler (พร้อม cookies)
           lib/supabase/admin.ts      ─ service role (server-only, ใช้ใน webhook)

□  2.3 สร้าง auth callback route
       app/auth/callback/route.ts
       ─ รับ code → exchangeCodeForSession
       ─ redirect กลับไปหน้า /

□  2.4 สร้าง Trigger ใน Supabase
       เมื่อมี row ใหม่ใน auth.users → auto-insert ใน public.customers
       (sync email, full_name, google_sub, avatar_url)

□  2.5 ทดสอบ flow ล็อกอินจาก localhost:
       ─ คลิกปุ่มล็อกอิน → ไป Google consent
       ─ กลับมาเว็บ → session มี
       ─ check customers table มี row ใหม่
```

## Day 4 · Base API Skeleton

```
□  3.1 สร้างโครง API routes:
       app/api/bookings/availability/route.ts    GET
       app/api/bookings/route.ts                  POST (placeholder)
       app/api/health/route.ts                    GET

□  3.2 Zod schemas สำหรับ validation
       lib/schemas/booking.ts
         ─ CreateBookingSchema
         ─ AvailabilityQuerySchema

□  3.3 Helper utilities
       lib/booking/code.ts        ─ generateBookingCode() → LC-2026-0001
       lib/booking/availability.ts ─ checkAvailability(roomId, checkIn, checkOut)
       lib/booking/pricing.ts      ─ calculateTotal({room, nights, adults, children, extraBed})

□  3.4 Test availability endpoint
       curl 'http://localhost:3000/api/bookings/availability?roomId=...&checkIn=2026-07-01&checkOut=2026-07-03'
       ─ ต้องตอบ { available: true, totalAmount: ... }
```

## Day 5 · Customer Account Page

```
□  4.1 หน้า /account
       app/account/page.tsx
       ─ ต้อง login ก่อน (middleware หรือ server-side check)
       ─ แสดงข้อมูล: avatar, ชื่อ, อีเมล, จำนวนการจองรวม

□  4.2 หน้า /account/bookings
       app/account/bookings/page.tsx
       ─ list booking ของตัวเอง (อ่านผ่าน RLS)
       ─ แสดง booking_code, ห้อง, วันที่, สถานะ, ยอดเงิน
       ─ ลิงก์ไปหน้าใบเสร็จ /booking/[code]

□  4.3 Navbar อัปเดต
       components/navigation/Navbar.tsx
       ─ ถ้า login → แสดง avatar + dropdown (บัญชีของฉัน, ออกจากระบบ)
       ─ ถ้ายัง → แสดงปุ่ม "เข้าสู่ระบบ"
```

## Day 6 · Mirror rooms data จาก data/rooms.ts ไป DB

```
□  5.1 เขียน script seed rooms
       supabase/seed-rooms.ts
       ─ อ่าน data/rooms.ts
       ─ insert/upsert ลง rooms table
       ─ ใช้ slug เป็น unique key

□  5.2 รัน seed
       npx tsx supabase/seed-rooms.ts

□  5.3 Verify ใน Supabase dashboard
       ─ ครบ 6 rooms
       ─ slug, price, max_guests ตรงกับไฟล์
```

## Day 7 · Review + Test + Document

```
□  6.1 Manual end-to-end test
       ─ ล็อกอิน Google
       ─ ไป /account → เห็นชื่อตัวเอง
       ─ ไป /account/bookings → ว่างเปล่า (ถูกต้อง)
       ─ Hit /api/bookings/availability → ตอบ JSON ที่ถูก

□  6.2 Push branch + draft PR
       git push origin feat/booking-system
       gh pr create --draft --title "feat(booking): foundation"

□  6.3 Deploy Preview ผ่าน Vercel
       ─ ตรวจว่า env vars preview ครบ
       ─ ทดสอบ flow บน preview URL

□  6.4 Sprint 1 retrospective
       ─ อะไรเสร็จ / อะไรค้าง
       ─ ปรับ Sprint 2 ถ้าจำเป็น
```

---

# 🎯 Sprint 2 — Booking Flow (สัปดาห์ที่ 2)

> **เป้าหมาย:** ลูกค้าจองห้องจากเว็บได้ ระบบล็อคห้อง 15 นาที พร้อมรอชำระ
> **Deliverable:** กดปุ่ม "จอง" ใน RoomsSection → modal เปิด → จองสำเร็จ → ได้ booking_code

```
Day 1–2 · BookingModal UI
   ─ components/booking/BookingModal.tsx
   ─ components/booking/DateRangePicker.tsx
   ─ components/booking/GuestCounter.tsx
   ─ ใช้ shadcn/ui Dialog (ติดตั้งใหม่)

Day 3 · Availability + Pricing Logic
   ─ Hook useAvailability(roomId, dateRange)
   ─ Hook usePricing(room, nights, adults, children, extraBed)
   ─ แสดงราคาเรียลไทม์ขณะลูกค้าเปลี่ยน input

Day 4 · Booking Hold (กันชน)
   ─ Cron job clear expired bookings every 5 min
       app/api/cron/clear-expired-bookings/route.ts
       vercel.ts → crons config
   ─ POST /api/bookings → create with status=pending_payment, hold 15 min

Day 5 · เชื่อม RoomsSection
   ─ เปลี่ยนปุ่ม "จองผ่าน LINE" → "จองออนไลน์"
   ─ Open BookingModal + ส่ง room object

Day 6 · Google Sign-in flow ภายใน Modal
   ─ ถ้ายังไม่ login → ขั้น sign-in inline
   ─ Post-login → กลับมาที่ขั้นกรอกข้อมูล

Day 7 · Test + Polish
   ─ E2E: เลือกห้อง → จอง → booking_code ปรากฏ
   ─ Mobile responsive check
   ─ Edge cases (วันที่ในอดีต, จำนวนคนเกิน maxGuests)
```

---

# 💰 Sprint 3 — Payment + Real-time Room Start (สัปดาห์ที่ 3)

> **เป้าหมาย:** ชำระผ่าน QR + ตรวจสลิปอัตโนมัติ + admin เห็นสถานะห้อง

```
QR Generation
   ─ app/api/payments/qr/route.ts
   ─ เรียก EasySlip → ได้ QR base64
   ─ บันทึก qr_payload + qr_expires_at

Slip Upload + Verify
   ─ app/api/payments/slip/route.ts
   ─ Multipart upload ไป Supabase Storage
   ─ เรียก EasySlip verify
   ─ เช็ค amount + slip_ref + time window
   ─ Update booking.status = 'confirmed' หรือ 'payment_review'

Receipt + QR หน้าจอ (ทันที)
   ─ components/booking/BookingConfirmation.tsx
   ─ components/receipt/ReceiptCard.tsx
   ─ QR token แบบ JWT signed + DB lookup

Real-time Room Status (parallel start)
   ─ Supabase Realtime subscription หน้า /admin/rooms (skeleton)
   ─ ตาราง room_status พร้อมใช้แล้ว
```

---

# 📬 Sprint 4 — Notifications + Receipt + CRM/CMS Start (สัปดาห์ที่ 4)

```
LINE OA
   ─ lib/notify/line.ts → pushFlexMessage(groupId, payload)
   ─ Event handlers: booking_created, payment_confirmed, slip_review

Email (Resend)
   ─ lib/notify/email.ts → sendReceipt({to, booking, pdfBuffer})
   ─ PDF: components/receipt/ReceiptPdf.tsx ใช้ @react-pdf/renderer

Verify page พนักงาน
   ─ app/verify/[token]/page.tsx
   ─ สแกน QR → เปิดหน้านี้ → ปุ่ม "Confirm Check-in"

CRM start
   ─ app/admin/customers/page.tsx (list view)

CMS start
   ─ app/admin/content/page.tsx (list view)
   ─ site_content table พร้อม
```

---

# 📊 Sprint 5 — Admin Dashboard ครบ + ฟีเจอร์ Parallel จบ (สัปดาห์ที่ 5)

```
Overview
   ─ app/admin/page.tsx
   ─ KPI cards, charts, recent bookings table

Bookings management
   ─ app/admin/bookings/page.tsx + [id]/page.tsx
   ─ Filter, search, status update, manual confirm

Revenue report
   ─ app/admin/revenue/page.tsx
   ─ Export CSV + PDF

CMS Live Preview
   ─ TipTap editor
   ─ Draft Mode + live preview
   ─ Revision history

Maintenance
   ─ app/admin/maintenance/page.tsx
   ─ Create / assign / status update
   ─ LINE notify ทีมช่าง
```

---

# 🛡️ Sprint 6 — Hardening + Launch (สัปดาห์ที่ 6)

```
Security pass
   ─ Rate limit (Upstash Redis หรือ in-memory)
   ─ Vercel BotID บนปุ่ม "ยืนยันการจอง"
   ─ Audit log ทุก admin action
   ─ Security review (security-review skill)

UX polish
   ─ Loading states, error messages, empty states
   ─ Mobile responsive ทุกหน้า
   ─ Accessibility check

Cancellation flow
   ─ Auto-refund calculation
   ─ Admin approve refund

Email reminders
   ─ Cron: 3 วันก่อน check-in → ส่งวิธีเดินทาง
   ─ Cron: 1 วันหลัง check-out → ขอรีวิว

Launch
   ─ Production deploy
   ─ Smoke test บน production
   ─ Document handover ทีมงาน
```

---

# 📌 เริ่มลงมือ — Action Items วันนี้

```
□  1. ส่ง 4 คำถามใน Phase 0 ขั้น 1 ให้ Owner ตอบ (ผ่าน LINE / ประชุม)
□  2. ขณะรอคำตอบ → สมัคร EasySlip + Resend (ไม่ต้องรอ Owner)
□  3. สร้าง Google OAuth Client (มี Supabase callback URL อยู่แล้ว)
□  4. เปิด feature branch `feat/booking-system`
□  5. เริ่ม draft migration 003_booking_system.sql
```

> ทันทีที่ Owner ตอบคำถาม 1.1 และ 2.2 → เปิด LINE OA channel + ขอ Group ID ได้เลย จากนั้นเริ่ม Sprint 1 Day 1 ได้ตามตาราง

---

# 🎯 Definition of Done สำหรับแต่ละ Sprint

ทุก Sprint ต้องผ่านทั้ง 4 ข้อนี้ถึงจะถือว่าเสร็จ:

```
[✓] Code merged → main (ผ่าน PR review)
[✓] Preview deploy บน Vercel ทำงานครบ flow
[✓] Manual test รอบ end-to-end ผ่าน
[✓] เอกสาร / README ส่วนใหม่ที่เพิ่ม update แล้ว
```

---

**Next Step:** ตอบ 4 คำถามใน Phase 0 → เริ่ม Pre-flight checklist

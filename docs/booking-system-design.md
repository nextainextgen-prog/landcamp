# LandCamp Villa — Booking & Backend System Design

> เอกสารออกแบบระบบ **ระบบจองออนไลน์ + หลังบ้าน + ฟีเจอร์ขยายทำพร้อมกัน** สำหรับ LandCamp Villa Khao Yai
> สถานะ: **Draft** — รอ Owner ตรวจสอบก่อน finalize flow
> วันที่: 2026-06-18

---

## 1. เป้าหมายโปรเจกต์

ย้ายช่องทางจองจาก **LINE-only → Web-first booking** โดยที่:

- ลูกค้าจองที่พักผ่านเว็บได้ในไม่กี่คลิก (ล็อกอินด้วย Google → กรอกข้อมูล → ชำระ QR → อัปโหลดสลิป)
- ตรวจสลิปอัตโนมัติด้วย EasySlip API (กันสลิปปลอม / ใช้ซ้ำ)
- ออกใบเสร็จ + QR Code **ทันทีบนหน้าจอ** ให้ลูกค้าใช้ยืนยันกับพนักงานวันเข้าพัก (อีเมลเป็นสำเนาเก็บไว้)
- แจ้งเตือนทีมงานผ่าน **LINE กลุ่ม** + Dashboard แบบเรียลไทม์
- ทีมมี Dashboard ดูรายได้ + ภาพรวมการจอง + สถานะห้องเรียลไทม์ + CRM ลูกค้า + CMS เนื้อหาเว็บ

**Non-goals:** Channel manager / OTA sync, multi-property, mobile app

---

## 2. Tech Stack

| Layer | Technology | เหตุผล |
|---|---|---|
| Frontend | **Next.js 16 App Router** (เดิม) | ใช้โครงสร้างปัจจุบัน เพิ่ม route ใหม่ |
| UI | Tailwind + โทนเดิม (warm-clay) | คงเอกลักษณ์แบรนด์ |
| Auth | **Supabase Auth + Google OAuth** | ลูกค้า login ด้วย Google ก่อนจอง |
| Database | **Supabase Postgres** (มีอยู่แล้ว) | ใช้ instance เดิม `dbfufvddvqsdzwmcygkn` |
| Storage | **Supabase Storage** | เก็บสลิป + ใบเสร็จ PDF |
| Realtime | Supabase Realtime | Admin dashboard + สถานะห้องเรียลไทม์ |
| Payment | **EasySlip API** | QR generate + Slip verify |
| Notification | **LINE Messaging API** (LINE OA) | แจ้งทีมงานในกลุ่ม |
| Email | **Resend** | ส่งสำเนาใบเสร็จให้ลูกค้า |
| Hosting | **Vercel** (เดิม) | Fluid Compute รองรับ Node.js + webhook |

---

## 3. User Flow

### 3.1 Customer Booking Flow

```
1. ลูกค้ากด "จอง" ที่ RoomsSection (หน้าเดิม)
   ↓
2. Popup เปิดขึ้น → เลือกวันเข้า/ออก + จำนวนผู้เข้าพัก
   ↓
3. ระบบเช็ค availability (real-time จาก DB)
   ↓
4. ถ้ายังไม่ login → ขอ Google Sign-in
   ↓
5. กรอกข้อมูล: ชื่อผู้จอง (auto-fill จาก Google), เบอร์โทร, จำนวนผู้ใหญ่/เด็ก
   ↓
6. สรุปยอด → กด "ชำระเงิน" → ระบบล็อคห้อง 15 นาที
   ↓
7. แสดง QR code (EasySlip) + ปุ่มอัปโหลดสลิป
   ↓
8. ลูกค้าโอน + อัปโหลดสลิป
   ↓
9. ระบบเรียก EasySlip Verify → เช็ค amount + receiver + ref
   ↓
✅ ถ้าผ่าน → การจองสำเร็จ
   ├─ แสดงใบเสร็จ + QR Code "ทันที" บนหน้าจอ (ลูกค้า screenshot ไว้ใช้เลย)
   ├─ ส่งแจ้งเตือนเข้า LINE กลุ่มทีมงาน + Dashboard
   └─ ส่งสำเนาใบเสร็จไปอีเมล (backup)

❌ ถ้าไม่ผ่าน → status = payment_review
   └─ แจ้งทีมงานใน LINE ให้ตรวจมือ
```

### 3.2 Staff Verification Flow (กันโกง)

```
ลูกค้า check-in → โชว์ใบเสร็จดิจิทัล (มี QR)
   ↓
พนักงานสแกน QR ด้วยมือถือ
   ↓
เปิดหน้า /verify/{booking_token} (auth-protected)
   ↓
แสดง: ชื่อ · วันที่ · ห้อง · สถานะชำระเงิน · รูปลูกค้า (จาก Google)
   ↓
พนักงานกด "Confirm Check-in" → อัปเดต status
```

QR token ใช้ **signed JWT** + DB lookup เพื่อกันคนปลอมใบเสร็จ

---

## 4. Database Schema (Supabase)

> เพิ่มเติมจาก schema เดิม (`001_init.sql`) — สร้าง migration `003_booking_system.sql`

### 4.1 ตารางหลัก

```sql
-- ลูกค้า (sync จาก Google OAuth)
customers (
  id              uuid PK,
  auth_user_id    uuid -- FK to auth.users
  email           text unique not null,
  full_name       text not null,
  phone           text,
  avatar_url      text,
  google_sub      text unique,
  total_bookings  int default 0,
  total_spent     int default 0,
  created_at      timestamptz,
  updated_at      timestamptz
)

-- การจอง
bookings (
  id              uuid PK,
  booking_code    text unique  -- เช่น LC-2026-0001 (เลขสวยให้ลูกค้าจำง่าย)
  customer_id     uuid FK,
  room_id         uuid FK,
  check_in        date not null,
  check_out       date not null,
  nights          int generated,
  adults          int not null,
  children        int default 0,
  total_amount    int not null,
  room_amount     int not null,
  extra_bed_fee   int default 0,
  discount        int default 0,
  status          text check (status in (
                    'pending_payment',  -- รอชำระ
                    'payment_review',   -- มีสลิปแล้ว รอตรวจมือ
                    'confirmed',        -- ชำระสำเร็จ
                    'checked_in',
                    'checked_out',
                    'cancelled',
                    'no_show'
                  )),
  verify_token    text unique,   -- ใช้สร้าง QR บนใบเสร็จ
  guest_name      text not null,
  guest_phone     text not null,
  notes           text,
  source          text default 'website',
  created_at      timestamptz,
  confirmed_at    timestamptz,
  cancelled_at    timestamptz
)

-- การชำระเงิน
payments (
  id              uuid PK,
  booking_id      uuid FK,
  amount          int not null,
  method          text default 'qr_promptpay',
  qr_payload      text,             -- payload จาก EasySlip
  qr_expires_at   timestamptz,
  slip_url        text,             -- path ใน Supabase Storage
  slip_verified   boolean default false,
  easyslip_data   jsonb,            -- response จาก EasySlip verify API
  verified_at     timestamptz,
  verified_by     text,             -- 'auto' | admin_user_id
  reference_id    text,             -- transaction ID จากธนาคาร
  created_at      timestamptz
)

-- Log การแจ้งเตือน
notifications (
  id          uuid PK,
  channel     text,  -- 'line' | 'email'
  event       text,  -- 'booking_created' | 'payment_confirmed' | ...
  recipient   text,
  payload     jsonb,
  status      text,  -- 'sent' | 'failed' | 'pending'
  error       text,
  sent_at     timestamptz,
  created_at  timestamptz
)

-- ป้องกัน double-booking
room_availability (
  room_id     uuid,
  date        date,
  booking_id  uuid,
  PRIMARY KEY (room_id, date)
)
```

### 4.2 ตารางเสริมสำหรับฟีเจอร์ทำพร้อมกัน

```sql
-- สถานะห้องเรียลไทม์
room_status (
  room_id          uuid PK,
  state            text check (state in (
                     'vacant_clean','vacant_dirty',
                     'occupied','cleaning','maintenance'
                   )),
  current_booking  uuid FK nullable,
  last_changed_at  timestamptz,
  changed_by       uuid -- admin_user
)

-- CMS เนื้อหาเว็บ
site_content (
  id           uuid PK,
  slug         text unique,        -- room-villa-1, page-about, ...
  type         text,               -- room | page | menu | seo
  data         jsonb,              -- เนื้อหาเต็ม
  published    boolean default false,
  draft        jsonb,              -- เวอร์ชันที่ยังไม่ publish
  version      int,
  updated_at   timestamptz,
  updated_by   uuid
)

-- แจ้งซ่อม
maintenance_requests (
  id           uuid PK,
  room_id      uuid FK,
  title        text,
  description  text,
  photos       text[],             -- URLs ใน Supabase Storage
  status       text check (status in ('open','in_progress','done','cancelled')),
  priority     text default 'normal',
  assigned_to  uuid nullable,
  reported_by  uuid,
  due_date     date,
  created_at   timestamptz,
  resolved_at  timestamptz
)

-- Audit log
admin_audit_log (
  id          uuid PK,
  user_id     uuid,
  action      text,
  target      text,                -- 'booking:LC-2026-0001'
  before      jsonb,
  after       jsonb,
  ip          inet,
  created_at  timestamptz
)
```

### 4.3 Constraint สำคัญ

- **EXCLUDE constraint** กันการจองทับ:
  ```sql
  ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
      room_id WITH =,
      daterange(check_in, check_out, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'no_show'));
  ```
- **RLS policies:** ลูกค้าเห็นเฉพาะ booking ตัวเอง, admin เห็นทั้งหมด, service role bypass

---

## 5. API Endpoints (Next.js App Router)

```
app/api/
├── bookings/
│   ├── route.ts                  POST   สร้าง booking ใหม่ (status: pending_payment)
│   ├── [id]/route.ts             GET    ดูรายละเอียด booking
│   ├── [id]/cancel/route.ts      POST   ยกเลิก
│   └── availability/route.ts     GET    เช็คห้องว่างในช่วงเวลา
│
├── payments/
│   ├── qr/route.ts               POST   ขอ QR code จาก EasySlip
│   ├── slip/route.ts             POST   อัปโหลด + verify สลิป
│   └── webhook/route.ts          POST   รับ webhook EasySlip
│
├── verify/
│   └── [token]/route.ts          GET    สำหรับพนักงานสแกน QR ใบเสร็จ
│
├── line/
│   └── webhook/route.ts          POST   LINE OA webhook (ถ้าให้ถามบอทได้)
│
└── admin/
    ├── bookings/route.ts         GET    list + filter
    ├── revenue/route.ts          GET    สรุปรายได้
    ├── rooms/route.ts            GET    สถานะห้องเรียลไทม์
    ├── customers/route.ts        GET    CRM ลูกค้า
    ├── content/route.ts          GET/PUT CMS
    ├── maintenance/route.ts      GET/POST แจ้งซ่อม
    └── stats/route.ts            GET    ภาพรวม dashboard
```

---

## 6. Integration Details

### 6.1 EasySlip API

**QR Generation** (`POST /api/payments/qr`)
- Input: `booking_id`, `amount`
- Call: `POST https://api.easyslip.com/v1/qr/generate`
- บันทึก `qr_payload` + `qr_expires_at` (15 นาที) ใน `payments` table
- Return: QR image base64 → frontend render

**Slip Verification** (`POST /api/payments/slip`)
- รับไฟล์สลิปจาก client (multipart)
- Upload ไป Supabase Storage bucket `payment-slips/`
- Call: EasySlip verify API ด้วยรูปที่เพิ่งอัปโหลด
- เช็ค 3 อย่าง:
  1. `amount` ตรงกับยอดที่ต้องชำระ (±0 บาท)
  2. `receiver_account` ตรงกับบัญชี LandCamp
  3. `slip_ref` ยังไม่เคยใช้ (กันการใช้สลิปซ้ำ — เก็บ unique constraint)
- ถ้าผ่าน → update `booking.status = 'confirmed'`, fire notification
- ถ้าไม่ผ่าน → `payment_review` ให้แอดมินเช็คมือ + แจ้ง LINE

**กันโกง:**
- เก็บ `slip_ref` (transaction ID) เป็น unique → ใช้สลิปเดียวกันซ้ำไม่ได้
- เช็คเวลาในสลิป ต้องอยู่ในช่วง 24 ชม. ล่าสุด
- amount match แบบ exact (±0 บาท)

### 6.2 LINE OA Messaging

**Event ที่จะแจ้ง LINE กลุ่มทีมงาน:**

| Event | ข้อความ |
|---|---|
| จองใหม่ (pending) | `จองใหม่ #LC-2026-0001\nคุณ [ชื่อ] · [ห้อง]\n[เช็คอิน] → [เช็คเอาท์]\nยอด: ฿X,XXX` |
| ชำระเงินสำเร็จ | `ชำระเงินสำเร็จ #LC-2026-0001\nยอด ฿X,XXX · [เวลา]\nดูรายละเอียด: [URL]` |
| สลิป verify ไม่ผ่าน | `สลิปต้องตรวจสอบ #LC-2026-0001\n[เหตุผล] · ตรวจที่: [URL]` |
| ใกล้ check-in (1 วันก่อน) | `พรุ่งนี้ check-in: คุณ [ชื่อ] · [ห้อง]` |
| แจ้งซ่อม (Phase parallel) | `แจ้งซ่อมใหม่: [ห้อง] · [หัวข้อ] · มอบหมาย: [ช่าง]` |

**Implementation:**
- ใช้ LINE Messaging API + Push Message
- เก็บ `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_NOTIFY_GROUP_ID` ใน env
- ส่งเป็น **Flex Message** ให้สวย ดูข้อมูลครบ มีปุ่ม "ดูรายละเอียด"
- Log ทุกการส่งใน `notifications` table

### 6.3 Email (Resend)

- Template: ไทย default + EN ถ้าลูกค้าเลือก
- Attachment: ใบเสร็จ PDF (สร้างด้วย `@react-pdf/renderer`)
- เนื้อหา:
  - สรุปการจอง
  - QR Code (สำเนาของที่แสดงบนหน้าจอ)
  - เบอร์ติดต่อ + แผนที่
  - นโยบายการยกเลิก

> **สำคัญ:** อีเมลเป็น **backup เก็บไว้** ลูกค้าได้ใบเสร็จ + QR ตัวจริงตั้งแต่บนหน้าจอแล้ว ไม่ต้องรออีเมลก่อน check-in

---

## 7. Frontend Changes (กระทบเว็บเดิมน้อยที่สุด)

### 7.1 ของใหม่ที่ต้องเพิ่ม

```
components/
├── booking/
│   ├── BookingModal.tsx          ← Popup หลัก (overlay บนหน้าปัจจุบัน)
│   ├── DateRangePicker.tsx       ← เลือกวันที่
│   ├── GuestCounter.tsx          ← จำนวนผู้ใหญ่/เด็ก
│   ├── GoogleSignInButton.tsx
│   ├── PaymentQR.tsx             ← แสดง QR + countdown 15 นาที
│   ├── SlipUploader.tsx          ← drag & drop สลิป
│   └── BookingConfirmation.tsx   ← หน้ายืนยัน (มี QR + ใบเสร็จทันที)
│
└── receipt/
    ├── ReceiptCard.tsx           ← UI ใบเสร็จในเว็บ
    └── ReceiptPdf.tsx            ← Template PDF

app/
├── booking/
│   ├── [code]/page.tsx           ← หน้าใบเสร็จลูกค้า (เปิดซ้ำได้ทุกเวลา)
│   └── success/page.tsx          ← หลังชำระสำเร็จ
│
├── verify/
│   └── [token]/page.tsx          ← หน้าพนักงานสแกน
│
└── account/
    └── bookings/page.tsx         ← ประวัติการจองของลูกค้า
```

### 7.2 ของเดิมที่แก้

- `RoomsSection.tsx` → เปลี่ยนปุ่ม "จองผ่าน LINE" เป็น "จองออนไลน์" ที่เปิด `BookingModal`
- `siteConfig.ts` → เพิ่ม `payment.bankAccount`, `policy.cancellation`
- `Navbar.tsx` → เพิ่มเมนู "บัญชีของฉัน" เมื่อ login แล้ว

---

## 8. Admin Dashboard

URL: `/admin/*` — ล็อคด้วย Supabase Auth + role check (3 roles)

```
app/admin/
├── layout.tsx                    ← Auth guard + sidebar
├── page.tsx                      ← Overview
├── bookings/
│   ├── page.tsx                  ← รายการจอง + filter
│   └── [id]/page.tsx             ← รายละเอียด + actions
├── payments/page.tsx             ← รายได้ + slip review
├── revenue/page.tsx              ← Report ส่งออก CSV/PDF
├── customers/page.tsx            ← CRM ลูกค้า + ประวัติ
├── rooms/page.tsx                ← สถานะห้องเรียลไทม์
├── content/
│   ├── page.tsx                  ← CMS · Live Preview
│   └── [slug]/page.tsx           ← แก้บทความ + SEO
└── settings/page.tsx             ← Users · Roles · Audit log
```

### 8.1 Role-based Access

| Role | สิทธิ์ |
|---|---|
| **Super Admin** (เจ้าของ) | เข้าได้ทุกหน้า · จัดการ users · ตั้งค่าระบบ · ดู audit log ทุกการกระทำ |
| **Reception** (ฝ่ายต้อนรับ) | ดู/จัดการการจอง · ตรวจสลิป · ออกใบเสร็จ · ดูรายได้ · CRM ลูกค้า |
| **Housekeeping** (แม่บ้าน) | ดูสถานะห้อง · check-in/out · อัปเดต cleaning status · แจ้งซ่อม |

### 8.2 หน้า Overview (Dashboard หลัก)

**KPI Cards:** รายได้วันนี้ / การจองใหม่ / เช็คอินคืนนี้ / รอตรวจสลิป
**Charts:** รายได้ 14 วันย้อนหลัง · การจองแยกตามห้อง · ที่มาของการจอง
**Tables:** การจองล่าสุด · งานที่ต้องดูด่วน (สลิปไม่ผ่าน, ใกล้ check-in)

### 8.3 หน้า Revenue / รายงานการเงิน

- กรองตามช่วงเวลา (วัน/เดือน/ปี)
- Export CSV / PDF
- แยกตาม: ห้อง · ช่องทาง · สถานะ
- ยอดรวม + เฉลี่ยต่อคืน (ADR) + RevPAR

---

## 9. Security & Privacy

| Layer | Mitigation |
|---|---|
| Auth | Supabase Auth + Google OAuth, JWT ผ่าน httpOnly cookie |
| API | Server-only env vars (`EASYSLIP_API_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`) |
| Database | RLS policies ทุก table, service role ใช้เฉพาะ server |
| Slip upload | Validate MIME + size (max 5MB), virus scan optional |
| Anti-fraud | Unique slip ref, amount match, time window check |
| Receipt QR | Signed token (JWT) + DB validation |
| Rate limit | Booking endpoint: 5 reqs/min/IP |
| Bot protection | Vercel BotID บนปุ่ม "ยืนยันการจอง" |
| Audit log | ทุก admin action log ใน `admin_audit_log` table |

---

## 10. Environment Variables (เพิ่มใหม่)

```bash
# Supabase (มีอยู่แล้ว — เพิ่ม service role)
SUPABASE_SERVICE_ROLE_KEY=...

# Google OAuth (ตั้งใน Supabase Auth dashboard)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# EasySlip
EASYSLIP_API_KEY=...
EASYSLIP_BANK_ACCOUNT=...      # บัญชีรับเงิน
EASYSLIP_BANK_CODE=...

# LINE OA
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
LINE_NOTIFY_GROUP_ID=...        # group ID ของกลุ่มทีมงาน

# Email
RESEND_API_KEY=...
EMAIL_FROM=booking@landcamp.com

# App
NEXT_PUBLIC_APP_URL=https://landcamp-eta.vercel.app
BOOKING_CODE_PREFIX=LC          # LC-2026-0001
```

---

## 11. ฟีเจอร์ขยาย — ทำพร้อมกันในเฟสนี้

> เดิมตั้งใจไว้เป็น Phase 2 แต่ตัดสินใจทำพร้อมกันเลย เพื่อให้ระบบหลังบ้านครบสมบูรณ์ตั้งแต่วันเปิดใช้

### 11.1 Real-time Room Status
- ตาราง `room_status` + Supabase Realtime subscription
- หน้า `/admin/rooms` แสดงสถานะห้องทุกหลังแบบ live
- ปุ่ม check-in / check-out ที่ admin กดได้
- แสดง: ห้องว่าง-สะอาด · ห้องว่าง-รอทำความสะอาด · ลูกค้าเข้าพัก · กำลังทำความสะอาด · ปิดซ่อม

### 11.2 CMS + Live Preview
- ตาราง `site_content` — เก็บ content ที่แก้ได้บ่อย
- หน้า `/admin/content` ใช้ TipTap หรือ MDX editor
- Live preview ผ่าน Next.js Draft Mode
- รองรับ:
  - แก้ description ห้อง + ราคา + รูป
  - แก้บทความ SEO (title, description, keywords)
  - แก้เมนูอาหาร
  - เพิ่มห้องใหม่
- Revision history (เก็บเวอร์ชันเก่า rollback ได้)

### 11.3 Guest CRM
- `/admin/customers` — list ลูกค้าทั้งหมด
- ดูประวัติการจอง, ยอดใช้จ่ายรวม, ครั้งล่าสุด
- Segment: VIP / Returning / New
- ส่งโปรโมชั่นเฉพาะกลุ่มในอนาคต

### 11.4 Maintenance Tickets
- `maintenance_requests` table
- พนักงาน/แม่บ้านแจ้งซ่อมผ่านหน้าแอดมิน
- Status: open / in-progress / done
- มอบหมายช่าง + due date
- แจ้งเตือน LINE กลุ่มทีมช่าง

---

## 12. ไอเดียเสริมจากผม (Recommend)

### ทำตั้งแต่เฟสนี้

1. **Booking Hold (15 นาที)**
   - กดจอง → ห้องถูก reserve 15 นาที ระหว่างชำระเงิน
   - กันคน 2 คนกดจองห้องเดียวกันพร้อมกัน
   - cron clean ทุก 5 นาที

2. **Booking Code สวยๆ**
   - `LC-2026-0001` แทน UUID ยาวๆ — ลูกค้าจำง่าย, ทีมงานพูดคุยกันสะดวก

3. **ใบเสร็จ + QR แสดงทันทีบนหน้าจอ**
   - ลูกค้าจองเสร็จ → เห็นใบเสร็จกับ QR ทันที screenshot ไว้ใช้ได้เลย
   - ไม่ต้องรออีเมล (อีเมลส่งเป็นสำเนา backup)

4. **Cancellation Policy แบบ Automate**
   - ยกเลิก > 7 วัน = คืน 100%
   - 3-7 วัน = คืน 50%
   - < 3 วัน = ไม่คืน
   - คำนวณยอดคืนอัตโนมัติ + แจ้ง admin

5. **Email Reminder (Auto)**
   - 3 วันก่อน check-in → ส่งวิธีเดินทาง + แผนที่
   - หลัง check-out 1 วัน → ขอรีวิว + ลิงก์ Google Reviews

6. **Multi-language Receipt**
   - ดูจาก locale ลูกค้า → ออกใบเสร็จไทย/อังกฤษ

7. **Idempotency Key**
   - ทุก POST booking มี idempotency key
   - กดซ้ำไม่สร้าง booking ซ้ำ

### น่าเพิ่มถ้ามีเวลา

8. **Discount Code System** — `WEEKEND10`, `LONGSTAY15`
9. **Group Booking** — จองหลายห้องในครั้งเดียว (สำหรับครอบครัวใหญ่ / งานแต่ง)
10. **Walk-in Mode สำหรับ Admin** — แอดมินสร้าง booking ให้ลูกค้าที่โทรมาจองได้
11. **Refund Tracker** — บันทึกการคืนเงินใน `payments` (`type: refund`)
12. **iCal Export** — ลูกค้าเพิ่มการจองเข้าปฏิทินตัวเองได้

### ยังไม่ทำในเฟสนี้

- Mobile app — PWA ก็พอ
- Loyalty / points system — รอ data พอก่อน
- AI chatbot ตอบลูกค้า — ใช้ LINE OA ตอบเองได้ก่อน
- Multi-currency — ยังไม่จำเป็น
- Channel manager / OTA sync

---

## 13. Timeline — 1 สัปดาห์ต่อ Sprint × 6 สัปดาห์

| Sprint | สโคป | Deliverable |
|---|---|---|
| **W1 · Foundation** | DB schema + migration, Supabase Auth + Google, base API | ฐาน + ล็อกอินใช้งานได้ |
| **W2 · Booking Flow** | BookingModal + availability check + booking record + booking hold | ลูกค้าจองและล็อคห้องได้ |
| **W3 · Payment + Parallel features start** | EasySlip QR + slip upload + verify · Room status realtime เริ่ม | จองและจ่ายผ่าน QR ได้ + admin เห็นสถานะห้อง |
| **W4 · Notifications + Receipt + Parallel** | LINE OA + Email + Receipt PDF + QR ทันทีบนหน้าจอ · CRM + CMS เริ่ม | flow ครบ ลูกค้าได้ใบเสร็จทันที |
| **W5 · Admin Dashboard + Parallel finish** | Overview + bookings list + revenue report · CMS + maintenance เสร็จ | หลังบ้านครบทุกฟังก์ชัน |
| **W6 · Hardening + Launch** | Anti-fraud, rate limit, audit log, testing, ขัด UX | พร้อมเปิดใช้จริง |

**รวม: 6 สัปดาห์** — รวมฟีเจอร์ขยายทำพร้อมกัน (สถานะห้องเรียลไทม์ + CMS + CRM + แจ้งซ่อม)

---

## 14. Open Questions รอ Owner ตัดสินใจ

ก่อนเริ่ม Sprint 1 ขอให้ Owner ตอบคำถามนี้ก่อน:

1. **บัญชีรับเงิน** — ใช้บัญชีไหน? PromptPay เบอร์โทร / เลขบัญชี / นิติบุคคล?
2. **ใบกำกับภาษี** — ต้องการระบบออก e-Tax Invoice ด้วยมั้ย?
3. **มัดจำ vs ชำระเต็ม** — ลูกค้าจ่ายเต็ม 100% ทุกครั้ง หรือมีตัวเลือกมัดจำ 50%?
4. **นโยบายยกเลิก** — % คืนเงินตามจำนวนวันก่อน check-in คือเท่าไหร่?
5. **LINE OA** — ใช้ account เดิมที่มีอยู่ (`@landcamp`) หรือสร้างใหม่สำหรับแจ้งเตือน?
6. **LINE Group** — มีกลุ่มทีมงานอยู่แล้วใช่มั้ย? ต้องเพิ่มบอทเข้ากลุ่ม
7. **Admin มีกี่คน** — ใครเป็น Super Admin / Reception / Housekeeping?
8. **เด็ก 12+ คิด 700** — ดึงเข้าระบบคำนวณอัตโนมัติเลยไหม?
9. **อาหารเช้า** — รวมในยอดอยู่แล้ว หรือเป็น add-on?
10. **Currency** — รับเฉพาะ THB หรือต้องการให้ลูกค้าต่างชาติเห็นราคา USD/CNY ด้วย?

---

## 15. สิ่งที่ต้องทำหลัง Owner approve

- [ ] วาด **Sequence Diagram** ของ booking flow แบบละเอียด ✅ (อยู่ในไฟล์สไลด์ presentation)
- [ ] วาด **Wireframe** ของ BookingModal + Admin Dashboard ✅ (อยู่ในไฟล์สไลด์ presentation)
- [ ] เขียน **SQL migration** `003_booking_system.sql`
- [ ] ตั้ง **Supabase Auth + Google OAuth** ใน dashboard
- [ ] สมัคร / ตรวจสอบบัญชี **EasySlip API**
- [ ] เตรียม **LINE OA Channel** + เพิ่มบอทเข้ากลุ่ม
- [ ] ออกแบบ **Receipt PDF template** ให้ Owner approve
- [ ] กำหนด **branding ข้อความ** LINE notifications

---

**Next Step:** Owner ตรวจสอบเอกสารนี้ + ตอบคำถาม section 14 → เริ่ม Sprint 1 ตามตาราง

**ดูภาพรวมแบบสไลด์:** เปิดไฟล์ `docs/booking-system-presentation.html` ในเบราว์เซอร์ (เลื่อนซ้ายขวา 20 สไลด์)

# แผนงาน: หน้าลูกค้า /admin/customers + เก็บชื่อ/เบอร์ลูกค้า (Profile Completion)

> สถานะ: **PLAN ONLY** — ยังไม่แตะโค้ด รอ review ก่อน
> วันที่: 2026-06-25
> Target branch: `alpha`

---

## 1. บทวิเคราะห์ — ทำไมหน้าลูกค้าถึงโล่ง

หน้า `/admin/customers` แสดงผล **ถูกต้องแล้ว** มันโล่งเพราะ **ข้อมูลต้นทางว่าง** ไม่ใช่บั๊กที่ฝั่ง admin

ลูกค้าเกิดได้ 2 ทาง:

| ทางเข้า | ได้อะไร | เบอร์โทร |
|---|---|---|
| Login LINE / Google OAuth | ชื่อ + email + avatar จากโปรไฟล์ OAuth | ❌ ไม่เคยเก็บ |
| Walk-in (admin กรอกเอง) | name + phone + email ครบ | ✅ |

- คอลัมน์ `customers.phone` มีอยู่ในตาราง (migration `004_booking_system.sql:25-52`) แต่ public booking flow ไม่เคยถามเบอร์
- `lib/schemas/booking.ts` (CreateBookingSchema) รับแค่ `roomId/dates/guests/extraBed/notes` — **ไม่มี name/phone/email**
- `app/api/bookings/route.ts:53-57` ดึง identity จาก `getCustomerSession()` ล้วนๆ

**สรุป:** ต้องแก้ที่ "ทางเข้าข้อมูล" ก่อน — เพิ่มขั้นเก็บชื่อ+เบอร์หลัง OAuth (ตามที่เลือก) แล้วหน้า admin จะมีข้อมูลให้แสดงเอง

---

## 2. สิ่งที่มีอยู่แล้ว (ไม่ต้องสร้างใหม่)

หน้า detail `app/admin/customers/[id]/` ทำไว้ดีอยู่แล้ว:
- StatCards (ยอดจอง / ยอดใช้จ่าย / email / phone)
- ประวัติการจอง + status badge
- CRM: VIP toggle, Tags, Notes, Communications log (โทร/email/line/chat)
- API ครบ: `PATCH /api/admin/customers/[id]`, `notes`, `contacts`

ตาราง DB ที่มีแล้ว: `customers` (+ CRM fields จาก `012_crm_walkin.sql`: `is_vip`, `tags`, `source`), `customer_notes`, `customer_contacts`

---

## 3. PART A — Profile Completion หลัง OAuth (หัวใจของงาน)

แนวทาง: **คงระบบ OAuth (LINE/Google) ไว้** แล้วเพิ่มขั้น "เติมโปรไฟล์" บังคับกรอก ชื่อ + เบอร์ ก่อนจองครั้งแรก

### A.1 Database (⚠ owner-guarded — owner ต้องรัน migration เอง)

สร้าง migration ใหม่ `supabase/migrations/014_customer_profile.sql`:

```sql
-- เพิ่ม flag ว่าเติมโปรไฟล์ครบหรือยัง (phone อาจ null ได้ตามธรรมชาติ)
alter table public.customers
  add column if not exists profile_completed_at timestamptz,
  add column if not exists phone_verified boolean not null default false;

-- index ช่วยค้นหา/filter ฝั่ง admin
create index if not exists customers_phone_idx on public.customers (phone);
```

> หมายเหตุ: `phone` column มีอยู่แล้ว ไม่ต้องเพิ่ม
> เกณฑ์ "โปรไฟล์ครบ" = `profile_completed_at is not null` (ตั้งตอนกรอกชื่อ+เบอร์สำเร็จ)
> CLAUDE.md ระบุ `supabase/migrations/` เป็น owner-guarded → ผมจะร่างไฟล์ให้ แต่ **owner เป็นคนรัน**

### A.2 Session — เพิ่ม `profileComplete` เข้า CustomerSession

แก้ `lib/customer/session.ts`:
- เพิ่ม field ใน type `CustomerSession`: `phone: string | null`, `profileComplete: boolean`
- ขยาย `.select(...)` ทั้ง 2 query (LINE บรรทัด ~106, Google บรรทัด ~122) ให้ดึง `phone, full_name, profile_completed_at`
- `rowToSession()` map `profileComplete = data.profile_completed_at != null`

### A.3 API — เติมโปรไฟล์

สร้าง `app/api/customer/profile/route.ts`:
- `GET` — คืนโปรไฟล์ตัวเอง (name, phone, profileComplete)
- `PATCH` — รับ `{ fullName, phone }`, ใช้ `getCustomerSession()` หา id ตัวเอง (ห้ามรับ id จาก client), เขียนผ่าน service-role client, set `profile_completed_at = now()`
- Validation: zod schema ใหม่ใน `lib/schemas/customer-profile.ts`
  - `fullName`: string 2–80 ตัว
  - `phone`: regex เบอร์ไทย `^0[0-9]{8,9}$` (normalize ตัด space/dash)

แก้ `app/api/auth/me/route.ts` — เพิ่ม `profileComplete` + `phone` ใน response เพื่อให้ client gate ได้

### A.4 UI — ฟอร์มเติมโปรไฟล์

ตัวเลือกการแสดง (แนะนำ **modal step ใน BookingModal** + fallback page):
- `components/auth/CompleteProfileForm.tsx` (client) — ฟอร์ม ชื่อ + เบอร์ + ปุ่มบันทึก → `PATCH /api/customer/profile`
- จุด gate:
  1. **ใน `BookingModal`** — หลัง login แล้ว ถ้า `!profileComplete` → แสดง step เติมโปรไฟล์ก่อนให้กดจอง (ต่อจาก flow login เดิมที่บรรทัด ~207-213)
  2. **หน้า `/profile/complete`** (standalone) — เผื่อ redirect จากที่อื่น / ลูกค้าอยากแก้เอง
- อัปเดต navbar/SignInButton ให้โชว์สถานะ "โปรไฟล์ยังไม่ครบ" (optional)

### A.5 (ออปชัน) บังคับฝั่ง API จอง

ใน `app/api/bookings/route.ts` หลังเช็ค session (บรรทัด 53-57) เพิ่ม:
```ts
if (!session.profileComplete) return 422 "profile incomplete"
```
กันเคสที่ client ข้าม gate — เป็น defense-in-depth

---

## 4. PART B — ปรับหน้า List `/admin/customers`

ไฟล์: `app/admin/customers/page.tsx` (query) + `CustomersList.tsx` (UI)

### B.1 KPI แถวบน (StatCards)
คำนวณจาก query ที่ดึงมาอยู่แล้ว ไม่ต้อง query เพิ่ม:
- ลูกค้าทั้งหมด
- ลูกค้าใหม่เดือนนี้ (`created_at` ในเดือนปัจจุบัน)
- VIP (`is_vip = true`)
- มีเบอร์โทร % (`phone != null`) ← ตัวชี้วัดว่า profile completion ได้ผลแค่ไหน

### B.2 คอลัมน์เพิ่มในตาราง
- **ช่องทาง**: badge LINE / Google / Walk-in (จาก `source` + `auth_provider`)
- **VIP**: ดาว/badge
- **Tags**: chips
- ขยาย `.select` ใน `page.tsx:20` ให้ดึง `is_vip, tags, source, auth_provider, profile_completed_at`

### B.3 Filter / Search
- Filter chips: ช่องทาง · VIP · มี/ไม่มีเบอร์ · ลูกค้าใหม่เดือนนี้
- คงช่องค้นหาเดิม (ชื่อ/email/เบอร์)
- Export CSV (ปุ่มเดียว, client-side จาก rows ที่ filter แล้ว)

### B.4 Empty state
- ถ้ายังไม่มีลูกค้า → การ์ดแนะนำ "ลูกค้าจะปรากฏเมื่อมีคน login/จอง หรือเพิ่มผ่าน Walk-in" + ปุ่มไป Walk-in

---

## 5. PART C — เติมหน้า Detail `/admin/customers/[id]` (ให้เท่า mockup)

สิ่งที่ขาดเทียบ mockup (Image #2) เรียงตามความคุ้มค่า:

| ฟีเจอร์ | ที่มาข้อมูล | งาน |
|---|---|---|
| **RFM badge** (Recency/Frequency/Monetary) | คำนวณจาก bookings ที่ดึงมาแล้ว | เบา — แค่ logic |
| **CLV (คาดการณ์)** | avg order × ความถี่ | เบา |
| **Health Score** | สูตรง่ายๆ จาก recency + จำนวนจอง | เบา |
| **Tax info** (เลขผู้เสียภาษี/ที่อยู่/VAT) | ต้องเพิ่ม column ใน DB | ต้อง migration + ฟอร์มแก้ไข |
| **Timeline รวม** (booking+payment+contact feed เดียว) | merge ข้อมูลที่มีแล้ว | กลาง |
| **AI Insights** | rule-based ก่อน (เช่น "ยังไม่เคยจอง") | เบา |

> Tax info เป็นก้อนที่ใหญ่สุด (ต้อง migration + UI) — แยกเป็น sprint ย่อยได้

---

## 6. ลำดับการทำ (แนะนำ)

1. **Sprint A — Profile completion** (ปลดล็อกข้อมูลต้นทาง — ทำก่อนสุด)
   - migration 014 (owner รัน) → session → API → UI gate ใน BookingModal
2. **Sprint B — List page** (KPI + คอลัมน์ + filter)
3. **Sprint C — Detail enrich** (RFM/CLV/Health/Timeline — ไม่ต้อง migration)
4. **Sprint D — Tax info** (migration + UI, ทำทีหลังได้)

---

## 7. ไฟล์ที่จะแตะ (สรุป)

**สร้างใหม่:**
- `supabase/migrations/014_customer_profile.sql` (owner รัน)
- `app/api/customer/profile/route.ts`
- `lib/schemas/customer-profile.ts`
- `components/auth/CompleteProfileForm.tsx`
- `app/profile/complete/page.tsx`

**แก้ไข:**
- `lib/customer/session.ts` (+phone, +profileComplete)
- `app/api/auth/me/route.ts` (+profileComplete)
- `components/booking/BookingModal.tsx` (gate step)
- `app/admin/customers/page.tsx` (+select fields, +KPI)
- `app/admin/customers/CustomersList.tsx` (คอลัมน์/filter/export)
- `app/admin/customers/[id]/page.tsx` + `CustomerCrm.tsx` (RFM/CLV/timeline)
- `types/customer.ts` (sync ให้ตรง migration 012/014 — ตอนนี้ stale)

**Owner-guarded (ต้องขออนุญาต):** `supabase/migrations/` → migration 014

---

## 8. Done-criteria (ตาม CLAUDE.md)
ทุก sprint ต้องผ่านครบ 3 ก่อน commit:
1. `npx tsc --noEmit` green
2. `npm run lint` green
3. `npm run build` green
```

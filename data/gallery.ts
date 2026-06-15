import type { Bilingual } from "@/types";

export type GalleryCategory = "view" | "rooms" | "events";

export type GalleryItem = {
  id: string;
  category: GalleryCategory;
  src: string;
  alt: Bilingual;
  /** Bento span — controls aspect and grid placement. */
  span: "tall" | "wide" | "square" | "feature";
};

/**
 * Editorial gallery — three categories with deliberately asymmetric
 * bento sizing so the masonry never feels mechanical.
 */
export const galleryItems: GalleryItem[] = [
  // ─── วิว / View ──────────────────────────────────
  { id: "v1", category: "view", src: "/images/gallery/view/mountain-mist.jpg", alt: { th: "หมอกเช้าบนภูเขา", en: "Morning mist on mountains" }, span: "feature" },
  { id: "v2", category: "view", src: "/images/gallery/view/pine-forest.jpg", alt: { th: "ป่าสนหลังที่พัก", en: "Pine forest behind villas" }, span: "tall" },
  { id: "v3", category: "view", src: "/images/gallery/view/stream-side.jpg", alt: { th: "ลำธารริมที่พัก", en: "Stream-side scene" }, span: "square" },
  { id: "v4", category: "view", src: "/images/gallery/view/sunset-deck.jpg", alt: { th: "ระเบียงตอนพระอาทิตย์ตก", en: "Sunset on deck" }, span: "wide" },
  { id: "v5", category: "view", src: "/images/gallery/view/night-sky.jpg", alt: { th: "ท้องฟ้าคืนเดือนหงาย", en: "Night sky over villa" }, span: "square" },
  { id: "v6", category: "view", src: "/images/gallery/view/garden-path.jpg", alt: { th: "ทางเดินในสวน", en: "Garden path" }, span: "tall" },

  // ─── ห้องพัก / Rooms atmosphere ──────────────────
  { id: "r1", category: "rooms", src: "/images/gallery/rooms/villa-evening.jpg", alt: { th: "วิลล่ายามค่ำคืน", en: "Villa at dusk" }, span: "feature" },
  { id: "r2", category: "rooms", src: "/images/gallery/rooms/train-detail.jpg", alt: { th: "รายละเอียดบ้านรถไฟ", en: "Camper Train detail" }, span: "square" },
  { id: "r3", category: "rooms", src: "/images/gallery/rooms/marshall-corner.jpg", alt: { th: "มุม Marshall Speaker", en: "Marshall speaker corner" }, span: "tall" },
  { id: "r4", category: "rooms", src: "/images/gallery/rooms/breakfast-in-room.jpg", alt: { th: "อาหารเช้าในห้อง", en: "In-room breakfast" }, span: "wide" },
  { id: "r5", category: "rooms", src: "/images/gallery/rooms/bath-tub.jpg", alt: { th: "อ่างแช่นอกตัวบ้าน", en: "Outdoor soaking tub" }, span: "tall" },
  { id: "r6", category: "rooms", src: "/images/gallery/rooms/coffee-table.jpg", alt: { th: "มุมกาแฟยามเช้า", en: "Morning coffee table" }, span: "square" },

  // ─── พื้นที่จัดงาน / Events ──────────────────────
  { id: "e1", category: "events", src: "/images/gallery/wedding/pre-wedding.jpg", alt: { th: "งาน Pre-wedding", en: "Pre-wedding session" }, span: "feature" },
  { id: "e2", category: "events", src: "/images/gallery/wedding/outdoor-dining.jpg", alt: { th: "พื้นที่ทานอาหาร outdoor", en: "Outdoor dining area" }, span: "wide" },
  { id: "e3", category: "events", src: "/images/gallery/wedding/bbq-night.jpg", alt: { th: "ปาร์ตี้ BBQ ค่ำคืน", en: "Evening BBQ" }, span: "square" },
  { id: "e4", category: "events", src: "/images/gallery/wedding/family-gathering.jpg", alt: { th: "ครอบครัวรวมตัว", en: "Family gathering" }, span: "tall" },
  { id: "e5", category: "events", src: "/images/gallery/wedding/anniversary.jpg", alt: { th: "ฉลองครบรอบ", en: "Anniversary celebration" }, span: "square" },
  { id: "e6", category: "events", src: "/images/gallery/wedding/group-photo.jpg", alt: { th: "ภาพหมู่ผู้เข้าพัก", en: "Group portrait" }, span: "tall" },
];

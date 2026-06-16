import type { Bilingual } from "@/types";

/**
 * Wedding / private-event gallery and copy. The team prefers a single
 * point of contact via Line for bookings, so the section has no inline
 * pricing — only the visual story plus a CTA.
 */
export const weddingContent: {
  eyebrow: Bilingual;
  heading: Bilingual;
  description: Bilingual;
  highlights: Bilingual[];
  ctaLabel: Bilingual;
  images: { src: string; alt: Bilingual }[];
} = {
  eyebrow: { th: "งานแต่งงาน", en: "Wedding" },
  heading: {
    th: "จัดงานแต่งงานท่ามกลางขุนเขาเขาใหญ่",
    en: "Say I do, among the Khao Yai pines",
  },
  description: {
    th: "พื้นที่ส่วนตัวกว้างขวางสำหรับ Outdoor Wedding, Pre-Wedding และงานเลี้ยงพิเศษ — รองรับ Indoor backup กรณีฝนตก ทีมงานช่วยวางแผนตั้งแต่ตกแต่ง อาหาร ไปจนถึงที่พักสำหรับเจ้าบ่าวเจ้าสาวและแขก",
    en: "An expansive private setting for outdoor weddings, pre-wedding shoots and intimate celebrations — with an indoor backup for rainy days. Our team helps plan everything from styling and catering to guest accommodation.",
  },
  highlights: [
    { th: "พื้นที่กลางแจ้งกว้างขวาง", en: "Spacious open-air venue" },
    { th: "Indoor backup เมื่อฝนตก", en: "Indoor rain backup" },
    { th: "ที่พัก 6 หลังสำหรับครอบครัวและแขก", en: "6 villas for family and guests" },
    { th: "ทีมงานช่วยวางแผนเต็มรูปแบบ", en: "Full event planning support" },
  ],
  ctaLabel: { th: "สอบถามรายละเอียด", en: "Inquire for details" },
  images: [
    { src: "/images/wedding/322.png", alt: { th: "งานแต่งงานยามพระอาทิตย์ตก", en: "Sunset wedding reception" } },
    { src: "/images/wedding/323.png", alt: { th: "พิธีแต่งงานยามค่ำคืน", en: "Evening ceremony" } },
    { src: "/images/wedding/324.png", alt: { th: "การจัดโต๊ะอาหาร", en: "Table setting detail" } },
    { src: "/images/wedding/325.png", alt: { th: "ซุ้มผ้าสีขาว", en: "White drape archway" } },
    { src: "/images/wedding/326.png", alt: { th: "ภาพมุมสูงพื้นที่งาน", en: "Aerial view of venue" } },
    { src: "/images/wedding/327.png", alt: { th: "โต๊ะอาหารริมสนาม", en: "Garden dining table" } },
    { src: "/images/wedding/328.png", alt: { th: "โต๊ะยาวใต้แสงไฟ", en: "Long table under string lights" } },
    { src: "/images/wedding/329.png", alt: { th: "ซุ้มดอกไม้สีขาว", en: "White floral installation" } },
    { src: "/images/wedding/330.png", alt: { th: "ทางเดินใต้ซุ้มผ้า", en: "Aisle under draped fabric" } },
    { src: "/images/wedding/331.png", alt: { th: "พื้นที่จัดเลี้ยงกลางสนาม", en: "Reception space on the lawn" } },
    { src: "/images/wedding/332.png", alt: { th: "มุมพิธีต้นสน", en: "Pine-tree ceremony backdrop" } },
    { src: "/images/wedding/333.png", alt: { th: "ช่วงโยนช่อดอกไม้", en: "Bouquet toss moment" } },
    { src: "/images/wedding/334.png", alt: { th: "โต๊ะแขกริมแสงไฟราว", en: "Guest tables with festoon lights" } },
    { src: "/images/wedding/335.png", alt: { th: "โต๊ะยาวยามค่ำ", en: "Long table at dusk" } },
  ],
};

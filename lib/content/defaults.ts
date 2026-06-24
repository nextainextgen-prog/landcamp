/**
 * Code-level content defaults — client-safe (pure data).
 *
 * These mirror the original hardcoded values in data/siteConfig.ts and the
 * homepage section components. They are the fallback the public site renders
 * when no CMS override has been published, so the site looks identical until
 * the owner edits something. Keep these in sync if the source text changes.
 */

import { siteConfig } from "@/data/siteConfig";
import type { SiteContent } from "./types";

export const CONTENT_DEFAULTS: SiteContent = {
  brand: {
    name: siteConfig.brand.name,
    nameFull: siteConfig.brand.nameFull,
    nameThai: siteConfig.brand.nameThai,
    tagline: { ...siteConfig.brand.tagline },
    description: { ...siteConfig.brand.description },
  },
  contact: {
    phone: siteConfig.contact.phone,
    phoneAlt: siteConfig.contact.phoneAlt,
    phoneE164: siteConfig.contact.phoneE164,
    line: siteConfig.contact.line,
    lineUrl: siteConfig.contact.lineUrl,
    facebook: siteConfig.contact.facebook,
    instagram: siteConfig.contact.instagram,
    googleMaps: siteConfig.contact.googleMaps,
    email: siteConfig.contact.email,
  },
  hero: {
    eyebrow: {
      th: "เขาใหญ่ · ที่พักไพรเวท",
      en: "Khao Yai · Private Sanctuary",
    },
    subheadLine1: {
      th: "วิลล่าสไตล์ Glamping 6 หลัง ใจกลางขุนเขาเขาใหญ่",
      en: "Six glamping villas tucked into the forests of Khao Yai",
    },
    subheadLine2: {
      th: "ทุกมุมมองสงวนไว้ให้คุณคนเดียว",
      en: "every vista, reserved for you alone.",
    },
    ctaReserve: { th: "จองที่พัก", en: "Reserve" },
    ctaExplore: { th: "สำรวจห้องพัก", en: "Explore Rooms" },
  },
  about: {
    eyebrow: { th: "เรื่องราวของเรา", en: "Brand Story" },
    description: {
      th: "วิลล่าสไตล์ Glamping 6 หลัง ใจกลางขุนเขาเขาใหญ่ ทุกหลังคัดสรรอย่างพิถีพิถัน เพื่อให้คุณได้พักผ่อนอย่างเป็นส่วนตัวที่สุด พร้อมประสบการณ์ที่เหนือกว่าโรงแรมทั่วไป",
      en: "Six glamping villas tucked into the forests of Khao Yai — each thoughtfully crafted to deliver privacy, calm, and an experience that goes beyond an ordinary stay.",
    },
    stats: [
      { value: 6, label: { th: "ห้องพักไพรเวท", en: "Private villas" } },
      { value: 4, label: { th: "รูปแบบที่พัก", en: "Stay styles" } },
      {
        value: 12.6,
        decimals: 1,
        unit: { th: "กม.", en: "KM" },
        label: { th: "จากเขาใหญ่", en: "From Khao Yai gate" },
      },
      {
        value: 4.8,
        decimals: 1,
        unit: { th: "/ 5", en: "/ 5" },
        label: { th: "Google Rating", en: "Google rating" },
      },
    ],
    perks: [
      { label: { th: "ไวไฟฟรีทุกห้อง", en: "Free Wi-Fi in every villa" } },
      {
        label: {
          th: "อาหารเช้าฟรี ทุกการเข้าพัก",
          en: "Breakfast included with every stay",
        },
      },
    ],
  },
  contactSection: {
    eyebrow: { th: "จองและสอบถาม", en: "Book & Inquire" },
    heading: {
      th: "พูดคุยกับเราโดยตรง ผ่าน Line @landcamp",
      en: "Talk to us directly via Line @landcamp",
    },
    lead: {
      th: "ทีมงานตอบทุกข้อความภายใน 3 ชั่วโมง ไม่ผ่านเอเจนซี ไม่มีค่าธรรมเนียมแอบแฝง — แอด Line แล้วจองได้เลย",
      en: "Our team responds within 3 hours. No agency, no hidden fees — add us on Line and book directly.",
    },
  },
  footer: {
    brandDescription: {
      th: "วิลล่าหรูสไตล์ Glamping ใจกลางขุนเขาเขาใหญ่ — 6 หลัง แยกพื้นที่ส่วนตัว ไม่ใช่โรงแรม ไม่ใช่รีสอร์ท",
      en: "Luxury glamping villas at the heart of Khao Yai — six private retreats, each in its own pine-forest plot.",
    },
    copyrightTagline: {
      th: "ออกแบบและพัฒนาด้วยใจ ที่ปากช่อง",
      en: "Designed and built with care · Pak Chong",
    },
  },
};

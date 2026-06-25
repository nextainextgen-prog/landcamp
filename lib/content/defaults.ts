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
    story: [
      { src: "/images/about/story/01-bathroom.jpg", alt: "Indoor freestanding bathtub with garden window view", title: { th: "อ่างแช่ริมสวน", en: "Tub by the Garden" }, subtitle: { th: "Indoor Soaking · Wood Cabin", en: "Indoor Soaking · Wood Cabin" } },
      { src: "/images/about/story/02-camper-dusk.jpg", alt: "Silver Camper Van and stone garden at dusk surrounded by pines", title: { th: "ค่ำคืนรอบกองไฟ", en: "Sunset Firepit" }, subtitle: { th: "Camper Van · Pine Grove", en: "Camper Van · Pine Grove" } },
      { src: "/images/about/story/03-bedroom.jpg", alt: "Glass villa bedroom with floor-to-ceiling windows facing the garden", title: { th: "วิลล่ากระจกริมสวน", en: "Glass Villa" }, subtitle: { th: "Floor-to-Ceiling Glass", en: "Floor-to-Ceiling Glass" } },
      { src: "/images/about/story/04-wedding.png", alt: "Outdoor wedding setup with long wooden table and white floral arches", title: { th: "งานแต่งกลางสวน", en: "Garden Weddings" }, subtitle: { th: "Open-air · Long Table", en: "Open-air · Long Table" } },
      { src: "/images/about/story/05-stone-villa.png", alt: "Stone-clad villa beside a natural stream with wooden bridge", title: { th: "วิลล่าหินกลางป่า", en: "Stone Villa" }, subtitle: { th: "Stream-side · Stone Walls", en: "Stream-side · Stone Walls" } },
      { src: "/images/about/story/06-garden-chairs.png", alt: "Wooden dining set under olive trees in front of stone villa at dusk", title: { th: "มื้อค่ำใต้ต้นไม้", en: "Dinner Under Trees" }, subtitle: { th: "Garden Table · Lantern Light", en: "Garden Table · Lantern Light" } },
      { src: "/images/about/story/07-outdoor-tub.png", alt: "Outdoor wooden bath with string lights overhead", title: { th: "อ่างแช่กลางแจ้ง", en: "Outdoor Soak" }, subtitle: { th: "Cedar Walls · String Lights", en: "Cedar Walls · String Lights" } },
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
  gallery: [
    { src: "/images/atmosphere/atmosphere-01.jpeg", alt: "Aerial view of Camper Van deck and stone garden" },
    { src: "/images/atmosphere/atmosphere-02.jpeg", alt: "Sunset deck at Camper Van" },
    { src: "/images/atmosphere/atmosphere-03.jpeg", alt: "Stone fire pit beside the Camper Van at dusk" },
    { src: "/images/atmosphere/atmosphere-04.png", alt: "Camper Van bedroom interior" },
    { src: "/images/atmosphere/atmosphere-05.png", alt: "Marshall speaker corner inside the Camper Van" },
    { src: "/images/atmosphere/atmosphere-06.png", alt: "Bathtub with garden window view" },
    { src: "/images/atmosphere/atmosphere-07.jpeg", alt: "Camper Train deck with lounge chairs" },
    { src: "/images/atmosphere/atmosphere-08.jpeg", alt: "Guest sitting on the Camper Van deck at sunset" },
    { src: "/images/atmosphere/atmosphere-09.jpeg", alt: "Outdoor bath with pine view" },
    { src: "/images/atmosphere/atmosphere-10.jpeg", alt: "Couple walking on stone path through the pines" },
    { src: "/images/atmosphere/atmosphere-11.jpeg", alt: "Aerial view of LandCamp gardens" },
    { src: "/images/atmosphere/atmosphere-12.png", alt: "Outdoor cedar soaking tub" },
    { src: "/images/atmosphere/atmosphere-13.jpeg", alt: "Camper Train at golden hour" },
    { src: "/images/atmosphere/atmosphere-14.jpeg", alt: "Outdoor tub beside the lake" },
    { src: "/images/atmosphere/atmosphere-15.jpeg", alt: "Glass villa bedroom with garden view" },
    { src: "/images/atmosphere/atmosphere-16.jpeg", alt: "Marshall speaker on bedside" },
    { src: "/images/atmosphere/atmosphere-17.jpeg", alt: "Marble bathroom with shower" },
    { src: "/images/atmosphere/atmosphere-18.jpeg", alt: "Glass villa bedroom" },
    { src: "/images/atmosphere/atmosphere-19.jpeg", alt: "Stone villa exterior with adirondack chairs" },
    { src: "/images/atmosphere/atmosphere-20.jpeg", alt: "Garden path through the property" },
    { src: "/images/atmosphere/atmosphere-21.jpeg", alt: "Cabana with shade sail" },
    { src: "/images/atmosphere/atmosphere-22.jpeg", alt: "Lawn and pine grove" },
    { src: "/images/atmosphere/atmosphere-23.jpeg", alt: "Aerial view of stone fire pit area" },
    { src: "/images/atmosphere/atmosphere-24.jpeg", alt: "Camper Van bedroom living space" },
    { src: "/images/atmosphere/atmosphere-25.jpeg", alt: "Wood-paneled bathroom with shower" },
    { src: "/images/atmosphere/atmosphere-26.jpeg", alt: "Master bedroom interior" },
    { src: "/images/atmosphere/atmosphere-27.png", alt: "Sofa with linen pillows in living area" },
    { src: "/images/atmosphere/atmosphere-28.jpeg", alt: "Linen sofa beside window" },
    { src: "/images/atmosphere/atmosphere-29.jpeg", alt: "Bathroom with freestanding tub and garden view" },
    { src: "/images/atmosphere/atmosphere-30.jpeg", alt: "Dining and living area" },
    { src: "/images/atmosphere/atmosphere-31.jpeg", alt: "Stone villa with stream" },
    { src: "/images/atmosphere/atmosphere-32.jpeg", alt: "Guest by adirondack chairs at golden hour" },
    { src: "/images/atmosphere/atmosphere-33.jpeg", alt: "Marshall speaker on side table" },
    { src: "/images/atmosphere/atmosphere-34.jpeg", alt: "Bathroom interior" },
    { src: "/images/atmosphere/atmosphere-35.jpeg", alt: "Camper Van interior in evening light" },
  ],
  wedding: {
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
      { src: "/images/wedding/322.png", alt: "งานแต่งงานยามพระอาทิตย์ตก" },
      { src: "/images/wedding/323.png", alt: "พิธีแต่งงานยามค่ำคืน" },
      { src: "/images/wedding/324.png", alt: "การจัดโต๊ะอาหาร" },
      { src: "/images/wedding/325.png", alt: "ซุ้มผ้าสีขาว" },
      { src: "/images/wedding/326.png", alt: "ภาพมุมสูงพื้นที่งาน" },
      { src: "/images/wedding/327.png", alt: "โต๊ะอาหารริมสนาม" },
      { src: "/images/wedding/328.png", alt: "โต๊ะยาวใต้แสงไฟ" },
      { src: "/images/wedding/329.png", alt: "ซุ้มดอกไม้สีขาว" },
      { src: "/images/wedding/330.png", alt: "ทางเดินใต้ซุ้มผ้า" },
      { src: "/images/wedding/331.png", alt: "พื้นที่จัดเลี้ยงกลางสนาม" },
      { src: "/images/wedding/332.png", alt: "มุมพิธีต้นสน" },
      { src: "/images/wedding/333.png", alt: "ช่วงโยนช่อดอกไม้" },
      { src: "/images/wedding/334.png", alt: "โต๊ะแขกริมแสงไฟราว" },
      { src: "/images/wedding/335.png", alt: "โต๊ะยาวยามค่ำ" },
    ],
  },
  video: {
    eyebrow: { th: "วิดีโอบรรยากาศ", en: "Atmosphere on Film" },
    heading: {
      th: "ชมบรรยากาศจริงผ่าน\nมุมมองของผู้เข้าพัก",
      en: "See it through\nour guests' eyes",
    },
    lead: {
      th: "วิดีโอรีวิวสไตล์ Reels จากผู้เข้าพักจริง — แตะที่ลำโพงเพื่อเปิดเสียง",
      en: "Reels-style clips from real guests — tap the speaker to hear sound.",
    },
  },
  menu: {
    eyebrow: { th: "อาหาร & เครื่องดื่ม", en: "Food & Drinks" },
    heading: {
      th: "ครัว คาเฟ่ และมื้อค่ำริมลำธาร",
      en: "Kitchen, cafe and dinner by the stream",
    },
    lead: {
      th: "อาหารเช้ารวมในแพ็กเกจ · อาหารตามสั่ง คาเฟ่ และหมูกระทะ สั่งเพิ่มได้ทาง Line @landcamp",
      en: "Breakfast included with every stay · Thai à la carte, cafe and moo krata available on order via Line @landcamp.",
    },
  },
  reviews: {
    eyebrow: { th: "เสียงจากผู้เข้าพัก", en: "Guest Voices" },
    heading: {
      th: "เก้าในสิบของผู้เข้าพักกลับมาอีกครั้ง",
      en: "Nine in ten guests come back again",
    },
    ratingValue: 4.9,
    ratingCount: 47,
  },
  map: {
    eyebrow: { th: "ที่ตั้ง & การเดินทาง", en: "Location & Directions" },
    titleLine1: { th: "ปากช่อง · นครราชสีมา", en: "Pak Chong · Nakhon Ratchasima" },
    titleLine2: { th: "ห่างจากเขาใหญ่ 12.6 กม.", en: "12.6 km from Khao Yai" },
    directionsLabel: { th: "เส้นทางจากกรุงเทพ", en: "From Bangkok" },
    directions: [
      {
        text: {
          th: "ออกจากกรุงเทพใช้ทางหลวงหมายเลข 1 (พหลโยธิน) มุ่งสู่ อ.ปากช่อง",
          en: "From Bangkok, take Highway 1 (Phahonyothin) north toward Pak Chong.",
        },
        distance: { th: "ประมาณ 2 ชั่วโมง", en: "≈ 2 hours" },
      },
      {
        text: {
          th: "เลี้ยวเข้าถนนธนะรัชต์ (เส้นทางสู่อุทยานแห่งชาติเขาใหญ่)",
          en: "Turn onto Thanarat Road toward Khao Yai National Park.",
        },
        distance: { th: "12 กม.", en: "12 km" },
      },
      {
        text: {
          th: "ตำบลขนงพระ เลี้ยวขวาตรงป้าย LandCamp",
          en: "In Khanong Phra, follow the LandCamp signage to the right.",
        },
        distance: { th: "ตรงเข้าที่พักอีก 600 ม.", en: "600 m to entrance" },
      },
    ],
  },
};

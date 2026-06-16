/**
 * LandCamp Villa Khao Yai — Central Property Configuration
 *
 * Single source of truth for all NAP data, contact info, brand strings,
 * and SEO metadata. Every section reads from here so a single edit
 * propagates everywhere.
 */

export const siteConfig = {
  brand: {
    name: "LandCamp",
    nameFull: "LandCamp Villa Khao Yai",
    nameThai: "แลนด์แคมป์ วิลล่า เขาใหญ่",
    tagline: {
      th: "ที่พักไพรเวทกลางขุนเขาเขาใหญ่",
      en: "A Private Sanctuary in the Heart of Khao Yai",
    },
    description: {
      th: "วิลล่าหรูสไตล์ Glamping ใจกลางขุนเขาเขาใหญ่ 6 หลัง 4 รูปแบบ ส่วนตัวเหนือคำบรรยาย",
      en: "A luxury glamping retreat with 6 private villas across 4 unique styles, hidden in the mountains of Khao Yai.",
    },
  },

  /* ────────────────────────────────────────
     NAP — Name, Address, Phone (SEO critical)
     ──────────────────────────────────────── */
  address: {
    street: "ตำบลขนงพระ อำเภอปากช่อง",
    streetEn: "Khanong Phra Subdistrict, Pak Chong District",
    city: "ปากช่อง",
    cityEn: "Pak Chong",
    state: "นครราชสีมา",
    stateEn: "Nakhon Ratchasima",
    postalCode: "30130",
    countryEn: "Thailand",
    countryTh: "ประเทศไทย",
    full: {
      th: "ต.ขนงพระ อ.ปากช่อง จ.นครราชสีมา 30130",
      en: "Khanong Phra, Pak Chong, Nakhon Ratchasima 30130, Thailand",
    },
    coordinates: {
      lat: 14.6042732,
      lng: 101.43873,
    },
    nearbyDistance: {
      th: "ห่างจากด่านอุทยานแห่งชาติเขาใหญ่ประมาณ 12.6 กิโลเมตร",
      en: "Approximately 12.6 km from the entrance of Khao Yai National Park",
    },
  },

  contact: {
    phone: "098-502-1695",
    phoneAlt: "080-374-9962",
    phoneE164: "+66985021695",
    line: "@landcamp",
    lineUrl: "https://line.me/ti/p/~@landcamp",
    facebook: "https://www.facebook.com/Landcampvillakhaoyai/?locale=th_TH",
    instagram: "https://www.instagram.com/landcamp_khaoyai",
    googleMaps: "https://maps.app.goo.gl/KexMMTh1BNW64wjt5",
    email: "hello@landcamp.com",
  },

  /* ────────────────────────────────────────
     Stay policy
     ──────────────────────────────────────── */
  policy: {
    checkIn: "14:00",
    checkOut: "12:00",
    pets: false,
    breakfastIncluded: true,
    childPolicy: {
      th: "เด็กอายุ 1-10 ปี พักฟรี | อายุ 12 ปีขึ้นไป คิดเพิ่ม 700 บาท/ท่าน",
      en: "Children 1-10 stay free | Ages 12+ charged 700 THB per person",
    },
  },

  /* ────────────────────────────────────────
     Inventory
     ──────────────────────────────────────── */
  inventory: {
    totalRooms: 6,
    roomTypes: 4,
    priceFromTHB: 4500,
  },

  /* ────────────────────────────────────────
     Reviews aggregate
     ──────────────────────────────────────── */
  rating: {
    value: 4.9,
    count: 47,
    recommendPercent: 100,
  },

  /* ────────────────────────────────────────
     SEO
     ──────────────────────────────────────── */
  seo: {
    siteUrl: "https://landcamp-eta.vercel.app",
    defaultLocale: "th_TH",
    alternateLocales: ["en_US"],
    keywordsTh: [
      "ที่พักเขาใหญ่",
      "วิลล่าเขาใหญ่",
      "ที่พักสไตล์แคมป์เขาใหญ่",
      "แลนด์แคมป์เขาใหญ่",
      "ที่พักไพรเวทเขาใหญ่",
      "luxury glamping เขาใหญ่",
    ],
    keywordsEn: [
      "khao yai villa",
      "luxury glamping khao yai",
      "private villa khao yai",
      "LandCamp Villa Khao Yai",
      "pak chong resort",
    ],
  },

  /* ────────────────────────────────────────
     Navigation
     ──────────────────────────────────────── */
  nav: [
    { id: "atmosphere", labelTh: "บรรยากาศ", labelEn: "Atmosphere" },
    { id: "rooms", labelTh: "ห้องพัก", labelEn: "Rooms" },
    { id: "wedding", labelTh: "งานแต่งงาน", labelEn: "Wedding" },
    { id: "menu", labelTh: "อาหาร", labelEn: "Menu" },
    { id: "reviews", labelTh: "รีวิว", labelEn: "Reviews" },
    { id: "contact", labelTh: "ติดต่อ", labelEn: "Contact" },
  ] as const,
} as const;

export type SiteConfig = typeof siteConfig;
export type NavId = (typeof siteConfig.nav)[number]["id"];
export type Locale = "th" | "en";

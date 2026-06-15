import type { Review } from "@/types";

/**
 * Real review excerpts from LandCamp Villa Khao Yai Google Maps page.
 * Profile photos provided by site owner — placed in /public/images/reviews.
 */
export const reviews: Review[] = [
  {
    id: "r-001",
    reviewerName: "Sumonpak R.",
    rating: 5,
    text: {
      th: "ที่พักดีมากๆ บรรยากาศดี ห้องพักสวย สตาฟทุกคนน่ารักมากๆ บริการดีมากๆ แอดมินก็ตอบเร็ว ให้ความช่วยเหลือดีมากๆ เลยค่ะ แนะนำมากๆ เลย ถ้ามีโอกาสจะกลับไปพักอีกนะคะ",
      en: "Lovely stay — great vibe, beautiful rooms, every staff member is so kind, the admin replies fast and was super helpful. Highly recommend, will definitely come back.",
    },
    date: "2026-06-01",
    photoUrl: "/images/reviews/r-001.png",
    platform: "google",
    featured: true,
  },
  {
    id: "r-002",
    reviewerName: "Pim K.",
    rating: 5,
    text: {
      th: "ที่พักน่ารัก เป็นส่วนตัวมาก บรรยากาศดี มีอาหารเช้า พี่พนักงานน่ารักค่ะ",
      en: "Cosy stay, very private, lovely atmosphere with breakfast included. The staff are so sweet.",
    },
    date: "2026-05-18",
    photoUrl: "/images/reviews/r-002.png",
    photos: [
      { src: "/images/gallery/rooms/breakfast-in-room.jpg", alt: "Breakfast served in-room at LandCamp" },
      { src: "/images/gallery/view/garden-path.jpg", alt: "Garden pathway at LandCamp" },
      { src: "/images/gallery/rooms/villa-evening.jpg", alt: "Villa exterior in the evening" },
      { src: "/images/gallery/rooms/coffee-table.jpg", alt: "Coffee table inside the villa" },
    ],
    platform: "google",
    featured: true,
  },
  {
    id: "r-003",
    reviewerName: "Wanida T.",
    rating: 5,
    text: {
      th: "อวัตถุดิบดี เสริฟน้ำร้อนๆเลยค่ะ ชอบทุกๆอย่างเลยคะ ใว้จะพาครอบครัวมาพักอีกมาคะ",
      en: "Quality ingredients, served piping hot. Loved everything — bringing the whole family back next time.",
    },
    date: "2026-05-02",
    photoUrl: "/images/reviews/r-003.png",
    platform: "google",
    featured: true,
  },
  {
    id: "r-004",
    reviewerName: "Manasawee J.",
    rating: 5,
    text: {
      th: "ที่พักสวย ห้องนอนสวย สะอาด บรรยากาศและวิวดีสุดๆ เหมาะกับการพักผ่อน ฮีลใจสุดๆ",
      en: "Beautiful place, gorgeous bedrooms, spotless, and the views are unreal. The perfect spot to recharge.",
    },
    date: "2026-04-21",
    photoUrl: "/images/reviews/r-004.png",
    platform: "google",
    featured: true,
  },
  {
    id: "r-005",
    reviewerName: "Saowalak S.",
    rating: 5,
    text: {
      th: "บรรยากาศดี ที่พักสวย ห้องพัก Van น่ารักสวยเก๋ นอนสบาย ห้องน้ำกว้างถูกใจมากค่ะ เหมาะสำหรับพักผ่อนจริงๆ มีหมูกระทะให้สั่งทานด้วยค่ะ พนักงานน่ารักค่ะ ประทับใจ",
      en: "Lovely atmosphere, beautiful stay — the Van room is so cute and stylish, super comfortable, and the bathroom is spacious. Perfect for unwinding. They even serve moo krata, and the staff are wonderful. Truly impressed.",
    },
    date: "2024-06-12",
    photoUrl: "/images/reviews/r-saowalak.jpg",
    photos: [
      { src: "/images/reviews/photo-saowalak-1.jpg", alt: "Wooden deck at LandCamp Villa Khao Yai" },
      { src: "/images/reviews/photo-saowalak-2.jpg", alt: "Glass villa interior" },
      { src: "/images/reviews/photo-saowalak-3.jpg", alt: "Garden pathway through pine trees" },
      { src: "/images/reviews/photo-saowalak-4.jpg", alt: "Breakfast spread served at LandCamp" },
    ],
    platform: "google",
    featured: true,
  },
  {
    id: "r-006",
    reviewerName: "Pichaya T.",
    rating: 5,
    text: {
      th: "มาฉลองครบรอบกับแฟน จองวิลล่า 1 ห้องนอน อ่างแช่นอกตัวบ้านเก็บภาพได้ทุกมุม Marshall Speaker เปิดเบาๆ ฟินสุด",
      en: "Came for our anniversary — booked the 1-bedroom villa. The outdoor tub photographs from every angle and the Marshall speaker set the mood perfectly.",
    },
    date: "2026-02-10",
    photoUrl: "/images/reviews/r-006.png",
    photos: [
      { src: "/images/gallery/rooms/bath-tub.jpg", alt: "Outdoor soaking tub at LandCamp" },
      { src: "/images/gallery/rooms/marshall-corner.jpg", alt: "Marshall speaker in the villa" },
      { src: "/images/gallery/view/sunset-deck.jpg", alt: "Sunset on the deck at LandCamp" },
      { src: "/images/gallery/wedding/anniversary.jpg", alt: "Anniversary celebration at LandCamp" },
    ],
    platform: "google",
    featured: true,
  },
  {
    id: "r-007",
    reviewerName: "Worawut L.",
    rating: 5,
    text: {
      th: "พนักงานช่วยเหลือดีมาก ตอบกลับใน Line รวดเร็ว ห้องสะอาดทุกซอกมุม กลิ่นไม้สนตอนเช้าเป็นความหรูแบบที่ไม่เคยรู้จัก",
      en: "Staff are amazing — Line replies are instant. Spotless rooms, and the pine scent in the morning is a luxury I didn't know existed.",
    },
    date: "2026-01-28",
    photoUrl: "/images/reviews/r-007.png",
    platform: "google",
    featured: true,
  },
  {
    id: "r-008",
    reviewerName: "Janetra W.",
    rating: 5,
    text: {
      th: "ทุกมุมถ่ายรูปสวย เหมือนหลุดไปต่างประเทศ Camper Van ตู้ใหญ่ ตกแต่งภายในอบอุ่น เปิดประตูออกมาคืออะกาเว่ทั้งสวน",
      en: "Every angle is a photo. The Camper Van feels like a cabin abroad — open the door and you're in an agave garden.",
    },
    date: "2025-12-22",
    photoUrl: "/images/reviews/r-008.png",
    platform: "google",
    featured: true,
  },
  {
    id: "r-009",
    reviewerName: "Saksit J.",
    rating: 5,
    text: {
      th: "บรรยากาศไพรเวทมาก ที่นี่เงียบสงบ เหมาะกับการพักผ่อนสุดๆ จะกลับมาพักอีกแน่นอน",
      en: "Incredibly private and quiet — perfect for unwinding. Will definitely be back.",
    },
    date: "2025-11-14",
    photoUrl: "/images/reviews/r-009.png",
    platform: "google",
    featured: true,
  },
];

export const featuredReviews = reviews.filter((r) => r.featured);

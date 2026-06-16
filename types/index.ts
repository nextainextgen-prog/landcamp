/**
 * Shared types for LandCamp Villa Khao Yai
 */

export type Locale = "th" | "en";

export type Bilingual = {
  th: string;
  en: string;
};

export type RoomType = "villa-1bed" | "villa-2bed" | "train" | "camper";

export type Room = {
  id: string;
  type: RoomType;
  name: Bilingual;
  description: Bilingual;
  priceWeekday: number;
  priceWeekend: number;
  /** Price shown as "เริ่มต้นที่" in the popup — may differ from priceWeekday per business rule. */
  startingPrice: number;
  maxGuests: number;
  bedSize: Bilingual;
  roomSize: Bilingual;
  /** Optional layout line (e.g. "2 ห้องนอน 1 ห้องนั่งเล่น 2 ห้องน้ำ"). */
  layout?: Bilingual;
  breakfastIncluded: Bilingual;
  extraBed: Bilingual;
  services: Bilingual[];
  checkIn: string;
  checkOut: string;
  amenities: Bilingual[];
  images: { src: string; alt: Bilingual }[];
  available: boolean;
};

export type MenuCategory = "food" | "drinks" | "desserts";

export type MenuItem = {
  id: string;
  category: MenuCategory;
  name: Bilingual;
  description: Bilingual;
  price: number;
  imageSrc: string;
  available: boolean;
};

export type Review = {
  id: string;
  reviewerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: Bilingual;
  date: string;
  photoUrl?: string;
  /** Optional photos the reviewer attached to their review. */
  photos?: { src: string; alt: string }[];
  platform: "google" | "facebook" | "instagram";
  featured: boolean;
};

export type Lead = {
  name: string;
  phone: string;
  email?: string;
  checkinDate?: string;
  message?: string;
  source?: string;
};

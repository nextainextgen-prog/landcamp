import type { MenuItem } from "@/types";

export const menuItems: MenuItem[] = [
  // ─── Food ────────────────────────────────────────
  {
    id: "moo-krata-set",
    category: "food",
    name: { th: "ชุดหมูกระทะ", en: "Moo Krata Grill Set" },
    description: {
      th: "หมูสามชั้น เนื้อ ปลา ผัก น้ำจิ้มสูตรบ้านพร้อมเตา เสิร์ฟถึงโต๊ะส่วนตัวริมลำธาร",
      en: "Pork belly, beef, fish and vegetables with house dipping sauce — grilled at your private stream-side table.",
    },
    price: 650,
    imageSrc: "/images/menu/food/moo-krata.jpg",
    available: true,
  },
  {
    id: "jaew-hon",
    category: "food",
    name: { th: "แจ่วฮ้อน", en: "Jaew Hon Hot Pot" },
    description: {
      th: "หม้อต้มสไตล์อีสาน ผัก เนื้อสัตว์หลายอย่าง พร้อมน้ำซุปสมุนไพร เสิร์ฟกับข้าวเหนียวอุ่น",
      en: "Northeastern-style hot pot — assorted meats, fresh vegetables, herbal broth, served with warm sticky rice.",
    },
    price: 550,
    imageSrc: "/images/menu/food/jaew-hon.jpg",
    available: true,
  },
  {
    id: "khao-tom",
    category: "food",
    name: { th: "ข้าวต้มเครื่อง", en: "Thai Rice Soup" },
    description: {
      th: "ข้าวต้มร้อนๆ เครื่องครบ ไข่ลวก หมูสับ ขิงซอย — เมนูเช้ารวมในแพ็คเกจ",
      en: "Warm rice porridge with poached egg, minced pork and ginger — included with your stay.",
    },
    price: 0,
    imageSrc: "/images/menu/food/khao-tom.jpg",
    available: true,
  },
  {
    id: "kai-kratha",
    category: "food",
    name: { th: "ไข่กระทะ", en: "Skillet Eggs" },
    description: {
      th: "ไข่ดาวกระทะร้อน หมูยอ เบคอน ไส้กรอก ขนมปังปิ้ง รับประทานริมลำธาร",
      en: "Sizzling pan eggs with pork sausage, bacon and toasted bread — served stream-side.",
    },
    price: 0,
    imageSrc: "/images/menu/food/kai-kratha.jpg",
    available: true,
  },
  {
    id: "yum-talay",
    category: "food",
    name: { th: "ยำทะเลรวม", en: "Mixed Seafood Salad" },
    description: {
      th: "กุ้ง ปลาหมึก หอย น้ำยำสูตรเผ็ดเปรี้ยว ผักสด สดสะอาดทุกวัน",
      en: "Prawns, squid and mussels in fiery lime dressing with fresh herbs and crisp vegetables.",
    },
    price: 320,
    imageSrc: "/images/menu/food/yum-talay.jpg",
    available: true,
  },
  {
    id: "kao-pad",
    category: "food",
    name: { th: "ข้าวผัดอเมริกัน", en: "American Fried Rice" },
    description: {
      th: "ข้าวผัดซอสมะเขือเทศ ไส้กรอก ไข่ดาว ลูกเกด สับปะรด เมนูเด็กชอบ",
      en: "Sweet tomato-glazed fried rice with sausage, fried egg, raisins and pineapple — a family favourite.",
    },
    price: 220,
    imageSrc: "/images/menu/food/kao-pad.jpg",
    available: true,
  },

  // ─── Drinks ─────────────────────────────────────
  {
    id: "kafee-drip",
    category: "drinks",
    name: { th: "กาแฟดริปอาราบิก้า", en: "Drip Arabica" },
    description: {
      th: "เมล็ดอาราบิก้าเหนือคั่วกลาง ดริปสด รสนุ่ม กลิ่นหอม",
      en: "Northern Thai single-origin arabica, hand-dripped to order.",
    },
    price: 95,
    imageSrc: "/images/menu/drinks/drip-coffee.jpg",
    available: true,
  },
  {
    id: "matcha-latte",
    category: "drinks",
    name: { th: "มัทฉะลาเต้", en: "Matcha Latte" },
    description: {
      th: "ผงมัทฉะอุจิเกรด ceremony นมสด หรือนมโอ๊ตตามชอบ",
      en: "Ceremony-grade Uji matcha with fresh dairy or oat milk.",
    },
    price: 120,
    imageSrc: "/images/menu/drinks/matcha-latte.jpg",
    available: true,
  },
  {
    id: "thai-tea",
    category: "drinks",
    name: { th: "ชาไทยเย็น", en: "Thai Iced Tea" },
    description: {
      th: "ชาไทยสูตรดั้งเดิม รสกลมกล่อม หวานพอดี ไม่หวานจัด",
      en: "Traditional Thai tea blend — perfectly balanced, never too sweet.",
    },
    price: 80,
    imageSrc: "/images/menu/drinks/thai-tea.jpg",
    available: true,
  },
  {
    id: "fresh-juice",
    category: "drinks",
    name: { th: "น้ำผลไม้คั้นสด", en: "Fresh Juice" },
    description: {
      th: "ส้ม / แตงโม / แครอท / แอปเปิ้ล คั้นสด ไม่เติมน้ำตาล",
      en: "Orange · watermelon · carrot · apple — cold-pressed, no added sugar.",
    },
    price: 110,
    imageSrc: "/images/menu/drinks/fresh-juice.jpg",
    available: true,
  },
  {
    id: "wine-glass",
    category: "drinks",
    name: { th: "ไวน์แก้ว", en: "House Wine" },
    description: {
      th: "ไวน์แดง / ขาว / โรเซ่ คัดเลือกพิเศษคู่กับมื้อเย็นริมลำธาร",
      en: "Red, white or rosé — hand-picked to pair with your stream-side dinner.",
    },
    price: 240,
    imageSrc: "/images/menu/drinks/wine-glass.jpg",
    available: true,
  },
  {
    id: "soft-drinks",
    category: "drinks",
    name: { th: "น้ำอัดลม", en: "Soft Drinks" },
    description: {
      th: "Coca-Cola / Sprite / น้ำแร่ Acqua Panna",
      en: "Coca-Cola, Sprite, Acqua Panna mineral water.",
    },
    price: 50,
    imageSrc: "/images/menu/drinks/soft-drinks.jpg",
    available: true,
  },

  // ─── Desserts ───────────────────────────────────
  {
    id: "khanom-thai-set",
    category: "desserts",
    name: { th: "ขนมไทยรวม", en: "Thai Dessert Plate" },
    description: {
      th: "ทองหยิบ ทองหยอด ฝอยทอง ขนมชั้น เสิร์ฟพร้อมชายามบ่าย",
      en: "An assortment of classic Thai sweets served with afternoon tea.",
    },
    price: 180,
    imageSrc: "/images/menu/desserts/khanom-thai.jpg",
    available: true,
  },
  {
    id: "mango-sticky",
    category: "desserts",
    name: { th: "ข้าวเหนียวมะม่วง", en: "Mango Sticky Rice" },
    description: {
      th: "ข้าวเหนียวมูนกะทิหอม มะม่วงน้ำดอกไม้สุกหวานฉ่ำ — เมนูตามฤดูกาล",
      en: "Coconut sticky rice with ripe Nam Dok Mai mango — seasonal availability.",
    },
    price: 160,
    imageSrc: "/images/menu/desserts/mango-sticky.jpg",
    available: true,
  },
  {
    id: "homemade-cake",
    category: "desserts",
    name: { th: "เค้กโฮมเมด", en: "Daily Cake" },
    description: {
      th: "เค้กอบสดทุกวัน สลับเมนู เช่น Carrot Cake, Banana Bread, Earl Grey",
      en: "House-baked daily — rotating between Carrot Cake, Banana Bread and Earl Grey Loaf.",
    },
    price: 140,
    imageSrc: "/images/menu/desserts/homemade-cake.jpg",
    available: true,
  },
  {
    id: "ice-cream",
    category: "desserts",
    name: { th: "ไอศกรีมโฮมเมด", en: "Homemade Ice Cream" },
    description: {
      th: "วานิลลาบีน / กาแฟ / ช็อคโกแลตเข้ม / สตรอเบอร์รี่ ใช้นมสด ไม่ใส่ผง",
      en: "Vanilla bean, espresso, dark chocolate or strawberry — made with fresh dairy.",
    },
    price: 120,
    imageSrc: "/images/menu/desserts/ice-cream.jpg",
    available: true,
  },
  {
    id: "fruit-platter",
    category: "desserts",
    name: { th: "ผลไม้ตามฤดูกาล", en: "Seasonal Fruit Plate" },
    description: {
      th: "ผลไม้สดของไทย คัดเลือกตามฤดู มะม่วง สับปะรด แตงโม ฝรั่ง",
      en: "A plate of Thai-grown fruit selected by the season.",
    },
    price: 130,
    imageSrc: "/images/menu/desserts/fruit-platter.jpg",
    available: true,
  },
];

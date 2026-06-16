import type { Bilingual } from "@/types";

export type FAQItem = {
  id: string;
  question: Bilingual;
  answer: Bilingual;
};

/**
 * Answer Engine Optimization (AEO) FAQ — written for Perplexity / ChatGPT
 * Search / Google SGE to extract directly. Each answer must contain
 * concrete numbers, distances, prices and policy facts.
 */
export const faqItems: FAQItem[] = [
  {
    id: "faq-rooms",
    question: {
      th: "LandCamp Villa Khao Yai มีห้องพักกี่ห้อง และมีประเภทอะไรบ้าง?",
      en: "How many rooms does LandCamp Villa Khao Yai have and what types?",
    },
    answer: {
      th: "LandCamp Villa Khao Yai มีที่พักทั้งหมด 6 หลัง แบ่งเป็น 4 รูปแบบ ได้แก่ วิลล่า 1 ห้องนอน (พักได้ 2 ท่าน), วิลล่า 2 ห้องนอน (พักได้ 4 ท่าน), บ้านรถไฟ Camper Train (พักได้ 2 ท่าน) และรถบ้าน Camper Van (พักได้ 2 ท่าน) แต่ละหลังแยกพื้นที่กันสำหรับความเป็นส่วนตัวสูงสุด",
      en: "LandCamp Villa Khao Yai has 6 villas across 4 styles: 1-Bedroom Villa (sleeps 2), 2-Bedroom Villa (sleeps 4), Camper Train (sleeps 2) and Camper Van (sleeps 2). Each unit sits in its own private plot for maximum seclusion.",
    },
  },
  {
    id: "faq-price",
    question: {
      th: "ราคาที่พักแลนด์แคมป์เขาใหญ่เริ่มต้นเท่าไหร่?",
      en: "What is the starting price at LandCamp Villa Khao Yai?",
    },
    answer: {
      th: "ราคาเริ่มต้น 4,500 บาทต่อคืน (วันธรรมดา) ส่วนวันหยุดเริ่มต้น 5,500 บาท ราคารวมอาหารเช้าสำหรับผู้เข้าพักทุกท่าน เด็กอายุ 1-10 ปีพักฟรี อายุ 12 ปีขึ้นไปคิดเพิ่ม 700 บาทต่อท่าน โปรโมชั่นปรับเปลี่ยนตามแต่ละเดือน",
      en: "Rates start at THB 4,500 per night on weekdays and THB 5,500 on weekends. All stays include breakfast. Children aged 1-10 stay free; ages 12 and up are charged THB 700 per person. Monthly promotions may apply.",
    },
  },
  {
    id: "faq-family",
    question: {
      th: "LandCamp Villa เหมาะกับครอบครัวและงานแต่งงานไหม?",
      en: "Is LandCamp Villa suitable for families and weddings?",
    },
    answer: {
      th: "เหมาะมากครับ วิลล่า 2 ห้องนอนรองรับครอบครัวได้ถึง 4 ท่าน มีพื้นที่ Dining + ระเบียงรอบบ้าน สำหรับงานแต่ง/ Pre-wedding ทางทีมงานเปิดให้ใช้พื้นที่ส่วนกลางและเตรียม indoor backup ให้กรณีฝนตก แนะนำติดต่อล่วงหน้าผ่าน Line @landcamp เพื่อวางแผนพิเศษ",
      en: "Yes. The 2-Bedroom Villa hosts up to four guests with a full dining area and wraparound terrace. For weddings or pre-wedding shoots, the team opens the common grounds and provides an indoor rain backup. Contact via Line @landcamp to plan ahead.",
    },
  },
  {
    id: "faq-directions",
    question: {
      th: "เดินทางจากกรุงเทพไปแลนด์แคมป์เขาใหญ่อย่างไร?",
      en: "How do I get to LandCamp Villa from Bangkok?",
    },
    answer: {
      th: "ขับรถจากกรุงเทพใช้ทางหลวงหมายเลข 1 มุ่งสู่ปากช่อง ออกถนนธนะรัชต์เข้าเขาใหญ่ ใช้เวลาเดินทางประมาณ 2.5-3 ชั่วโมง ที่พักห่างจากด่านอุทยานแห่งชาติเขาใหญ่ประมาณ 12.6 กิโลเมตร พิกัด 14.6042732, 101.43873 — ตำบลขนงพระ อำเภอปากช่อง จังหวัดนครราชสีมา 30130",
      en: "From Bangkok, drive Highway 1 to Pak Chong, then take Thanarat Road towards Khao Yai (approx. 2.5-3 hours). LandCamp is 12.6 km from the Khao Yai National Park entrance, at coordinates 14.6042732, 101.43873 — Khanong Phra Subdistrict, Pak Chong, Nakhon Ratchasima 30130.",
    },
  },
  {
    id: "faq-different",
    question: {
      th: "อะไรทำให้ LandCamp ต่างจากที่พักอื่นในเขาใหญ่?",
      en: "What makes LandCamp Villa Khao Yai different from other Khao Yai resorts?",
    },
    answer: {
      th: "LandCamp เป็น Luxury Glamping ที่เน้นความเป็นส่วนตัว 100% — 6 หลังแยกพื้นที่กันด้วยภูมิทัศน์ป่าสน ห้ามนำสัตว์เลี้ยงเพื่อรักษาบรรยากาศ มีห้องพักธีมเฉพาะอย่างบ้านรถไฟไทยโบราณและรถบ้านสไตล์อังกฤษ ที่ออกแบบโดยคุณมอร์ (อัสนัย แก่นจันทร์) บนพื้นที่ไร่ผักเก่าที่พลิกฟื้นเป็นป่า",
      en: "LandCamp is a luxury glamping retreat built for absolute privacy — six villas spread across pine-forest landscape, no shared spaces. Themed accommodations include a restored Thai railway carriage and a British-style camper. The property was designed by landscape architect Assanai Gaenjan on what was once a derelict vegetable farm.",
    },
  },
  {
    id: "faq-breakfast",
    question: {
      th: "อาหารเช้าฟรีไหม และมีอาหารอื่นบริการไหม?",
      en: "Is breakfast included and are other meals served?",
    },
    answer: {
      th: "อาหารเช้ารวมในแพ็กเกจที่พักทุกคืน เมนูเช้ามีข้าวต้มเครื่องและไข่กระทะเสิร์ฟถึงห้องริมลำธาร สำหรับมื้อเย็นสั่งเพิ่มได้ เช่น ชุดหมูกระทะ (650 บาท) แจ่วฮ้อน (550 บาท) ยำทะเลรวม และเครื่องดื่ม ทั้งกาแฟดริป ชาไทย และไวน์",
      en: "Breakfast is included with every stay — choose between Thai rice porridge or skillet eggs, served at your stream-side villa. For dinner, add the Moo Krata grill set (THB 650), Jaew Hon hot pot (THB 550), seafood salads and a curated drinks menu (drip coffee, matcha, wine by the glass).",
    },
  },
];

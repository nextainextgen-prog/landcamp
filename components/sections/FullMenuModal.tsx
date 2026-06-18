"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useT } from "@/app/providers";
import type { Bilingual } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

type MenuEntry = {
  name: Bilingual;
  price: string;
};

type MenuSection = {
  title: Bilingual;
  items: MenuEntry[];
};

const SECTIONS: MenuSection[] = [
  {
    title: { th: "หมูกระทะ & แจ่วฮ้อน", en: "Moo Krata & Jaew Hon" },
    items: [
      { name: { th: "หมูกระทะ (หมู + ทะเล)", en: "Moo Krata (Pork + Seafood)" }, price: "490" },
      { name: { th: "แจ่วฮ้อน ชุดรวม (หมู + เนื้อ + ทะเล)", en: "Jaew Hon Combo (Pork + Beef + Seafood)" }, price: "490" },
      { name: { th: "แจ่วฮ้อน ชุดหมู", en: "Jaew Hon Pork Set" }, price: "490" },
      { name: { th: "แจ่วฮ้อน ชุดเนื้อ", en: "Jaew Hon Beef Set" }, price: "490" },
    ],
  },
  {
    title: { th: "ครัว · ข้าวจาน", en: "Kitchen · Rice Dishes" },
    items: [
      { name: { th: "ข้าวผัดรถไฟ (หมู / กุ้ง / ปลาหมึก / ไก่ / กุนเชียง)", en: "Thai Railway Fried Rice (pork / shrimp / squid / chicken / sausage)" }, price: "100 – 130" },
      { name: { th: "ข้าวหมูสามชั้นทอดน้ำปลา", en: "Rice with Deep-Fried Pork Belly in Fish Sauce" }, price: "110" },
      { name: { th: "ข้าวกะเพรา (หมูสับ / หมูชิ้น)", en: "Holy Basil Rice (minced / sliced pork)" }, price: "100" },
      { name: { th: "ข้าวกะเพราคลุก (หมูสับ / เนื้อสับ)", en: "Mixed Basil Fried Rice (minced pork / beef)" }, price: "110" },
      { name: { th: "ข้าวกะเพรากุ้ง", en: "Holy Basil Rice with Shrimp" }, price: "130" },
      { name: { th: "ข้าวกะเพราปลาหมึก", en: "Holy Basil Rice with Squid" }, price: "130" },
      { name: { th: "ข้าวกะเพราไก่ชิ้น", en: "Holy Basil Rice with Sliced Chicken" }, price: "100" },
      { name: { th: "ข้าวกะเพรา (เนื้อสับ / เนื้อชิ้น)", en: "Holy Basil Rice (minced / sliced beef)" }, price: "110" },
      { name: { th: "ข้าวกะเพราเนื้อสับหมูสับหน่อไม้ดอง", en: "Basil Rice with Minced Pork, Beef & Pickled Bamboo" }, price: "120" },
      { name: { th: "ปีกไก่ทอดเกลือ", en: "Salt-Fried Chicken Wings" }, price: "150" },
      { name: { th: "หมูสามชั้นทอดน้ำปลา", en: "Deep-Fried Pork Belly in Fish Sauce" }, price: "150" },
      { name: { th: "ข้าวหน้าหมูทอด / กุ้งทอด / ปลาหมึกทอดกระเทียม", en: "Rice with Garlic Fried Pork / Shrimp / Squid" }, price: "120 – 150" },
    ],
  },
  {
    title: { th: "เมนูเสริม", en: "Extras" },
    items: [
      { name: { th: "ข้าวเปล่า", en: "Steamed Rice" }, price: "20" },
      { name: { th: "ไข่ดาว", en: "Fried Egg" }, price: "20" },
    ],
  },
  {
    title: { th: "เครื่องดื่ม", en: "Beverages" },
    items: [
      { name: { th: "Singha Beer", en: "Singha Beer" }, price: "110" },
      { name: { th: "Heineken Beer", en: "Heineken Beer" }, price: "140" },
      { name: { th: "Leo Beer", en: "Leo Beer" }, price: "90" },
      { name: { th: "Hoegaarden", en: "Hoegaarden" }, price: "190" },
      { name: { th: "Hoegaarden Rosé", en: "Hoegaarden Rosé" }, price: "190" },
      { name: { th: "Regency", en: "Regency" }, price: "490" },
      { name: { th: "โซดา / น้ำเปล่า", en: "Soda / Water" }, price: "25" },
      { name: { th: "โค้ก / สไปรท์", en: "Coke / Sprite" }, price: "35" },
    ],
  },
];

export function FullMenuModal({ onClose }: { onClose: () => void }) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[color:var(--color-forest-night)]/80 backdrop-blur-md"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-menu-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative w-full sm:max-w-3xl max-h-[92vh] bg-[color:var(--color-bone)] text-[color:var(--color-ink)] rounded-t-[20px] sm:rounded-[20px] overflow-hidden flex flex-col shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-[color:var(--color-bone)]/95 backdrop-blur-md flex items-center justify-center hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]"
        >
          <span aria-hidden className="relative block h-5 w-5">
            <span className="absolute inset-0 m-auto h-px w-4 bg-current rotate-45" />
            <span className="absolute inset-0 m-auto h-px w-4 bg-current -rotate-45" />
          </span>
        </button>

        <div className="overflow-y-auto px-6 sm:px-12 lg:px-16 pt-12 sm:pt-14 pb-10">
          {/* Header — like printed menu cover */}
          <header className="text-center pb-6 border-b border-[color:var(--color-ink)]/15">
            <p
              className="text-[10px] uppercase tracking-[0.46em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              LandCamp Villa Khao Yai
            </p>
            <h2
              id="full-menu-title"
              className="mt-2 font-display text-[40px] sm:text-[56px] lg:text-[64px] leading-none tracking-[0.32em] text-[color:var(--color-forest-deep)]"
            >
              MENU
            </h2>
            <p className="mt-3 text-xs text-[color:var(--color-ink)]/55 italic">
              {t({
                th: "ราคาทั้งหมดเป็นบาทไทย · สั่งเพิ่มผ่าน Line @landcamp",
                en: "All prices in Thai Baht · Order more via Line @landcamp",
              })}
            </p>
          </header>

          {/* Sections */}
          <div className="mt-10 flex flex-col gap-12">
            {SECTIONS.map((section, si) => (
              <section key={si}>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span aria-hidden className="h-px w-10 bg-[color:var(--color-warm-clay)]/60" />
                  <h3 className="font-display text-[20px] sm:text-[22px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)] text-center">
                    {t(section.title)}
                  </h3>
                  <span aria-hidden className="h-px w-10 bg-[color:var(--color-warm-clay)]/60" />
                </div>

                <ul className="flex flex-col gap-3.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-end gap-3">
                      <span className="text-[14px] sm:text-[15px] leading-snug text-[color:var(--color-forest-deep)] font-medium">
                        {t(item.name)}
                      </span>
                      <span
                        aria-hidden
                        className="flex-1 border-b border-dotted border-[color:var(--color-ink)]/25 translate-y-[-0.35em]"
                      />
                      <span
                        className="text-[14px] sm:text-[15px] tabular-nums text-[color:var(--color-warm-clay)] whitespace-nowrap"
                        style={{ fontFamily: "var(--font-ui)" }}
                      >
                        {item.price} ฿
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-[color:var(--color-ink)]/15 text-center">
            <p
              className="text-[10px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Landcamp · Villa Khaoyai
            </p>
            <p className="mt-3 text-xs text-[color:var(--color-ink)]/55">
              {t({
                th: "อาหารเช้ารวมในแพ็กเกจที่พักทุกห้อง",
                en: "Breakfast is included with every stay.",
              })}
            </p>
          </footer>
        </div>
      </motion.div>
    </motion.div>
  );
}

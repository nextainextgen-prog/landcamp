"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/app/providers";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

type ReviewVideo = {
  id: string;
  src: string;
  title: { th: string; en: string };
  handle: string;
  tag: { th: string; en: string };
};

const VIDEOS: ReviewVideo[] = [
  {
    id: "reel-01",
    src: "/videos/reviews/reel-01.mp4",
    title: { th: "รีวิวจากผู้เข้าพัก", en: "Guest reel" },
    handle: "@landcamp_khaoyai",
    tag: { th: "Guest Reel", en: "Guest Reel" },
  },
  {
    id: "reel-02",
    src: "/videos/reviews/reel-02.mp4",
    title: { th: "บรรยากาศ LandCamp", en: "LandCamp vibes" },
    handle: "@landcamp_khaoyai",
    tag: { th: "Vibes", en: "Vibes" },
  },
  {
    id: "overview",
    src: "/videos/reviews/overview.mp4",
    title: { th: "ภาพรวม LandCamp", en: "LandCamp overview" },
    handle: "@landcamp_khaoyai",
    tag: { th: "ทัวร์ทั่วโครงการ", en: "Property tour" },
  },
  {
    id: "camper-train",
    src: "/videos/reviews/camper-train.mp4",
    title: { th: "นอนบ้านรถไฟ", en: "Sleeping in the Camper Train" },
    handle: "@landcamp_khaoyai",
    tag: { th: "Camper Train", en: "Camper Train" },
  },
  {
    id: "glass-villa",
    src: "/videos/reviews/glass-villa.mp4",
    title: { th: "วิลล่ากระจกใส", en: "Glass villa" },
    handle: "@landcamp_khaoyai",
    tag: { th: "Glass Villa", en: "Glass Villa" },
  },
  {
    id: "villa-2bedroom",
    src: "/videos/reviews/villa-2bedroom.mp4",
    title: { th: "วิลล่า 2 ห้องนอน", en: "2-bedroom villa" },
    handle: "@landcamp_khaoyai",
    tag: { th: "Villa 2BR", en: "Villa 2BR" },
  },
];

function VideoCard({
  video,
  index,
  activeMute,
  onUnmute,
}: {
  video: ReviewVideo;
  index: number;
  activeMute: string | null;
  onUnmute: (id: string | null) => void;
}) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const isActive = activeMute === video.id;

  // Pause when out of viewport, play when in
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mute all but the active one
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = !isActive;
  }, [isActive]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnmute(isActive ? null : video.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.08 * index }}
      className="relative snap-start flex-shrink-0 w-[78%] sm:w-auto group"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-black shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
        <video
          ref={ref}
          src={video.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          onClick={togglePlay}
        />

        {/* Top gradient */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
        />

        {/* Bottom gradient */}
        <div
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none"
        />

        {/* Tag top-left */}
        <span
          className="absolute top-3 left-3 z-10 bg-black/45 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.28em]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {t(video.tag)}
        </span>

        {/* Mute toggle top-right */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isActive ? "Mute" : "Unmute"}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/65 transition-colors"
        >
          {isActive ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <path d="m23 9-6 6M17 9l6 6" />
            </svg>
          )}
        </button>

        {/* Play overlay if paused */}
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play"
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <span className="h-16 w-16 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
              <span
                aria-hidden
                className="block h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-[color:var(--color-forest-deep)] ml-1"
              />
            </span>
          </button>
        )}

        {/* Bottom caption — influencer style */}
        <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
          <p
            className="text-[11px] uppercase tracking-[0.3em] text-white/75"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {video.handle}
          </p>
          <p className="mt-1 font-display text-lg sm:text-xl leading-tight">
            {t(video.title)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function VideoSection() {
  const t = useT();
  const [activeMute, setActiveMute] = useState<string | null>(null);

  return (
    <section
      aria-label={t({ th: "วิดีโอบรรยากาศ", en: "Ambient video" })}
      className="relative bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] py-20 sm:py-24 lg:py-32 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div
            className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.4em]"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <span className="text-[color:var(--color-warm-clay)]">05</span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--color-bone)]/40" />
            <span className="text-[color:var(--color-bone)]/65">
              {t({ th: "วิดีโอบรรยากาศ", en: "Atmosphere on Film" })}
            </span>
          </div>

          <h2
            className="font-display text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.1] text-[color:var(--color-bone)] max-w-xl whitespace-pre-line"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t({
              th: "ชมบรรยากาศจริงผ่าน\nมุมมองของผู้เข้าพัก",
              en: "See it through\nour guests' eyes",
            })}
          </h2>

          <p className="max-w-md text-sm sm:text-base leading-relaxed text-[color:var(--color-bone)]/65">
            {t({
              th: "วิดีโอรีวิวสไตล์ Reels จากผู้เข้าพักจริง — แตะที่ลำโพงเพื่อเปิดเสียง",
              en: "Reels-style clips from real guests — tap the speaker to hear sound.",
            })}
          </p>
        </motion.div>

        {/* Vertical reels — scroll on mobile, grid on desktop */}
        <div
          className="mt-10 sm:mt-14 -mx-6 sm:mx-0 flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-3 px-6 sm:px-0 pb-4 sm:pb-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VIDEOS.map((v, i) => (
            <VideoCard
              key={v.id}
              video={v}
              index={i}
              activeMute={activeMute}
              onUnmute={setActiveMute}
            />
          ))}
        </div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
          className={cn(
            "mt-8 sm:mt-10 text-center text-[12px] sm:text-sm",
            "text-[color:var(--color-bone)]/55 max-w-xl mx-auto",
          )}
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {t({
            th: "เลื่อนซ้าย-ขวาเพื่อดูเพิ่ม · แตะวิดีโอเพื่อหยุด / เล่น",
            en: "Swipe to browse · Tap a video to pause or play",
          })}
        </motion.p>
      </div>
    </section>
  );
}

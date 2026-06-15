"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/cn";

const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

export type MosaicImage = {
  src: string;
  alt: string;
  /** Position in % of container — top/left of image */
  top: string;
  left: string;
  /** Width/height in % */
  width: string;
  height: string;
  /** Rotation in degrees (-5 to +5 looks editorial) */
  rotate: number;
  /** Entrance delay in seconds (in-view trigger) */
  delay: number;
  /** Parallax speed during scroll: 0.05 (slow) → 0.4 (fast) */
  parallax: number;
  /** z-index */
  z: number;
};

type MosaicBuildUpProps = {
  images: MosaicImage[];
  className?: string;
  /** Container aspect ratio class — default tall portrait */
  aspect?: string;
};

/**
 * Editorial photo cluster that lives in normal document flow.
 *
 * Each image:
 *  - Fades + slides + scales in once on view (staggered by `delay`)
 *  - Continuously parallax-shifts on Y as the section scrolls past,
 *    at a per-image speed (`parallax`) — so the cluster gently breathes
 *    instead of staying frozen
 */
export function MosaicBuildUp({
  images,
  className,
  aspect = "aspect-[4/5]",
}: MosaicBuildUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <div ref={ref} className={cn("relative w-full", aspect, className)}>
      {images.map((img, i) => (
        <MosaicTile key={i} image={img} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}

function MosaicTile({
  image,
  scrollYProgress,
}: {
  image: MosaicImage;
  scrollYProgress: MotionValue<number>;
}) {
  // Continuous Y parallax tied to scroll. Speed differs per image
  // so they don't move as a single block — they breathe.
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${image.parallax * 100}%`],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
      transition={{
        duration: 1.0,
        ease: EASE_SOFT,
        delay: image.delay,
      }}
      style={{
        top: image.top,
        left: image.left,
        width: image.width,
        height: image.height,
        rotate: `${image.rotate}deg`,
        zIndex: image.z,
      }}
      className="absolute origin-center"
    >
      {/* Inner wrapper carries the continuous scroll parallax */}
      <motion.div
        style={{ y }}
        className="relative h-full w-full rounded-[1.5rem] overflow-hidden shadow-[0_22px_50px_-22px_rgba(0,0,0,0.32)] bg-[color:var(--color-bone-soft)]"
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 1024px) 60vw, 26vw"
          className="object-cover"
        />
      </motion.div>
    </motion.div>
  );
}

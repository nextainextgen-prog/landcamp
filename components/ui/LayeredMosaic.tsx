"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/cn";

const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

export type LayeredImage = {
  src: string;
  alt: string;
  /** Absolute placement in % */
  top: string;
  left: string;
  width: string;
  height: string;
  /** Subtle rotation (degrees) — keep within ±4 for editorial feel */
  rotate: number;
  /** 0.05 (slow / far) → 0.4 (fast / near) — drives parallax */
  parallax: number;
  /** Stacking order */
  z: number;
  /** Optional sage outline */
  outline?: boolean;
  /** Optional small caption shown on hover */
  caption?: string;
};

type LayeredMosaicProps = {
  images: LayeredImage[];
  className?: string;
  /** Container aspect ratio (W/H). Default 4/3 reads as editorial */
  aspect?: string;
};

/**
 * Editorial layered mosaic — 4-6 photos overlapping at slight angles
 * with per-image parallax speeds. Hovering scales individual photos
 * up subtly and reveals optional captions.
 */
export function LayeredMosaic({
  images,
  className,
  aspect = "aspect-[4/3]",
}: LayeredMosaicProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <div
      ref={ref}
      className={cn("relative w-full", aspect, className)}
    >
      {images.map((img, i) => (
        <LayeredTile key={i} image={img} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}

function LayeredTile({
  image,
  scrollYProgress,
}: {
  image: LayeredImage;
  scrollYProgress: MotionValue<number>;
}) {
  // Image lifts up by `parallax * 100`% over the full scroll
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${image.parallax * 100}%`],
  );

  return (
    <motion.div
      style={{
        y,
        top: image.top,
        left: image.left,
        width: image.width,
        height: image.height,
        rotate: `${image.rotate}deg`,
        zIndex: image.z,
      }}
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.5, ease: EASE_SOFT }}
      className={cn(
        "absolute origin-center rounded-[1.5rem] overflow-hidden shadow-[0_22px_50px_-22px_rgba(0,0,0,0.35)] bg-[color:var(--color-bone-soft)] group",
      )}
    >
      {image.outline && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[4px] rounded-[1.6rem] border border-[color:var(--color-sage-mid)]/55 z-10"
        />
      )}
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 768px) 80vw, 40vw"
        className="object-cover"
      />
      {image.caption && (
        <span className="absolute inset-x-3 bottom-3 inline-block translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)] bg-[color:var(--color-forest-night)]/65 backdrop-blur-sm rounded-full px-3 py-1.5 text-center"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {image.caption}
        </span>
      )}
    </motion.div>
  );
}

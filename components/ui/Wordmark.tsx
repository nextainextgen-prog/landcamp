import Link from "next/link";
import { cn } from "@/lib/cn";

type WordmarkProps = {
  size?: "sm" | "md" | "lg";
  color?: "bone" | "ink";
  href?: string;
  className?: string;
};

const sizeMap = {
  sm: { primary: "text-xl", sub: "text-[8px] tracking-[0.42em]", gap: "mt-0" },
  md: { primary: "text-2xl", sub: "text-[9px] tracking-[0.44em]", gap: "mt-0.5" },
  lg: { primary: "text-4xl", sub: "text-[11px] tracking-[0.48em]", gap: "mt-1" },
};

/**
 * LandCamp typographic wordmark. No image logo — the brand identity is
 * the typeface itself. "LandCamp" in Inter semibold tight-tracked, with
 * "Villa Khao Yai" in Inter caps tracked wide directly beneath.
 */
export function Wordmark({
  size = "md",
  color = "bone",
  href = "/",
  className,
}: WordmarkProps) {
  const s = sizeMap[size];
  const tone =
    color === "bone"
      ? "text-[color:var(--color-bone)]"
      : "text-[color:var(--color-ink)]";

  const content = (
    <span
      className={cn(
        "inline-flex flex-col items-start leading-none",
        tone,
        className,
      )}
    >
      <span
        className={cn("font-serif font-medium", s.primary)}
        style={{ letterSpacing: "-0.005em" }}
      >
        LandCamp
      </span>
      <span
        className={cn(
          "uppercase font-light opacity-80",
          s.sub,
          s.gap,
        )}
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Villa Khao Yai
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="LandCamp Villa Khao Yai" className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}

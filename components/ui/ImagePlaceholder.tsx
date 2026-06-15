import { cn } from "@/lib/cn";

type ImagePlaceholderProps = {
  path: string;
  alt: string;
  ratio?: "16/9" | "4/5" | "3/4" | "1/1" | "21/9" | "4/3";
  className?: string;
  /**
   * Subtle mode dims the gradient and shrinks the path label so
   * the placeholder reads as backdrop rather than competing for
   * attention. Use for hero parallax layers and other background slots.
   */
  subtle?: boolean;
  priority?: boolean;
};

/**
 * Sage-green placeholder shown until real images are dropped into /public.
 *
 * NEVER uses external services (picsum, unsplash, etc).
 * Shows the expected file path so the team knows where to drop the photo.
 */
export function ImagePlaceholder({
  path,
  alt,
  ratio,
  className,
  subtle = false,
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative w-full overflow-hidden rounded-[14px] select-none",
        "bg-[linear-gradient(135deg,#778475_0%,#a2aaa1_50%,#4d584b_100%)]",
        className,
      )}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {/* Diagonal weave pattern */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(245,241,234,0.3) 0px, rgba(245,241,234,0.3) 1px, transparent 1px, transparent 12px)",
        }}
      />

      {/* Editorial frame */}
      <div className="absolute inset-3 rounded-[8px] border border-[color:var(--color-bone)]/30" />

      {/* Path label */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-[color:var(--color-bone)]",
          subtle && "opacity-25",
        )}
      >
        <span
          className={cn(
            "uppercase opacity-70",
            subtle ? "text-[8px] tracking-[0.4em]" : "text-[10px] tracking-[0.32em]",
          )}
        >
          Image Slot
        </span>
        <span
          className={cn(
            "font-display leading-snug max-w-full break-all",
            subtle ? "text-xs" : "text-base sm:text-lg",
          )}
        >
          {path}
        </span>
        {!subtle && ratio && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.24em] opacity-60">
            {ratio}
          </span>
        )}
      </div>
    </div>
  );
}

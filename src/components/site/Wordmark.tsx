import type { Brand } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

/**
 * The site's mark: an uploaded logo when Site Settings has one, otherwise the
 * typographic wordmark (short name, hairline, organisation caption).
 */
export function Wordmark({ brand, size }: { brand: Brand; size: "sm" | "lg" }) {
  if (brand.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small, fixed-height mark; the file is already sized on upload
      <img
        src={brand.logo}
        alt={size === "lg" ? brand.label.replace(/ home$/, "") : ""}
        className={cn("w-auto object-contain", size === "sm" ? "h-8 max-w-[10rem]" : "h-10 max-w-[14rem]")}
      />
    );
  }

  return size === "sm" ? (
    <>
      <span className="text-[1.0625rem] font-semibold leading-none tracking-[-0.03em]">{brand.short}</span>
      <span className="h-4 w-px bg-line-strong" aria-hidden />
      <span className="max-w-[6.5rem] font-mono text-micro uppercase leading-[1.3] text-ink-faint transition-colors duration-200 group-hover:text-ink-muted">
        {brand.caption}
      </span>
    </>
  ) : (
    <span className="flex items-center gap-3">
      <span className="text-2xl font-semibold tracking-[-0.03em]">{brand.short}</span>
      <span className="h-5 w-px bg-line-strong" aria-hidden />
      <span className="meta">{brand.caption}</span>
    </span>
  );
}

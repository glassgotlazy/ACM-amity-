import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Images from the CMS. Uploaded files go through Next's image optimiser, so
 * each visitor downloads a copy resized for the slot it fills (WebP/AVIF
 * where the browser supports it) instead of the original upload. SVGs and
 * files shipped with the site are served as they are.
 *
 * `fill` mode: the parent sets the size (and must be `relative`).
 */
export function CmsImage({
  src,
  alt,
  sizes,
  className,
  priority,
  fit = "cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  const unoptimized = src.toLowerCase().endsWith(".svg") || src.toLowerCase().endsWith(".ico");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";


/** "01", "02", ... — used for the editorial section numbering. */
export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Class merging. Plain twMerge does not know the custom font sizes
 * (text-label, text-micro, text-display-*), reads them as colours, and drops
 * them whenever a colour class follows — text silently fell back to 16px.
 * This merger knows them.
 */
const adminMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["label", "micro", "display-xl", "display-lg", "display-page", "display-md", "display-sm"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return adminMerge(clsx(inputs));
}

/** Same as `cn` (kept for the admin console's imports). */
export const cx = cn;

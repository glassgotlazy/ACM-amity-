import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
 * `cn` for the admin console. Plain twMerge does not know the custom font
 * sizes (text-label, text-micro, text-display-*), reads them as colours, and
 * drops them whenever a colour class follows — so labels silently fall back to
 * 16px. This merger knows the sizes. (The public site still uses `cn`; its
 * layout was tuned around the old behaviour.)
 */
const adminMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["label", "micro", "display-xl", "display-lg", "display-page", "display-md", "display-sm"] }],
    },
  },
});

export function cx(...inputs: ClassValue[]) {
  return adminMerge(clsx(inputs));
}

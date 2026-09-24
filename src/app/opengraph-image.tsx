import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getSection, getSettings, ogBrand } from "@/lib/cms/read";

export const alt = "ACM BuildHub — Build something worth showing.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** "BUILD SOMETHING\nWORTH SHOWING." → "Build something worth showing." */
function sentence(headline: string) {
  const flat = headline.replace(/\s*\n\s*/g, " ").trim().toLowerCase();
  return flat.charAt(0).toUpperCase() + flat.slice(1);
}

export default async function Image() {
  const [settings, hero] = await Promise.all([getSettings(), getSection("hero")]);
  return renderOgImage(
    { eyebrow: settings.site_name, title: sentence(hero.title) || settings.tagline },
    await ogBrand(),
  );
}

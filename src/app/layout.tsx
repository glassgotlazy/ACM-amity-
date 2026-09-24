import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Cursor } from "@/components/site/Cursor";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { PageTransition } from "@/components/site/PageTransition";
import { CommandPalette } from "@/components/site/CommandPalette";
import { HideOnAdmin } from "@/components/site/HideOnAdmin";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { SiteAnalytics } from "@/components/site/SiteAnalytics";
import { SITE_URL } from "@/lib/site";
import {
  getIdeas,
  getNav,
  getProblems,
  getProjects,
  getResearch,
  getSettings,
  getSocial,
  getTeam,
  getWorkingTeams,
  isPreview,
} from "@/lib/cms/read";
import { buildIndex } from "@/lib/search";
import { brandCaption } from "@/lib/cms/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

/** Name, description and favicon come from Site Settings in the admin. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${s.site_name} — ${s.organization}`,
      template: `%s — ${s.site_name}`,
    },
    description: s.description,
    keywords: ["ACM", "Amity University", "student projects", "research", "AI", "quantum computing", "cybersecurity"],
    openGraph: {
      title: s.site_name,
      description: s.tagline,
      siteName: s.site_name,
      type: "website",
    },
    icons: { icon: s.favicon_url ?? "/favicon.svg" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090B" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
  ],
  colorScheme: "dark light",
};

/**
 * Applied before first paint so the correct theme is painted once, with no
 * flash. It has to be inline and synchronous — a deferred script would run
 * after the browser has already painted the default.
 *
 * An explicit choice wins; otherwise the system preference decides.
 */
const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem("acm-theme");
var light = s ? s==="light" : window.matchMedia("(prefers-color-scheme: light)").matches;
if(light)document.documentElement.setAttribute("data-theme","light");
}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav, social, team, projects, problems, ideas, teams, research] = await Promise.all([
    getSettings(),
    getNav(),
    getSocial(),
    getTeam(),
    getProjects(),
    getProblems(),
    getIdeas(),
    getWorkingTeams(),
    getResearch(),
  ]);
  const brand = {
    short: settings.short_name,
    caption: brandCaption(settings),
    logo: settings.logo_url,
    label: `${settings.organization} — ${settings.site_name} home`,
  };
  const header = nav.filter((n) => n.in_header);
  // Mobile menu: the header links, then the browse links that only live in
  // the footer columns. "Take part" links are actions, covered by the CTA.
  const mobileExtra = nav.filter((n) => !n.in_header && (n.footer_group === "platform" || n.footer_group === "community"));

  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <HideOnAdmin>
          <ScrollProgress />
          <Cursor />
        </HideOnAdmin>
        <Navbar brand={brand} items={header} extra={mobileExtra} />
        <CommandPalette
          index={buildIndex({
            problems,
            ideas,
            teams,
            research,
            projects: projects.map((p) => ({
              slug: p.slug,
              name: p.name,
              summary: p.summary,
              category: p.category,
              domains: p.domains,
              technologies: p.technologies,
              roles: p.openRoles.map((r) => r.role),
            })),
          })}
        />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <HideOnAdmin>
          <Footer brand={brand} settings={settings} nav={nav} social={social} team={team} />
        </HideOnAdmin>
        {(await isPreview()) ? <PreviewBanner /> : null}
        {/* Only on Vercel, where the Analytics tab serves the script. */}
        {process.env.VERCEL === "1" ? <SiteAnalytics /> : null}
      </body>
    </html>
  );
}

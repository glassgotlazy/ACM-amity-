import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Cursor } from "@/components/site/Cursor";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { PageTransition } from "@/components/site/PageTransition";
import { CommandPalette } from "@/components/site/CommandPalette";
import { SITE_URL } from "@/lib/site";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ACM BuildHub — ACM @ Amity University",
    template: "%s — ACM BuildHub",
  },
  description:
    "Real problems. Real projects. Real technical experience. ACM BuildHub is where students at Amity University find a problem worth solving, build a team around it, and leave with something they can show.",
  keywords: ["ACM", "Amity University", "student projects", "research", "AI", "quantum computing", "cybersecurity"],
  openGraph: {
    title: "ACM BuildHub — Build something worth showing.",
    description: "Real problems. Real projects. Real technical experience.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <ScrollProgress />
        <Cursor />
        <Navbar />
        <CommandPalette />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}

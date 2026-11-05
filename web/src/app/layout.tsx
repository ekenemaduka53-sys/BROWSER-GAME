import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { GAME_NAME, STORAGE_KEYS } from "@/lib/game/constants";

import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: GAME_NAME,
  description: "A friendly snake game with a live leaderboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6f5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1613" },
  ],
  // Let the game use the full screen on notched phones; the UI pads itself with safe-area insets.
  viewportFit: "cover",
};

/**
 * Runs before the page is painted: applies the saved theme (or the system
 * preference) so dark-mode players never see a flash of the light theme.
 */
const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.theme,
)});if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline script may add the "dark" class before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full overflow-hidden overscroll-none bg-garden-bg">{children}</body>
    </html>
  );
}

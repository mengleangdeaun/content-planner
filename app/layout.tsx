import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { cn } from "@/lib/utils";

// Inter with looped Khmer glyphs, so English and Khmer text share one typeface.
const fontSans = localFont({
  src: [
    { path: "../public/assets/fonts/InterKhmerLooped-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/assets/fonts/InterKhmerLooped-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/assets/fonts/InterKhmerLooped-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/assets/fonts/InterKhmerLooped-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    template: "%s · Content Planner",
    default: "Content Planner",
  },
  icons: { icon: "/assets/favicon.svg" },
  // Internal tool: no indexing, following, caching or previews. No description or social tags on purpose.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": 0, "max-image-preview": "none" },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", fontSans.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

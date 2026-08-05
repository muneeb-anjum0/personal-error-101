import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SecurityViolationMonitor } from "@/components/security/security-violation-monitor";
import "@/styles/globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-display"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MUNEEB.SYSTEMS",
    template: "%s / MUNEEB.SYSTEMS"
  },
  description: "Muneeb Anjum builds intelligent, secure, and useful full-stack systems.",
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: "MUNEEB.SYSTEMS",
    description: "Full-stack developer building intelligent, secure, and useful software.",
    siteName: "MUNEEB.SYSTEMS",
    type: "website",
    url: siteUrl
  },
  twitter: {
    card: "summary_large_image",
    title: "MUNEEB.SYSTEMS",
    description: "Full-stack developer building intelligent, secure, and useful software."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SecurityViolationMonitor />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

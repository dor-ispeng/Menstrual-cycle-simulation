import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Quicksand } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Menstrual Cycle Explorer",
  description: "An interactive simulation of menstrual physiology and reproductive endocrinology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${quicksand.variable} antialiased`}
    >
      <body>
        {children}
        {/* Vercel Analytics — reports only from the deployed site; a local
            dev/production server sends nothing, so an empty dashboard while
            testing on localhost is expected, not a misconfiguration. */}
        <Analytics />
      </body>
    </html>
  );
}

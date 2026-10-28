import type { Metadata } from "next";
import { Chewy, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const chewy = Chewy({ weight: "400", subsets: ["latin"], variable: "--font-chewy" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Clueless Closet",
  description: "Your closet, sorted. Your outfits, styled.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chewy.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}

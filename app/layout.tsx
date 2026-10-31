import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cormorant",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Closet",
  description: "Your wardrobe, styled for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">{children}</main>
      </body>
    </html>
  );
}

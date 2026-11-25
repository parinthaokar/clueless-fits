import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

// Inter is variable (covers 400–900). Libre Baskerville is static: 700 for the logo/headline.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const libreBaskerville = Libre_Baskerville({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
});

export const metadata: Metadata = {
  title: "Closet",
  description: "Your wardrobe, styled for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${libreBaskerville.variable}`}>
      {/* StoreProvider is here, not in (app)/layout, so a sign-in link that lands on the
          landing page (Supabase's fallback) still signs the user in. */}
      <body className="min-h-screen">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

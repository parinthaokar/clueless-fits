"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/closet", label: "Closet" },
  { href: "/stylist", label: "Stylist" },
  { href: "/try-on", label: "Try-On" },
  { href: "/saved", label: "Saved Outfits" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/closet" className="font-display text-2xl text-pink-deep">
          Clueless Closet
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-pink text-ink shadow-sm" : "text-ink/70 hover:bg-lilac"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* gingham accent strip */}
      <div className="gingham h-3 border-y border-pink/40" />
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/stylist", label: "Stylist" },
  { href: "/fitting-room", label: "Fitting Room" },
  { href: "/saved", label: "Saved" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/wardrobe" className="font-serif text-2xl tracking-[0.3em]">
          CLOSET
        </Link>
        <nav className="flex gap-6 sm:gap-8">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`label border-b pb-1 transition-colors ${
                  active ? "border-ink text-ink" : "border-transparent hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

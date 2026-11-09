"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo, Pill } from "@/components/ui";
import { currentUser, weather } from "@/lib/mockData";

const links = [
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/stylist", label: "Stylist" },
  { href: "/fitting-room", label: "Fitting Room" },
  { href: "/saved", label: "Saved" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navPills = links.map((link) => (
    <Pill key={link.href} href={link.href} selected={pathname.startsWith(link.href)}>
      {link.label}
    </Pill>
  ));

  return (
    <header className="border-b-2 border-ink bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center gap-2.5 px-5 py-4 sm:px-10">
        <Logo href="/" className="mr-2 sm:mr-6" />

        <nav aria-label="Main" className="hidden items-center gap-2.5 md:flex">
          {navPills}
        </nav>

        <div className="flex-1" />

        {/* Wrapper does the hiding: a display class on Pill itself would fight its inline-flex. */}
        <div className="hidden sm:block">
          <Pill size="sm" aria-label={`${weather.tempF}°F and ${weather.summary} in ${weather.city}`}>
            <span aria-hidden="true">{weather.icon}</span> {weather.tempF}°F {weather.city}
          </Pill>
        </div>
        <div
          role="img"
          aria-label={`Signed in as ${currentUser.name}`}
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-2 border-ink bg-mustard font-extrabold"
        >
          {currentUser.initial}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-[38px] w-[38px] place-items-center rounded-full border-2 border-ink bg-white md:hidden"
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          onClick={() => setOpen(false)}
          className="flex flex-wrap gap-2.5 border-t-2 border-ink px-5 py-4 md:hidden"
        >
          {navPills}
        </nav>
      )}
    </header>
  );
}

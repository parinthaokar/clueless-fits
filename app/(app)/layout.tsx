import Navbar from "@/components/Navbar";
import { StoreProvider } from "@/lib/store";

// Shell for the signed-in app pages (Wardrobe, Stylist, Fitting Room, Saved).
// The landing page at app/page.tsx sits outside this group and has its own header.
// StoreProvider shares the closet, saved looks and model choices across these pages.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Navbar />
      <main className="mx-auto max-w-[1280px] px-5 pt-7 pb-10 sm:px-10">{children}</main>
    </StoreProvider>
  );
}

import Link from "next/link";
import { Camera, Shirt, Sparkles } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import GarmentImage from "@/components/GarmentImage";
import { classLook } from "@/lib/mockData";

export default function Home() {
  return (
    <div className="-mt-10 sm:-mt-16">
      {/* Hero */}
      <section className="glow -mx-5 px-5 pb-20 pt-20 text-center sm:-mx-8 sm:px-8 sm:pt-28">
        <p className="label inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-accent">
          <Sparkles size={14} strokeWidth={1.5} /> Your personal AI stylist
        </p>
        <h1 className="mx-auto mt-8 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-7xl">
          Get dressed with intelligence.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
          Photograph what you own. Closet sorts it, styles it for any occasion, and shows you
          the look before you step out.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/stylist" className="label rounded-full bg-accent px-7 py-4 text-paper hover:opacity-90">
            Start styling
          </Link>
          <Link
            href="/wardrobe"
            className="label rounded-full border border-line px-7 py-4 transition-colors hover:border-ink hover:text-ink"
          >
            Open wardrobe
          </Link>
        </div>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-3xl rounded-3xl border border-line bg-stone/40 p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <p className="label flex items-center gap-2 text-accent">
            <Sparkles size={14} strokeWidth={1.5} /> Styled for you · {classLook.occasion}
          </p>
          <p className="label">{classLook.match}% style match</p>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {classLook.items.map(({ slot, item }) => (
            <div key={slot} className="group">
              <div className="aspect-[3/4] overflow-hidden rounded-xl">
                <GarmentImage src={item.imageUrl} alt={item.name} />
              </div>
              <p className="label mt-2">{slot}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-muted">{classLook.why}</p>
      </section>

      {/* How it works */}
      <section className="mt-24">
        <p className="label text-center">How it works</p>
        <h2 className="mt-3 text-center font-serif text-4xl sm:text-5xl">Three steps. No guesswork.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={Camera}
            step="01"
            title="Upload your pieces"
            text="Drop in a photo. Closet identifies each garment and files it in your wardrobe automatically."
          />
          <FeatureCard
            icon={Sparkles}
            step="02"
            title="Get styled by AI"
            text="Tell the stylist where you're going. It builds a complete look from what you already own."
          />
          <FeatureCard
            icon={Shirt}
            step="03"
            title="See it on you"
            text="Preview the outfit in the fitting room, rate it, and teach your stylist your taste."
          />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mt-24 rounded-3xl border border-line py-16 text-center">
        <h2 className="mx-auto max-w-xl font-serif text-4xl sm:text-5xl">Your best look is already in your closet.</h2>
        <Link href="/wardrobe" className="label mt-8 inline-block rounded-full bg-accent px-7 py-4 text-paper hover:opacity-90">
          Build my wardrobe
        </Link>
      </section>
    </div>
  );
}

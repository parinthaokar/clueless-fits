import { Suspense } from "react";
import StylistView, { type StylistParams } from "@/components/StylistView";

// /stylist, or /stylist?items=i9,i10,i1&occasion=Work&model=feminine&skin=c98e6b&hair=brown when "Ask the stylist"
// brings a look back from the Fitting Room.
// Reading searchParams must happen inside <Suspense> in this version of Next.js.
async function StylistContent({ searchParams }: { searchParams: Promise<StylistParams> }) {
  const { items, occasion, model, skin, hair } = await searchParams;
  return <StylistView params={{ items, occasion, model, skin, hair }} />;
}

export default function StylistPage({ searchParams }: { searchParams: Promise<StylistParams> }) {
  return (
    <Suspense fallback={null}>
      <StylistContent searchParams={searchParams} />
    </Suspense>
  );
}

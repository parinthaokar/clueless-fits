import { Suspense } from "react";
import FittingRoomView from "@/components/FittingRoomView";
import { classLook, getOutfitById } from "@/lib/mockData";
import { lookFromQuery } from "@/lib/outfit";
import type { ModelStyle } from "@/lib/types";

// The look comes from the URL:
//   /fitting-room?items=i9,i10,i1&occasion=Work&model=feminine   (from the Stylist, exact pieces)
//   /fitting-room?outfit=o2                                     (a saved look)
// Reading searchParams must happen inside <Suspense> in this version of Next.js.
type Params = { outfit?: string; items?: string; occasion?: string; model?: string };

async function FittingRoomContent({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const look = (params.items && lookFromQuery(params.items, params.occasion)) || getOutfitById(params.outfit) || classLook;
  const model: ModelStyle =
    params.model === "masculine" || params.model === "feminine" ? params.model : (look.model ?? "feminine");
  // key: a new URL starts a fresh fitting, not the previous one's swaps
  return <FittingRoomView key={JSON.stringify(params)} look={look} initialModel={model} />;
}

export default function FittingRoomPage({ searchParams }: { searchParams: Promise<Params> }) {
  return (
    <Suspense fallback={null}>
      <FittingRoomContent searchParams={searchParams} />
    </Suspense>
  );
}

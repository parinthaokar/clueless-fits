import { Suspense } from "react";
import FittingRoomView, { type FittingRoomParams } from "@/components/FittingRoomView";

// The look comes from the URL:
//   /fitting-room?items=i9,i10,i1&occasion=Work&model=feminine   (from the Stylist, exact pieces)
//   /fitting-room?saved=look-…                                   (a saved look, from /saved)
//   /fitting-room?outfit=o2                                      (a mock look by id)
// The closet and saved looks live in the client store, so FittingRoomView resolves the look.
// Reading searchParams must happen inside <Suspense> in this version of Next.js.
async function FittingRoomContent({ searchParams }: { searchParams: Promise<FittingRoomParams> }) {
  const { outfit, items, occasion, model, saved } = await searchParams;
  return <FittingRoomView params={{ outfit, items, occasion, model, saved }} />;
}

export default function FittingRoomPage({ searchParams }: { searchParams: Promise<FittingRoomParams> }) {
  return (
    <Suspense fallback={null}>
      <FittingRoomContent searchParams={searchParams} />
    </Suspense>
  );
}

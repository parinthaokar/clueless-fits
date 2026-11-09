import { Suspense } from "react";
import FittingRoomView from "@/components/FittingRoomView";
import { getOutfitById } from "@/lib/mockData";

// The look comes from the URL: /fitting-room?outfit=o2
// Reading searchParams must happen inside <Suspense> in this version of Next.js.
async function FittingRoomContent({ searchParams }: { searchParams: Promise<{ outfit?: string }> }) {
  const { outfit } = await searchParams;
  return <FittingRoomView outfit={getOutfitById(outfit)} />;
}

export default function FittingRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ outfit?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <FittingRoomContent searchParams={searchParams} />
    </Suspense>
  );
}

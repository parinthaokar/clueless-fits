import { Suspense } from "react";
import TryOnView from "@/components/TryOnView";
import { getOutfitById } from "@/lib/mockData";

// The outfit comes from the URL: /try-on?outfit=o2
// Reading searchParams must happen inside <Suspense> in this version of Next.js.
async function TryOnContent({ searchParams }: { searchParams: Promise<{ outfit?: string }> }) {
  const { outfit } = await searchParams;
  return <TryOnView outfit={getOutfitById(outfit)} />;
}

export default function TryOnPage({
  searchParams,
}: {
  searchParams: Promise<{ outfit?: string }>;
}) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <TryOnContent searchParams={searchParams} />
    </Suspense>
  );
}

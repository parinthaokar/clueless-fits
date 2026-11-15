"use client";

import { useState } from "react";
import EmptyState from "@/components/EmptyState";
import Model from "@/components/Model";
import { Button, Card, Pill, RatingDots, Tag } from "@/components/ui";
import { sortBySlot, toModelOutfit, withAppearance } from "@/lib/outfit";
import { useStore } from "@/lib/store";
import type { SavedOutfit } from "@/lib/types";

// Looks saved from the Stylist and the Fitting Room (lib/store.tsx), newest first.
// Ratings are the 1–5 "style fit" score; they can be given or changed here too.

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function SavedPage() {
  const { saved, deleteLook } = useStore();
  const [filter, setFilter] = useState("All");
  const [announcement, setAnnouncement] = useState("");

  const occasions = [...new Set(saved.map((l) => l.occasion))];
  // If the last look of the chosen occasion is deleted, fall back to All.
  const active = filter === "All" || occasions.includes(filter) ? filter : "All";
  const visible = active === "All" ? saved : saved.filter((l) => l.occasion === active);

  function remove(look: SavedOutfit) {
    deleteLook(look.id);
    setAnnouncement(`Deleted the ${look.occasion.toLowerCase()} look`);
  }

  return (
    <div>
      <h1 className="text-[28px] font-black tracking-[-0.01em]">Saved looks</h1>
      <p className="mt-1 mb-4 text-muted">
        {saved.length === 0
          ? "Looks you save show up here."
          : `${saved.length} ${saved.length === 1 ? "look" : "looks"} · rate them so the stylist learns what you like`}
      </p>

      {saved.length > 1 && occasions.length > 1 && (
        <div role="group" aria-label="Filter by occasion" className="mb-5 flex flex-wrap gap-2">
          {["All", ...occasions].map((o) => (
            <Pill
              key={o}
              size="sm"
              selected={o === active}
              onClick={() => setFilter(o)}
              count={o === "All" ? saved.length : saved.filter((l) => l.occasion === o).length}
            >
              {o}
            </Pill>
          ))}
        </div>
      )}

      {saved.length === 0 ? (
        <EmptyState title="No saved looks yet">
          <p className="w-full">Save a look from the Stylist or the Fitting Room and it shows up here.</p>
          <Button href="/stylist">Ask the stylist</Button>
          <Button variant="secondary" href="/fitting-room">
            Open the Fitting Room
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((look) => (
            <li key={look.id}>
              <SavedLookCard look={look} onDelete={() => remove(look)} />
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

function SavedLookCard({ look, onDelete }: { look: SavedOutfit; onDelete: () => void }) {
  const { modelStyle, skinTone, hairColor, rateLook } = useStore();
  const titleId = `saved-${look.id}`;
  const items = sortBySlot(look.items);

  return (
    <Card as="article" aria-labelledby={titleId} className="flex h-full flex-col p-4 sm:p-5">
      <div className="flex gap-4">
        <div className="w-[96px] shrink-0 rounded-[14px] border-[1.5px] border-track bg-cream px-1 pt-2 sm:w-[112px]">
          <Model
            style={look.model ?? modelStyle ?? "feminine"}
            skinTone={skinTone}
            hairColor={hairColor}
            outfit={toModelOutfit(items)}
            className="block h-auto w-full"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag>{look.occasion}</Tag>
            <Tag className="bg-white">
              <span className="sr-only">Saved </span>
              {formatDate(look.savedAt)}
            </Tag>
          </div>
          <h2 id={titleId} className="mt-2 text-lg leading-tight font-black">
            {look.occasion} look
          </h2>
          <ul className="mt-1.5 space-y-0.5 text-[13px] text-muted">
            {items.map(({ slot, item }) => (
              <li key={slot} className="truncate">
                <span className="text-[11px] font-extrabold tracking-[0.06em] text-ink uppercase">{slot}</span>{" "}
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm text-muted">Style fit:</span>
        <RatingDots value={look.rating} onChange={(n) => rateLook(look.id, n)} label={`Rate the ${look.occasion} look`} />
        {look.rating === 0 && <span className="text-[13px] text-muted">Not rated yet</span>}
      </div>

      <div className="mt-auto flex flex-wrap gap-3 pt-4">
        <Button href={`/fitting-room?${withAppearance(new URLSearchParams({ saved: look.id }), { skin: skinTone, hair: hairColor })}`}>Open in Fitting Room</Button>
        <Button variant="secondary" onClick={onDelete} aria-label={`Delete the ${look.occasion} look`}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

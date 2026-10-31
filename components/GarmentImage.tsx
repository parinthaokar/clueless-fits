// Garment photo on a neutral backdrop. Plain <img> so uploaded blob previews work too.
// Parent controls the size; the image zooms slowly when the parent has class "group".
export default function GarmentImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-full w-full overflow-hidden bg-stone">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
  );
}

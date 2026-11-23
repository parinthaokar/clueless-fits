// Three pulsing dots shown while the stylist "thinks".
export default function TypingIndicator() {
  return (
    <div className="fade-in">
      <p className="label">Stylist</p>
      <div className="mt-3 flex gap-1.5" aria-label="Stylist is thinking">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

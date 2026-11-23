import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  step: string;
  title: string;
  text: string;
}

export default function FeatureCard({ icon: Icon, step, title, text }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-stone/40 p-7 transition-colors hover:border-accent/50">
      <div className="flex items-center justify-between">
        <Icon size={22} strokeWidth={1.25} className="text-accent" />
        <span className="label">{step}</span>
      </div>
      <h3 className="mt-8 font-serif text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cx } from "./cx";

// Pill-shaped CTA with a hard ink shadow that presses down on click.
// variant="primary"   → raspberry, white text ("Save look", "Start my closet")
// variant="secondary" → white ("Cancel", "Try the demo closet")
// Renders a <Link> when href is set, otherwise a <button>.
// loading (buttons only): shows a spinner, disables the button and sets aria-busy.
type Common = {
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};
type AsLink = Common & { href: string };
type AsButton = Common & { href?: undefined; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary: "bg-raspberry text-white",
  secondary: "bg-white text-ink",
};

export default function Button(props: AsLink | AsButton) {
  const { variant = "primary", className, children } = props;
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink px-[22px] py-3",
    "text-[15px] font-extrabold shadow-button transition-[transform,box-shadow]",
    "active:translate-y-1 active:shadow-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raspberry",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-button",
    variants[variant],
    className,
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, className: _c, children: _ch, href: _h, type = "button", loading = false, disabled, ...buttonProps } = props;
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonProps}>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

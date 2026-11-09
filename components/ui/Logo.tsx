import Link from "next/link";
import { cx } from "./cx";

// Serif box on cream with an ink border and a hard ink shadow.
// variant="logo"     → the "Clueless Closet" wordmark (4px shadow)
// variant="headline" → the landing headline box (7px shadow); pass the text as children
interface Props {
  variant?: "logo" | "headline";
  href?: string;
  as?: "div" | "h1" | "h2" | "p";
  className?: string;
  children?: React.ReactNode;
}

const styles = {
  logo: "whitespace-nowrap border-[2.5px] px-3 py-1 text-xl leading-tight shadow-logo sm:text-2xl",
  headline:
    "border-[3px] px-5 py-3 text-[32px] leading-[1.08] shadow-headline sm:px-6 sm:py-4 sm:text-[56px]",
};

export default function Logo({ variant = "logo", href, as: Tag = "div", className, children }: Props) {
  const classes = cx(
    "inline-block border-ink bg-cream font-serif font-bold text-ink",
    styles[variant],
    className,
  );
  const content = children ?? "Clueless Closet";

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return <Tag className={classes}>{content}</Tag>;
}
